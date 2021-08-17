const { config } = require('dotenv')
const path = require('path')
const axios = require('axios')

const v1 = require('./v1/v1')
const v2 = require('./v2/v2')

const Transactions = require('./v1/transactions')
const Recommendation = require('./recommendation')
const RecommendationV2 = require('./recommendation_v2')
const { runServer } = require('./serve')
const BlockSize = require('./blockSize')

// reading variables from environment file, set them as you
// need in .env file in current working directory
config({ path: path.join(__dirname, '.env'), silent: true })

// setting environment variables
const RPC = process.env.RPC
const BUFFERSIZE = process.env.BUFFERSIZE || 500
const SAFELOWV2 = process.env.v2SAFELOW || 3.25
const STANDARDV2 = process.env.v2STANDARD || 2.5
const FASTV2 = process.env.v2FAST || 1.75
const FASTESTV2 = process.env.v2FASTEST || 1

// Assert RPC is defined
const checkRPC = (_) => {
  if (process.env.RPC == undefined || process.env.RPC == '') {
    console.error('RPC field not found in ENV')
    process.exit(1)
  }
}

checkRPC()

// putting block time in object, which is keeping track of
// all data that's to be published, from gas station
const updateBlockTime = async (_v1Rec, _v2Rec) => {
  const latestBlock = await axios
    .post(`${RPC}/graphql`, {
      query: `
          { block { number, timestamp } }
        `
    })
    .then((result) => {
      return result.data.data.block
    })

  const previousBlock = await axios
    .post(`${RPC}/graphql`, {
      query: `
          { block(number: "${latestBlock.number - 1}") { number, timestamp } }
        `
    })
    .then((result) => {
      return result.data.data.block
    })

  const blockTime = latestBlock.timestamp - previousBlock.timestamp

  _v1Rec.blockTime = blockTime
  _v2Rec.blockTime = blockTime
}

// sleep for `ms` miliseconds, just do nothing
const sleep = async (ms) =>
  new Promise((resolve, reject) => {
    setTimeout(resolve, ms)
  })

// infinite loop, to keep fetching latest confirmed txs, for computing
// v1 gas price recommendations
const runV1 = async (_transactions, _rec, _avgBlockSize) => {
  while (true) {
    await v1.fetchAndProcessConfirmedTxs(_transactions, _rec, _avgBlockSize)
    await sleep(1000)
  }
}

// infinite loop, to keep fetching latest pending txs, for computing
// v2 gas price recommendations
const runV2 = async (_rec, _avgBlockSize) => {
  while (true) {
    await v2.fetchAndProcessPendingTxs(_rec, _avgBlockSize)
    await sleep(1000)
  }
}

// const web3 = getWeb3()
const transactions = new Transactions(BUFFERSIZE)
const v1Recommendation = new Recommendation()
const v2Recommendation = new RecommendationV2(SAFELOWV2, STANDARDV2, FASTV2, FASTESTV2)
const avgBlockSize = new BlockSize(200)

console.log('🔥 Matic Gas Station running ...')

setInterval(updateBlockTime, 60000, v1Recommendation, v2Recommendation)

runV1(transactions, v1Recommendation, avgBlockSize)
  .then(() => { })
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })

runV2(v2Recommendation, avgBlockSize)
  .then((_) => { })
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })

runServer(v1Recommendation, v2Recommendation)
