#!/usr/bin/python3

from __future__ import annotations
from typing import Dict, List, Any
from os.path import exists
from json import load
from functools import reduce
from math import ceil


def validateConfig(config: Dict[str, Any]) -> bool:
    '''
        Given parsed content of config file, validates it
        and returns true on success, else false

        Note: This needs to be satisfied, safelow < standard < fast

        RPC endpoint to be used for connection needs to be passed under
        `rpc` key
    '''
    def _validateThreshold(key: str) -> bool:
        return config[key] >= 0 and config[key] <= 100

    if not config:
        return False

    try:
        return _validateThreshold('safelow') and\
            _validateThreshold('standard') and\
            _validateThreshold('fast') and\
            (config['safelow'] < config['standard'] and
             config['standard'] < config['fast']) and\
            config['rpc'] and\
            int(config['pastBlockCount']) > 0
    except Exception:
        return False


def parseConfig(src: str) -> Dict[str, Any]:
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

        # first validates, if okay, only then instance is returned
        if not validateConfig(_config):
            return None

        return _config
    except Exception:
        return None


if __name__ == '__main__':
    print('It is not supposed to be used that way !')
