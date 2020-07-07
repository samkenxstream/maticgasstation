#!/usr/bin/python3

from __future__ import annotations
from pandas import DataFrame
from web3.datastructures import AttributeDict


class Block:
    '''
        Block related information holder, can also be exported to pandas dataframe
    '''

    def __init__(self, blockObj: AttributeDict, timestamp: int, minGasPrice: int = None):
        self.blockNumber = blockObj.number
        self.blockHash = blockObj.hash
        self.minGasPrice = minGasPrice
        self.timestamp = timestamp

    def toDataFrame(self) -> DataFrame:
        '''
            Utility function to convert to dataframe
        '''
        return DataFrame.from_dict(
            {0:
             {'blockNumber': self.blockNumber,
              'blockHash': self.blockHash,
              'minGasPrice': self.minGasPrice,
              'timestamp': self.timestamp}},
            orient='index')


if __name__ == '__main__':
    print('It is not supposed to be used that way !')
