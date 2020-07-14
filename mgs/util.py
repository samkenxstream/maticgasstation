#!/usr/bin/python3

from __future__ import annotations
from pandas import DataFrame
from web3 import Web3
from web3.datastructures import AttributeDict
from typing import Tuple, Dict, Any
from math import nan, isnan
from .model.transaction import Transaction
from .model.block import Block


def processBlockTransactions(blockId: int, provider: Web3) -> Tuple[DataFrame, AttributeDict]:
    '''
        Obtains all transaction data from block,
        denoted by provided blockId and puts them into data frame,
        which is returned

        A 2-element tuple is returned i.e. block

        If block is empty, returns tuple of None - needs to be handled properly
    '''
    try:
        blockDF = DataFrame()
        blockObj = provider.eth.getBlock(blockId, True)
        if not len(blockObj.transactions):
            return (blockDF, None)

        for i in blockObj.transactions:
            tx = Transaction(i)
            blockDF = blockDF.append(
                tx.toDataFrame(),
                ignore_index=False)

        return(blockDF, blockObj)
    except Exception:
        return (blockDF, None)


def processBlockData(blockDF: DataFrame, blockObj: AttributeDict) -> DataFrame:
    '''
        Processes block data and puts into dataframe
    '''

    blockMinGasPrice = blockDF['gasPrice10GWei'].min() if len(
        blockObj.transactions) > 0 else nan

    block = Block(blockObj, blockObj.timestamp, blockMinGasPrice)

    return block.toDataFrame()


def getHPA(gasprice: int, hashpower: DataFrame) -> int:
    '''
        Returns the hash power accepting the gas price over last 200 blocks
    '''

    try:
        hpa = hashpower.loc[gasprice >= hashpower.index, 'hashp_pct']
        if gasprice > hashpower.index.max():
            hpa = 100
        elif gasprice < hashpower.index.min():
            hpa = 0
        else:
            hpa = hpa.max()

        return int(hpa)
    except Exception:
        return 50


def analyzeLastXblocks(block: int, blockData: DataFrame, x: int) -> DataFrame:
    '''
        analyses last X number of blocks, returns `hash power accepting dataframe`
        and average block interval time for last X blocks
    '''
    if not (x > 0):
        return (None, None)

    recentBlocks = blockData.loc[blockData['blockNumber'] >= (block-x),
                                 ['minGasPrice', 'blockNumber']]

    # create hashpower accepting dataframe based on mingasprice accepted in block
    hashpower = recentBlocks.groupby('minGasPrice').count()
    hashpower = hashpower.rename(columns={'blockNumber': 'count'})
    hashpower['cumBlocks'] = hashpower['count'].cumsum()
    totalblocks = hashpower['count'].sum()
    hashpower['hashp_pct'] = hashpower['cumBlocks']/totalblocks*100

    return hashpower


def makePredictionTable(hashpower: DataFrame) -> DataFrame:
    '''
        Generates prediction table
    '''
    pTableOne = DataFrame({'gasPrice', range(1000, 100000, 100)})
    pTableTwo = DataFrame({'gasPrice':  range(10, 1000, 10)})
    pTableThree = DataFrame({'gasPrice': range(0, 10, 1)})

    predictTable = pTableOne.append(pTableTwo).reset_index(drop=True)
    predictTable = predictTable.append(pTableThree).reset_index(drop=True)

    predictTable = predictTable.sort_values('gasPrice').reset_index(drop=True)
    predictTable['hashpower_accepting'] = predictTable['gasPrice'].apply(
        getHPA, args=(hashpower,))

    return predictTable


def getGasPriceRecommendations(prediction_table: DataFrame, block_time: float, block: int, config: Dict[str, int]) -> Dict[str, Any]:
    '''
        Generates gas price recommendation report as dictionary
    '''
    def get_safelow():
        series = prediction_table.loc[prediction_table['hashpower_accepting']
                                      >= config.get('safelow'), 'gasPrice']
        safelow = series.min()
        return float(safelow)

    def get_average():
        series = prediction_table.loc[prediction_table['hashpower_accepting']
                                      >= config.get('standard'), 'gasPrice']
        average = series.min()
        return float(average)

    def get_fast():
        series = prediction_table.loc[prediction_table['hashpower_accepting']
                                      >= config.get('fast'), 'gasPrice']
        fastest = series.min()
        return float(fastest)

    def get_fastest():
        hpmax = prediction_table['hashpower_accepting'].max()
        fastest = prediction_table.loc[prediction_table['hashpower_accepting']
                                       == hpmax, 'gasPrice'].values[0]
        return float(fastest)

    gprecs = {}
    gprecs['safeLow'] = get_safelow()/100
    gprecs['standard'] = get_average()/100
    gprecs['fast'] = get_fast()/100
    gprecs['fastest'] = get_fastest()/100
    gprecs['block_time'] = block_time
    gprecs['blockNum'] = block

    return gprecs


if __name__ == '__main__':
    print('It is not supposed to be used that way !')
