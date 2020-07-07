#!/usr/bin/python3

from __future__ import annotations
from typing import Dict, Any
from json import dump


def toJSON(gprecs: Dict[str, Any], predictionTable, sinkForGasPrice: str, sinkForPredictionTable: str) -> bool:
    '''
        Exports to JSON and writes into sink
    '''
    try:
        predictionTable['gasPrice'] /= 10
        predictionTableOut = predictionTable.to_json(orient='records')

        # writing JSON formatted gas prices for
        # {safelow, standard, fast} thresholds to sink
        with open(sinkForGasPrice, 'w') as fd:
            dump(gprecs, fd, indent=4)

        # writing JSON formatted prediction table output to sink
        with open(sinkForPredictionTable, 'w') as fd:
            fd.write(predictionTableOut)

        return True
    except Exception as e:
        print('Error: {}'.format(e))
        return False


if __name__ == '__main__':
    print('It is not supposed to be used that way !')
