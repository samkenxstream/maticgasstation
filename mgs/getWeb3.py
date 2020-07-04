#!/usr/bin/python3

from web3 import Web3, HTTPProvider, WebsocketProvider


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


if __name__ == '__main__':
    pass
