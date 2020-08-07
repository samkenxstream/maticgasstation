'use strict';

const dotnet = require('dotenv');
const path = require('path');
const Web3 = require('web3');

dotnet.config({ path: path.join(__dirname, '.env'), silent: true })

const SAFELOW = process.env.SAFELOW || 30;
const STANDARD = process.env.STANDARD || 60;
const FAST = process.env.FAST || 90;
const RPC = process.env.RPC || 'wss://ws-mumbai.matic.today';
const BUFFERSIZE = process.env.BUFFERSIZE || 500;

const getWeb3 = () => {
    return new Web3(new Web3.providers.WebsocketProvider(RPC));
};

const web3 = getWeb3();
