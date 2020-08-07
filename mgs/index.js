const dotnet = require('dotenv')
const path = require('path')
const Web3 = require('web3')
const Recommendation = require('./recommendation')
const Transaction = require('./transaction')
const Transactions = require('./transactions')

dotnet.config({ path: path.join(__dirname, '.env'), silent: true })

const SAFELOW = process.env.SAFELOW || 30
const STANDARD = process.env.STANDARD || 60
const FAST = process.env.FAST || 90
const RPC = process.env.RPC || 'wss://ws-mumbai.matic.today'
const BUFFERSIZE = process.env.BUFFERSIZE || 500

const getWeb3 = () => {
    return new Web3(new Web3.providers.WebsocketProvider(RPC))
}

const getBlockTime = async _web3 => {
    let latestBlock = await _web3.eth.getBlock('latest')
    let prevBlock = await _web3.eth.getBlock(latestBlock.number - 1)
    return latestBlock.timestamp - prevBlock.timestamp
}

const updateBlockTime = (_rec, _web3) => {
    _rec.blockTime = getBlockTime(_web3)
}

const fetchBlockAndProcess = async _web3 => {
    let latestBlock = _web3.eth.getBlock('latest');
}


const web3 = getWeb3()
const recommendation = new Recommendation()

setInterval(updateBlockTime, 60000, recommendation, web3)
