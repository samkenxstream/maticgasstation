#!/usr/bin/python3

from __future__ import annotations
from typing import Dict, Any
from json import dump


def toJSON(gprecs: Dict[str, Any], sinkForGasPrice: str) -> bool:
    '''
        Exports to JSON and writes into sink
    '''
    try:
        # writing JSON formatted gas prices for
        # {safelow, standard, fast} thresholds to sink
        if not sinkForGasPrice:
            print('[!]Bad file name !')

        with open(sinkForGasPrice, 'w') as fd:
            dump(gprecs, fd, indent=4)

        return True
    except Exception as e:
        print('Error: {}'.format(e))
        return False


if __name__ == '__main__':
    print('It is not supposed to be used that way !')
