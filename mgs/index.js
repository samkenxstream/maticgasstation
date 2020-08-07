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
const SINK = process.env.SINK || '../sink.json'

const getWeb3 = () => new Web3(new Web3.providers.WebsocketProvider(RPC))

const getBlockTime = async _web3 => {
    let latestBlock = await _web3.eth.getBlock('latest')
    let prevBlock = await _web3.eth.getBlock(latestBlock.number - 1)
    return latestBlock.timestamp - prevBlock.timestamp
}

const updateBlockTime = (_web3, _rec) => {
    getBlockTime(_web3).then(v => {
        _rec.blockTime = v
    })
}

const processTransaction = async (_web3, _hash, _transactions) => {
    let _transaction = await _web3.eth.getTransaction(_hash)
    _transactions.add(new Transaction(_transaction.blockNumber, parseInt(_transaction.gasPrice, 10) / 1e9))
}

const processBlock = async (_web3, _transactions, _block) => {
    console.log(`[+]Processing Block : ${_block.number}`)
    for (let i = 0; i < _block.transactions.length; i++) {
        await processTransaction(_web3, _block.transactions[i], _transactions)
    }
}

const fetchBlockAndProcess = async (_web3, _transactions, _rec) => {
    let latestBlock = await _web3.eth.getBlock('latest')
    if (latestBlock.transactions.length == 0) {
        console.log(`[!]Empty Block : ${latestBlock.number}`)
        return
    }

    if (_transactions.all.length == 0) {
        await processBlock(_web3, _transactions, latestBlock)
    } else {
        if (_transactions.latestBlockNumber >= latestBlock.number) {
            return
        }

        await processBlock(_web3, _transactions, latestBlock)
    }

    const cumsumGasPrices = _transactions.cumulativePercentageOfGasPrices()

    _rec.updateGasPrices(
        _transactions.getMinGasPriceWithAcceptanceRateX(cumsumGasPrices, SAFELOW),
        _transactions.getMinGasPriceWithAcceptanceRateX(cumsumGasPrices, STANDARD),
        _transactions.getMinGasPriceWithAcceptanceRateX(cumsumGasPrices, FAST),
        _transactions.getMinGasPriceWithAcceptanceRateX(cumsumGasPrices, 100)
    )
    _rec.blockNumber = _transactions.latestBlockNumber

    let msg = await _rec.write(SINK)
    console.log(msg)
}


const sleep = async (ms) => new Promise(resolve => { setTimeout(resolve, ms) })

const run = async (_web3, _transactions, _rec) => {
    while (true) {
        await fetchBlockAndProcess(_web3, _transactions, _rec)
        await sleep(1000)
    }
}


const web3 = getWeb3()
const transactions = new Transactions(BUFFERSIZE)
const recommendation = new Recommendation()

console.log('[+]Matic Gas Station running ...')
setInterval(updateBlockTime, 60000, web3, recommendation)
run(web3, transactions, recommendation).then(_ => { }, err => { console.log(err) })
