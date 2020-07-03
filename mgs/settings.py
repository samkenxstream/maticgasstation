#!/usr/bin/python3

from __future__ import annotations

import configparser
import os
import sys

from web3 import Web3, HTTPProvider, WebsocketProvider, IPCProvider

'''
    Matic RPC: https://rpc-mumbai.matic.today/

    To be worked on later
'''


def loadSettings(settingsFile: str) -> configparser.ConfigParser:
    '''
        Configuration file parser, which holds info
        related to RPC endpoint, to which `maticgasstation` will talk
    '''
    if not settingsFile:
        return None

    parserInstance = configparser.ConfigParser()
    parserInstance.read(settingsFile)

    return parserInstance


def getSetting(instance: configparser.ConfigParser, section: str, name: str) -> str:
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


def get_web3_provider(protocol=None, hostname=None, port=None, timeout=None):
    """Get Web3 instance. Supports websocket, http, ipc."""
    if protocol is None:
        protocol = get_setting('rpc', 'protocol')
    if hostname is None:
        hostname = get_setting('rpc', 'hostname')
    if port is None:
        port = get_setting('rpc', 'port')
    if timeout is None:
        try:
            timeout = int(get_setting('rpc', 'timeout'))
        except KeyError:
            timeout = 15  # default timeout is 15 seconds

    if protocol == 'ws' or protocol == 'wss':
        provider = WebsocketProvider(
            "%s://%s:%s" % (
                protocol,
                hostname,
                port),
            websocket_kwargs={'timeout': timeout}
        )
        provider.egs_timeout = timeout
        return Web3(provider)
    elif protocol == 'http' or protocol == 'https':
        provider = HTTPProvider(
            "%s://%s:%s" % (
                protocol,
                hostname,
                port),
            request_kwargs={'timeout': timeout}
        )
        provider.egs_timeout = timeout
        return Web3(provider)
    elif protocol == 'ipc':
        provider = IPCProvider(
            hostname,
            timeout=timeout
        )
        provider.egs_timeout = timeout
        return Web3(provider)
    else:
        raise Exception("Can't set web3 provider type %s" % str(protocol))


def get_mysql_connstr():
    """Get a MySQL connection string for SQLAlchemy, or short circuit to
    SQLite for a dev mode."""
    if "USE_SQLITE_DB" in os.environ:
        sqlite_db_path = os.path.join(os.getcwd(), os.environ["USE_SQLITE_DB"])
        connstr = "sqlite:///%s" % (sqlite_db_path)
        return connstr

    connstr = "mysql+mysqlconnector://%s:%s@%s:%s/%s" % (
        get_setting('mysql', 'username'),
        get_setting('mysql', 'password'),
        get_setting('mysql', 'hostname'),
        get_setting('mysql', 'port'),
        get_setting('mysql', 'database')
    )
    return connstr
