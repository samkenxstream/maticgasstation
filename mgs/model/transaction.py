#!/usr/bin/python3

from __future__ import annotations
from pandas import DataFrame
from math import ceil
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
            Utility function to convert to dataframe
        '''
        return DataFrame.from_dict(
            {self.hash: {'blockMined': int(self.blockMined),
                         'gasPrice': self.gasPrice,
                         'gasPrice10GWei': self.gasPrice10GWei}},
            orient='index')

    def _roundGasPrice10GWei(self) -> int:
        '''
            Rounds the gas price to gwei
        '''
        gp = self.gasPrice/1e7
        if gp >= 1 and gp < 100:
            gp = ceil(gp)
        elif gp >= 100 and gp < 2500:
            gp = gp/10
            gp = ceil(gp)
            gp = gp*10
        elif gp >= 2500:
            gp = gp/100
            gp = ceil(gp)
            gp = gp*100
        else:
            gp = 0
        return gp


if __name__ == '__main__':
    print('It is not supposed to be used that way !')
