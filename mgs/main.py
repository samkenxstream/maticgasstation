#!/usr/bin/python3

from __future__ import annotations
from pandas import DataFrame
from web3 import Web3
from typing import Dict, Tuple, Any
from .model.transaction import Transaction
from .model.blockTracker import BlockTracker
from .model.avgBlockTime import AveragBlockTime
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


def updateDataFrames(block: int, allTx: DataFrame, blockData: DataFrame, avgBlockTime: AveragBlockTime, provider: Web3, config: Dict[str, Any], sinkForGasPrice: str) -> Tuple[DataFrame, DataFrame, bool]:
    '''
        Adds new block data to main dataframes {allTx, blockData}, and releases 
        recommended gas prices while considering this block
    '''
    _success = False
    try:
        (mined_blockdf, block_obj) = processBlockTransactions(
            block,
            provider)

        # empty block could have been received, but this was not handled properly
        # before, now it'll be taken care of
        if not (not mined_blockdf.empty and block_obj):
            print('[-]Empty block : {} !'.format(block))

            avgBlockTime.count += 1

            raise Exception('Empty Block !')

        avgBlockTime.updateTimeStampAndId(
            block_obj.timestamp, block_obj.number)

        allTx = allTx.combine_first(mined_blockdf)

        block_sumdf = processBlockData(mined_blockdf, block_obj)

        blockData = blockData.append(
            block_sumdf, ignore_index=True)

        hashpower = analyzeLastXblocks(
            block, blockData, int(config['pastBlockCount']))
        predictiondf = makePredictionTable(hashpower)

        toJSON(getGasPriceRecommendations(predictiondf,
                                          avgBlockTime.avg,
                                          block,
                                          config),
               sinkForGasPrice)
        _success = True
    except Exception:
        _success = False
    finally:
        return (allTx, blockData, _success)


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

    avgBlockTime = AveragBlockTime(provider)

    blockTracker.currentBlockId = provider.eth.blockNumber

    while True:
        try:

            _blockNumber = provider.eth.blockNumber

            if blockTracker.currentBlockId < _blockNumber:
                # updating data frame content, analyzing last 200 blocks,
                # generating results, putting them into sink files
                #
                # try to catch upto latest block - that's why this inner loop
                for i in range(blockTracker.currentBlockId, _blockNumber+1):
                    allTx, blockData, _success = updateDataFrames(i,
                                                                  allTx,
                                                                  blockData,
                                                                  avgBlockTime,
                                                                  provider,
                                                                  config,
                                                                  sinkForGasPrice)

                    if _success:
                        print(
                            '[+]Considered upto latest block : {}'.format(i))

                blockTracker.currentBlockId = _blockNumber
            elif blockTracker.currentBlockId == _blockNumber:
                allTx, blockData, _success = updateDataFrames(blockTracker.currentBlockId,
                                                              allTx,
                                                              blockData,
                                                              avgBlockTime,
                                                              provider,
                                                              config,
                                                              sinkForGasPrice)

                if _success:
                    print(
                        '[+]Considered upto latest block : {}'.format(blockTracker.currentBlockId))
                blockTracker.currentBlockId = blockTracker.currentBlockId + 1
            else:
                pass

        except Exception as e:
            print('[!]{}'.format(e))

        # sleep for 1 second, and then go for next iteration, for fetching new block
        sleep(1)

    return True


if __name__ == '__main__':
    main()
