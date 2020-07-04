#!/usr/bin/python3

from __future__ import annotations
from web3 import Web3, HTTPProvider, WebsocketProvider
from web3.middleware import geth_poa_middleware


def connectToHTTPEndPointUsingURI(uri: str) -> Web3:
    '''
        Given a preformatted HTTP URI, returns web3 connection 
    '''
    if not uri:
        return None

    return Web3(HTTPProvider(uri))


def connectToHTTPEndPoint(protocol: str, hostname: str, port: str) -> Web3:
    '''
        Connects to an HTTP RPC endpoint, all args are required

        - protocol must be one of {http, https}

        - port needs to be >=1 && <2^16

        - returns a web3 connection
    '''
    if not (protocol and hostname and port):
        return None

    if protocol not in ['http', 'https']:
        return None

    if port not in range(1, 2**16):
        return None

    return Web3(HTTPProvider('{}://{}:{}'.format(protocol, hostname, port)))


def connectToWebSocketEndPointUsingURI(uri: str) -> Web3:
    '''
        Given a preformatted WebSocket URI, returns web3 connection 
    '''
    if not uri:
        return None

    return Web3(WebsocketProvider(uri))


def connectToWebSocketEndPoint(protocol: str, hostname: str, port: str) -> Web3:
    '''
        Connects to an WebSocket RPC endpoint, all args are required

        - protocol must be one of {ws, wss}

        - port needs to be >=1 && <2^16

        - returns a web3 connection
    '''
    if not (protocol and hostname and port):
        return None

    if protocol not in ['ws', 'wss']:
        return None

    if port not in range(1, 2**16):
        return None

    return Web3(WebsocketProvider('{}://{}:{}'.format(protocol, hostname, port)))


def injectPoAMiddleWare(provider: Web3):
    '''
        While talking to PoA based endpoint, web3 requires this
        onion layer, which is to be used while passing JSON RPC requests/ responses

        Consider passing your provider instance through this function, to get that facility
    '''
    provider.middleware_onion.inject(geth_poa_middleware, layer=0)


if __name__ == '__main__':
    pass
