const { config } = require('dotenv')
const axios = require('axios')
const path = require('path')
const v1Recommendation = require('./recommendation')
const v2Recommendation = require('./v2recommendation')
const { runServer } = require('./serve')
const Web3 = require('web3')

// reading variables from environment file, set them as you
// need in .env file in current working directory
config({ path: path.join(__dirname, '.env'), silent: true })

// setting environment variables
const API = process.env.API
const rpc = process.env.RPC
const v2SAFE = parseFloat(process.env.v2SAFE)
const v2STANDARD = parseFloat(process.env.v2STANDARD)
const v2FAST = parseFloat(process.env.v2FAST)

const SAFELOW = 'SafeGasPrice'
const STANDARD = 'ProposeGasPrice'
const FAST = 'FastGasPrice'
const BLOCK_NUMBER = 'LastBlock'

const web3 = new Web3()

// fetch latest prices, and set recommendations - v2
const v2fetchPrices = async (_rec) => {
  const maxFee = await axios.post(rpc, { jsonrpc: '2.0', method: 'eth_gasPrice', params: [], id: 1 })
    .then(response => {
      return web3.utils.hexToNumber(response.data.result) / 1e9
    })
  const maxPriorityFee = await axios.post(rpc, { jsonrpc: '2.0', method: 'eth_maxPriorityFeePerGas', params: [], id: 1 })
    .then(response => {
      return web3.utils.hexToNumber(response.data.result) / 1e9
    })
  const blockNumber = await axios.post(rpc, { jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1 })
    .then(response => {
      return web3.utils.hexToNumber(response.data.result)
    })
  lastBlock = blockNumber
  _rec.updateGasPrices(
    {
      maxPriorityFee: v2SAFE * maxPriorityFee,
      maxFee: v2SAFE * maxFee
    },
    {
      maxPriorityFee: v2STANDARD * maxPriorityFee,
      maxFee: v2STANDARD * maxFee
    },
    {
      maxPriorityFee: v2FAST * maxPriorityFee,
      maxFee: v2FAST * maxFee
    },
    maxFee - maxPriorityFee,
    blockNumber,
    blockTime)
}


// fetch latest prices, and set recommendations - v1
const v1fetchPrices = async (_rec) => {
  axios.get(API)
    .then(response => {
      const result = response.data.result
      blockTime = result[BLOCK_NUMBER] > lastBlock ? parseInt(6 / (parseInt(result[BLOCK_NUMBER]) - lastBlock)) : _rec.blockTime
      lastBlock = result[BLOCK_NUMBER]
      _rec.updateGasPrices(parseFloat(result[SAFELOW]), parseFloat(result[STANDARD]), parseFloat(result[FAST]), parseInt(result[BLOCK_NUMBER]), blockTime)
    })
}

// sleep for `ms` miliseconds, just do nothing
const sleep = async (ms) => new Promise((res, _) => { setTimeout(res, ms) })

// infinite loop, for keep fetching latest block data, for computing
// gas price recommendation using past data available
const runv1 = async (_v1rec) => {
  while (true) {
    await v1fetchPrices(_v1rec)
    await sleep(5000)
  }
}

const runv2 = async (_v2rec) => {
  while (true) {
    await v2fetchPrices(_v2rec)
    await sleep(5000)
  }
}

const v1recommendation = new v1Recommendation()
const v2recommendation = new v2Recommendation()
let lastBlock = 0
let blockTime = 2

console.log('🔥 Matic Gas Station running ...')

runv1(v1recommendation).then(_ => { }).catch(e => {
  console.error(e)
  process.exit(1)
})

runv2(v2recommendation).then(_ => { }).catch(e => {
  console.error(e)
  process.exit(1)
})

runServer(v1recommendation, v2recommendation)
