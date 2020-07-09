#!/usr/bin/python3

from __future__ import annotations


class BlockTracker:
    """
        Block tracker i.e. which block is getting processed now
    """

    def __init__(self, blockId: int):
        self._currentBlockId = blockId

    @property
    def currentBlockId(self):
        return self._currentBlockId

    @currentBlockId.setter
    def currentBlockId(self, blockId: int):
        self._currentBlockId = blockId


if __name__ == '__main__':
    print('It is not supposed to be used that way !')
