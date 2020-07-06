#!/usr/bin/python3

from __future__ import annotations
from typing import Dict
from os.path import exists
from json import load


def parseConfig(src: str) -> Dict[str, int]:
    '''
        Given path to config file, returns a dictionary
        holding keys and corresponding values
    '''
    if not exists(src):
        return None

    try:
        _config = None
        with open(src, 'r') as fd:
            _config = load(fd)

        if not _config:
            return None

        return _config
    except Exception:
        return None


if __name__ == '__main__':
    print('It is not supposed to be used that way !')
