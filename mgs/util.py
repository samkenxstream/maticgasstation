#!/usr/bin/python3

from __future__ import annotations
from pandas import DataFrame
from web3 import Web3
from web3.datastructures import AttributeDict
from typing import Tuple
from math import nan
from .model.transaction import Transaction
from .model.block import Block


def processBlockTransactions(blockId: int, provider: Web3) -> Tuple[DataFrame, AttributeDict]:
    '''
        Obtains all transaction data from block,
        denoted by provided blockId and puts them into data frame,
        which is returned

        A 2-element tuple is returned i.e. block
    '''
    try:
        blockDF = DataFrame()
        blockObj = provider.eth.getBlock(blockId, True)

        for i in blockObj.transactions:
            tx = Transaction(i)
            blockDF = blockDF.append(
                tx.toDataFrame(),
                ignore_index=False)

        blockObj['timestamp'] = blockObj.timestamp

        return(blockDF, blockObj)
    except Exception:
        return (None, None)


def processBlockData(blockDF: DataFrame, blockObj: AttributeDict) -> DataFrame:
    '''
        Processes block data and puts into dataframe
    '''

    blockMinGasPrice = blockDF['gasPrice10GWei'].min() if len(
        blockObj.transactions) > 0 else nan

    timestamp = blockDF['timestamp'].min()
    block = Block(blockObj, timestamp, blockMinGasPrice)

    return block.toDataFrame()


def getHPA(gasprice: int, hashpower: DataFrame):
    '''
        Returns the hash power accepting the gas price over last 200 blocks
    '''
    hpa = hashpower.loc[gasprice >= hashpower.index, 'hashp_pct']
    if gasprice > hashpower.index.max():
        hpa = 100
    elif gasprice < hashpower.index.min():
        hpa = 0
    else:
        hpa = hpa.max()

    return int(hpa)


if __name__ == '__main__':
    print('It is not supposed to be used that way !')
