#!/usr/bin/python3

from __future__ import annotations


class AveragBlockTime:
    '''
        Calculates average block time in network,
        keeps track of count of blocks processed, along with
        average block time upto now.

        Next it exposes methods using which average block time can be
        updated while considering newer blocks
    '''

    def __init__(self, prevBlockTS: int, curBlockTS: int, prevBlockId: int, curBlockId: int):
        self.count = 0
        self.avg = .0
        self.prevBlockTS = prevBlockTS
        self.curBlockTS = curBlockTS
        self.prevBlockId = prevBlockId
        self.curBlockId = curBlockId

    def _updateBlockTime(self, val: float):
        '''
            Calculates new average block time
        '''
        prevTotal = self.count * self.avg
        self.count += 1
        self.avg = (prevTotal + val) / self.count

    def _validate(self, _id: int) -> bool:
        return self.curBlockId < _id

    def updateTimeStampAndId(self, _ts: int, _id: int):
        '''
            Updates blockId and blocktimestamp with new block
            that came in, and recalculates average block time, 
            with this newly created block

            Previously processed block can be sent in again - ignores 
            updating average block time
        '''
        if not self._validate(_id):
            return

        self.prevBlockTS = self.curBlockTS
        self.prevBlockId = self.curBlockId
        self.curBlockTS = _ts
        self.curBlockId = _id

        self._updateBlockTime(self.curBlockTS - self.prevBlockTS)


if __name__ == '__main__':
    print('It is not supposed to be used that way !')
