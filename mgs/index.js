const { config } = require('dotenv')
const axios = require('axios')
const path = require('path')
const Recommendation = require('./recommendation')
const { runServer } = require('./serve')

// reading variables from environment file, set them as you
// need in .env file in current working directory
config({ path: path.join(__dirname, '.env'), silent: true })

// setting environment variables
const API = process.env.API

const SAFELOW = 'SafeGasPrice'
const STANDARD = 'ProposeGasPrice'
const FAST = 'FastGasPrice'
const BLOCK_NUMBER = 'LastBlock'

// fetch latest prices, and set recommendations
const fetchPrices = async (_rec) => {
  axios.get(API)
    .then(response => {
      const result = response.data.result
      const blockTime = result[BLOCK_NUMBER] > lastBlock ? parseInt(6 / (parseInt(result[BLOCK_NUMBER]) - lastBlock)) : _rec.blockTime
      lastBlock = result[BLOCK_NUMBER]
      _rec.updateGasPrices(parseFloat(result[SAFELOW]), parseFloat(result[STANDARD]), parseFloat(result[FAST]), parseInt(result[BLOCK_NUMBER]), blockTime)
    })
}

// sleep for `ms` miliseconds, just do nothing
const sleep = async (ms) => new Promise((res, _) => { setTimeout(res, ms) })

// infinite loop, for keep fetching latest block data, for computing
// gas price recommendation using past data available
const run = async (_rec) => {
  while (true) {
    await fetchPrices(_rec)
    await sleep(5000)
  }
}

const recommendation = new Recommendation()
let lastBlock = 0

console.log('🔥 Matic Gas Station running ...')

run(recommendation).then(_ => { }).catch(e => {
  console.error(e)
  process.exit(1)
})

runServer(recommendation)
