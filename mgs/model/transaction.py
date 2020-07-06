#!/usr/bin/python3

from __future__ import annotations
from pandas import DataFrame
from math import floor
from web3.datastructures import AttributeDict


class Transaction:
    '''
        Holder of transaction related info, can export to DataFrame
    '''

    def __init__(self, txObj: AttributeDict):
        # has of transaction
        self.hash = txObj.hash
        # block number of transaction
        self.blockMined = txObj.blockNumber
        # gas price in transaction
        self.gasPrice = txObj.gasPrice
        self.gasPrice10GWei = self._roundGasPrice10GWei()

    def toDataFrame(self) -> DataFrame:
        '''
            Utility function to convert to dataframeI
        '''
        return DataFrame.from_dict(
            {self.hash: {'blockMined': self.blockMined,
                         'gasPrice': self.gasPrice,
                         'gasPrice10GWei': self.gasPrice10GWei}},
            orient='index')

    def _roundGasPrice10GWei(self) -> int:
        '''
            Rounds the gas price to gwei
        '''
        gp = self.gasPrice/1e8
        if gp >= 1 and gp < 10:
            gp = floor(gp)
        elif gp >= 10:
            gp = gp/10
            gp = floor(gp)
            gp = gp*10
        else:
            gp = 0
        return gp


if __name__ == '__main__':
    print('It is not supposed to be used that way !')
