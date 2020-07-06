#!/usr/bin/python3

from __future__ import annotations
from pandas import DataFrame
from web3 import Web3
from web3.datastructures import AttributeDict
from typing import Tuple
from .model.transaction import Transaction


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


if __name__ == '__main__':
    print('It is not supposed to be used that way !')
