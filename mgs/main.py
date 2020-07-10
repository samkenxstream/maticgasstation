#!/usr/bin/python3

from __future__ import annotations
from pandas import DataFrame
from web3 import Web3
from typing import Dict, Tuple
from .model.transaction import Transaction
from .model.blockTracker import BlockTracker
from .util import (
    processBlockTransactions,
    processBlockData,
    analyzeLastXblocks,
    makePredictionTable,
    getGasPriceRecommendations
)
from .export import toJSON
from .getWeb3 import (
    connectToHTTPEndPointUsingURI,
    connectToWebSocketEndPointUsingURI,
    injectPoAMiddleWare
)
from .getConfig import (
    parseConfig,
)
from os.path import exists, abspath
from time import sleep, time
from argparse import ArgumentParser


def init(block: int, x: int, provider: Web3) -> Tuple[DataFrame, DataFrame]:
    allTx = DataFrame()
    blockData = DataFrame()

    print('[*]Loading past {} non-empty blocks ...'.format(x))

    _done = 0
    while(_done < x):
        try:
            (mined_blockdf, block_obj) = processBlockTransactions(block, provider)

            if not (not mined_blockdf.empty and block_obj):
                print('[-]Empty block : {} !'.format(block))
                continue

            print('[+]Fetched block : {}'.format(block))
            allTx = allTx.combine_first(mined_blockdf)

            block_sumdf = processBlockData(mined_blockdf, block_obj)
            blockData = blockData.append(block_sumdf, ignore_index=True)

            _done += 1
        except Exception:
            pass
        finally:
            block -= 1

    return allTx, blockData


def updateDataFrames(block: int, allTx: DataFrame, blockData: DataFrame, provider: Web3, config: Dict[str, Any], sinkForGasPrice: str):
    '''
        Adds new block data to main dataframes {allTx, blockData}, and releases 
        recommended gas prices while considering this block
    '''
    try:
        (mined_blockdf, block_obj) = processBlockTransactions(
            block,
            provider)
        allTx = allTx.combine_first(mined_blockdf)

        block_sumdf = processBlockData(mined_blockdf, block_obj)

        blockData = blockData.append(
            block_sumdf, ignore_index=True)

        (hashpower, block_time) = analyzeLastXblocks(
            block, blockData, int(config['pastBlockCount']))
        predictiondf = makePredictionTable(block, allTx, hashpower, block_time)

        toJSON(getGasPriceRecommendations(predictiondf,
                                          block_time,
                                          block,
                                          config),
               sinkForGasPrice)
    except Exception:
        pass


def _getCMDArgs() -> Tuple[str, str]:
    '''
        While invoking script, config file path needs to be passed
        along with sink filepaths for gasprice

        Expecting both of them to have JSON extension

        Returns absolute path of these two files
    '''
    parser = ArgumentParser()
    parser.add_argument('config_file', type=str,
                        help='Path to configuration file ( JSON )')
    parser.add_argument('sink_for_gas_price', type=str,
                        help='Path to sink file, for putting recommened gas prices ( JSON )')

    args = parser.parse_args()

    if not (args.config_file and args.sink_for_gas_price):
        return (None, None)

    if not (args.config_file.endswith('.json') and
            exists(args.config_file) and
            args.sink_for_gas_price.endswith('.json')):
        return (None, None)

    return tuple(map(lambda e: abspath(e),
                     [args.config_file, args.sink_for_gas_price]))


def main() -> bool:
    '''
        Main entry point of app

        Remote RPC endpoint needs to be supplied as URI
    '''
    configFile, sinkForGasPrice = _getCMDArgs()
    if not (configFile and sinkForGasPrice):
        print('[!]Bad invocation !')
        return False

    config = parseConfig(configFile)
    if not config:
        print('[!]Bad config !')
        return False

    provider = connectToHTTPEndPointUsingURI(config['rpc']) if config['rpc'].startswith(
        'http') else connectToWebSocketEndPointUsingURI(
            config['rpc']) if config['rpc'].startswith('ws') else None
    if not provider:
        print('[!]Bad RPC provider !')
        return False

    # this line is required when talking to node which is part of network using
    # PoA based consensus mechanism i.e. Goerli/ Ropsten/ Matic Mumbai Testnet/ Matic Testnet v3
    #
    # If it does cause issue, please consider commenting immediate below line
    #
    injectPoAMiddleWare(provider)

    start = time()
    _blockNumber = provider.eth.blockNumber
    blockTracker = BlockTracker(_blockNumber)

    # initializing by fetching last 100 blocks of data
    allTx, blockData = init(_blockNumber, int(
        config['pastBlockCount']), provider)

    if allTx.empty and blockData.empty:
        print('[!]Initialization failed !')
        return False

    print('[+]Initialization completed in : {} s\n'.format(time() - start))

    blockTracker.currentBlockId = provider.eth.blockNumber

    while True:
        try:

            if (blockTracker.currentBlockId <= provider.eth.blockNumber):
                # updating data frame content, analyzing last 200 blocks,
                # generating results, putting them into sink files
                updateDataFrames(blockTracker.currentBlockId,
                                 allTx,
                                 blockData,
                                 provider,
                                 config,
                                 sinkForGasPrice)

                print(
                    '[+]Considered upto latest block : {}'.format(blockTracker.currentBlockId))
                blockTracker.currentBlockId = blockTracker.currentBlockId + 1

        except Exception as e:
            print('[!]{}'.format(e))

        # sleep for 1 second, and then go for next iteration, for fetching new block
        sleep(1)

    return True


if __name__ == '__main__':
    main()
