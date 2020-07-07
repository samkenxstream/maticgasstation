#!/usr/bin/python3

from __future__ import annotations
from pandas import DataFrame
from web3 import Web3
from typing import Dict, Tuple
from .model.transaction import Transaction
from .model.timers import Timers
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
from sys import argv
from os.path import exists
from time import sleep


def init(block: int, config: Dict[str, int], x: int, provider: Web3) -> Tuple[DataFrame, DataFrame]:
    allTx = DataFrame()
    blockData = DataFrame()

    print("[+]MATIC Gas Station\n")
    print("\n[*]Safelow = {} % of blocks accepting. Usually confirms in less than 30min.".format(
        config.get('safelow')))
    print("\n[*]Standard = {} % of blocks accepting. Usually confirms in less than 5min.".format(
        config.get('standard')))
    print("\n[*]Fast = {} % of blocks accepting. Usually confirms in less than 1min.".format(
        config.get('fast')))
    print("\n[*]Fastest = all blocks accepting.  As fast as possible but you are probably overpaying.")

    print("\n[*]Now loading gasprice data from last {} blocks ...".format(x))

    for pastblock in range((block - x), (block), 1):
        (mined_blockdf, block_obj) = processBlockTransactions(pastblock, provider)

        allTx = allTx.combine_first(mined_blockdf)

        block_sumdf = processBlockData(mined_blockdf, block_obj)
        blockData = blockData.append(block_sumdf, ignore_index=True)

    print("\nPress ctrl-c at any time to stop monitoring\n")
    print("**** And the oracle says...**** \n")

    return allTx, blockData


def updateDataFrames(block: int, allTx: DataFrame, blockData: DataFrame, provider: Web3, x: int, config: Dict[str, int], sinkForGasPrice: str, sinkForPredictionTable: str):
    '''
        Adds new block data to main dataframes {allTx, blockData}, and releases 
        recommended gas prices while considering this block
    '''
    try:
        mined_block_num = block-3

        (mined_blockdf, block_obj) = processBlockTransactions(
            mined_block_num,
            provider)
        allTx = allTx.combine_first(mined_blockdf)

        block_sumdf = processBlockData(mined_blockdf, block_obj)

        blockData = blockData.append(block_sumdf, ignore_index=True)

        (hashpower, block_time) = analyzeLastXblocks(block, blockData, x)
        predictiondf = makePredictionTable(block, allTx, hashpower, block_time)

        toJSON(getGasPriceRecommendations(predictiondf,
                                          block_time,
                                          block,
                                          config),
               predictiondf,
               sinkForGasPrice,
               sinkForPredictionTable)
    except Exception as e:
        print('[!]Error: {}'.format(e))


def _getCMDArg() -> Tuple[str, str, str]:
    '''
        While invoking script, config file path needs to be passed
        along with sink filepaths for gasprice and prediction table

        All of them needs to be json formatted
    '''
    return tuple(argv[1:]) if len(argv) == 4 else (None, None, None)


def main(remote: str) -> bool:
    '''
        Main entry point of app

        Remote RPC endpoint needs to be supplied as URI
    '''
    configFile, sinkForGasPrice, sinkForPredictionTable = _getCMDArg()

    if not (configFile and sinkForGasPrice and sinkForPredictionTable):
        return False

    if not (sinkForGasPrice.endswith('.json') and sinkForPredictionTable.endswith('.json')):
        return False

    if not (exists(configFile) and configFile.endswith('.json')):
        return False

    config = parseConfig(configFile)
    if not config:
        return False

    provider = connectToHTTPEndPointUsingURI(remote)
    if not provider:
        return False

    # this line is required when talking to node which is part of network using
    # PoA based consensus mechanism i.e. Matic/ Goerli/ Ropsten
    #
    # If it does cause issue, please consider commenting immediate below line
    injectPoAMiddleWare(provider)

    _blockNumber = provider.eth.blockNumber
    timers = Timers(_blockNumber)

    # initializing by fetching last 100 blocks of data
    allTx, blockData = init(_blockNumber, config, 100, provider)

    while True:
        try:
            _blockNumber = provider.eth.blockNumber
            if (timers.processBlock < _blockNumber):
                # updating data frame content, analyzing last 200 blocks,
                # generating results, putting them into sink files
                updateDataFrames(timers.processBlock,
                                 allTx,
                                 blockData,
                                 provider,
                                 200,
                                 config,
                                 sinkForGasPrice,
                                 sinkForPredictionTable)
                timers.processBlock += 1
        except KeyboardInterrupt:
            print('\n[!]Terminated')
            break
        except Exception as e:
            print('[!]Error: {}'.format(e))

        # sleep for 1 second, and then go for next iteration
        sleep(1)

    return True


if __name__ == '__main__':
    main('http://localhost:8545')
