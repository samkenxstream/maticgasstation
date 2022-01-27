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
const RPC = process.env.RPC
const v2SAFE = parseFloat(process.env.v2SAFE)
const v2STANDARD = parseFloat(process.env.v2STANDARD)
const v2FAST = parseFloat(process.env.v2FAST)
const HISTORY_BLOCKS = parseInt(process.env.HISTORY_BLOCKS)

const SAFELOW = 'SafeGasPrice'
const STANDARD = 'ProposeGasPrice'
const FAST = 'FastGasPrice'
const BLOCK_NUMBER = 'LastBlock'

const web3 = new Web3()

// function to format fee history response
function formatFeeHistory(result, includePending) {
  let initBlockNum = Number(result.oldestBlock)
  let blockNum = initBlockNum
  let index = 0;
  const blocks = [];
  while (blockNum < initBlockNum + HISTORY_BLOCKS) {
    blocks.push({
      number: blockNum,
      baseFeePerGas: Number(result.baseFeePerGas[index]),
      gasUsedRatio: Number(result.gasUsedRatio[index]),
      priorityFeePerGas: result.reward[index].map(x => Number(x)),
    });
    blockNum += 1;
    index += 1;
  }
  if (includePending) {
    blocks.push({
      number: "pending",
      baseFeePerGas: Number(result.baseFeePerGas[HISTORY_BLOCKS]),
      gasUsedRatio: NaN,
      priorityFeePerGas: [],
    });
  }
  return blocks;
}

// Functions to calculate average fee estimations
function avg(arr) {
  const sum = arr.reduce((a, v) => a + v);
  return (sum/arr.length);
}

function avgBaseFee(arr) {
  const change = (arr[5] - arr[0]) * 10 / HISTORY_BLOCKS
  return Math.round(arr[HISTORY_BLOCKS -1 ] + change)/1e9
}

// fetch latest prices, and set recommendations - v2
const v2fetchPrices = async (_rec) => {
  const blockNumber = await axios.post(RPC, { jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1 })
    .then(response => {
      return web3.utils.hexToNumber(response.data.result)
    })
  await axios.post(RPC, { jsonrpc: '2.0', method: 'eth_feeHistory', params: [HISTORY_BLOCKS, "pending", [v2SAFE, v2STANDARD, v2FAST]], id: 1 })
    .then(response => {
      const blocks = formatFeeHistory(response.data.result, false)
      const safeLow = avg(blocks.map(b => b.priorityFeePerGas[0]))/1e9
      const standard = avg(blocks.map(b => b.priorityFeePerGas[1]))/1e9
      const fast = avg(blocks.map(b => b.priorityFeePerGas[2]))/1e9
      const baseFeeEstimate = avgBaseFee(blocks.map(b => b.baseFeePerGas))

      _rec.updateGasPrices(
        safeLow,
        standard,
        fast,
        baseFeeEstimate,
        blockNumber,
        blockTime
      )
    })
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
