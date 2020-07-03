#!/usr/bin/python3

from __future__ import annotations
from configparser import ConfigParser
from web3 import Web3, HTTPProvider
from web3.middleware import geth_poa_middleware

'''
    Matic RPC: https://rpc-mumbai.matic.today/

    To be worked on later
'''


def loadSettings(settingsFile: str) -> ConfigParser:
    '''
        Configuration file parser, which holds info
        related to RPC endpoint, to which `maticgasstation` will talk
    '''
    if not settingsFile:
        return None
    try:
        parserInstance = ConfigParser()
        parserInstance.read(settingsFile)

        return parserInstance
    except Exception:
        return None


def getSetting(instance: ConfigParser, section: str, name: str) -> str:
    '''
        Given settings section and name, it'll return corresponding value

        Much like looking up value from a HashMap/ Dict using key

        If not present, returns None
    '''

    if section in instance:
        if name in instance[section]:
            return instance[section][name]

        return None

    return None


def getRPC(settingsFile: str) -> Web3:
    '''
        Establishes web3 connection to RPC endpoint,
        given in config file

        Currently supporting only HTTP/s provider
    '''

    instance = loadSettings(settingsFile)
    if not instance:
        return None

    protocol = getSetting(instance, 'rpc', 'protocol')
    if not protocol:
        return None

    hostname = getSetting(instance, 'rpc', 'hostname')
    if not hostname:
        return None

    port = getSetting(instance, 'rpc', 'port')
    if not port:
        return None

    timeout = getSetting(instance, 'rpc', 'timeout')
    if not timeout:
        return None

    return Web3(
        HTTPProvider('{}://{}:{}'.format(protocol, hostname, port),
                     request_kwargs={'timeout': timeout}))


def setPOAMiddleWare(web3Provider: Web3):
    '''
        This is required when connected node is part of network
        using PoA as consensus mechanism

        This onion layer will encode and decode data while talking to
        rpc endpoint providing node
    '''
    web3Provider.middleware_onion.inject(geth_poa_middleware, layer=0)


if __name__ == '__main__':
    print('This script is not supposed to be invoked this way !')
