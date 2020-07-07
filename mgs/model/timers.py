#!/usr/bin/python3

from __future__ import annotations


class Timers:
    """
        Block tracker i.e. which block is getting processed now
    """

    def __init__(self, startBlock: int):
        self.startBlock = startBlock
        self.currentBlock = startBlock
        self.processBlock = startBlock

    def update(self, block: int):
        self.currentBlock = block
        self.processBlock += 1


if __name__ == '__main__':
    print('It is not supposed to be used that way !')
