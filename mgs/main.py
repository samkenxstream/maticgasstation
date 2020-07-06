#!/usr/bin/python3

from __future__ import annotations
from pandas import DataFrame
from web3 import Web3
from typing import Dict, Tuple
from .model.transaction import Transaction
from .util import (
    processBlockTransactions,
    processBlockData
)


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

    print("\n[*]Now loading gasprice data from last {} blocks...give me a minute".format(x))

    for pastblock in range((block - x), (block), 1):
        (mined_blockdf, block_obj) = processBlockTransactions(pastblock, provider)

        allTx = allTx.combine_first(mined_blockdf)

        block_sumdf = processBlockData(mined_blockdf, block_obj)
        blockData = blockData.append(block_sumdf, ignore_index=True)

    print("Done. now reporting gasprice recs in gwei: \n")
    print("\npress ctrl-c at any time to stop monitoring\n")
    print("**** And the oracle says...**** \n")

    return allTx, blockData


def appendNewTransaction(allTx: DataFrame, newTx: Transaction) -> DataFrame:
    '''
        Appends new transactions in all transaction holder data frameI
    '''
    if newTx.hash not in allTx.index:
        alltx = alltx.append(newTx.to_dataframe(), ignore_index=False)

    return allTx


def main():
    '''
        Main entry point of app
    '''
    pass


if __name__ == '__main__':
    main()
