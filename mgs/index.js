const { config } = require('dotenv')
const path = require('path')

const v1 = require('./api/v1/v1')
const v2 = require('./api/v2/v2')

const Recommendation = require('./models/recommendation')
const Transaction = require('./models/tx')
const { runServer } = require('./api/serve')
const RedisClient = require('./helpers/redis')
const Web3Client = require('./helpers/web3')

// reading variables from environment file, set them as you
// need in .env file in current working directory
config({ path: path.join(__dirname, '.env'), silent: true })

// setting environment variables
const RPC = process.env.RPC.split(', ')

// sleep for `ms` miliseconds, just do nothing
const sleep = async (ms) =>
  new Promise((resolve, reject) => {
    setTimeout(resolve, ms)
  })

// infinite loop, to keep fetching latest pending txs, and confirmed transactions for computing
// v2 gas price recommendations
const run = async (_rec1, _rec2) => {
  let lastProcessedBlock = 0
  let lastBlockTime = 0

  web3.pendingSubscription.on('data', (txHash) => {
    setTimeout(async () => {
      try {
        const tx = await web3.web3.eth.getTransaction(txHash)
        if (tx) {
          const gasPrice = parseInt(tx.gasPrice)
          const gas = tx.gas
          const prediction = gasPrice >= 0.75 * _rec2.fastest ? 0 : gasPrice >= 0.75 * _rec2.fast ? 1 : gasPrice >= 0.75 * _rec2.standard ? 2 : gasPrice >= 0.75 * _rec2.safeLow ? 3 : -1
          if (gasPrice >= 30e9) {
            redisClient.set(txHash, JSON.stringify(new Transaction(txHash, gasPrice, Date.now(), prediction)), 180)
          }
        }
      } catch (e) {
        console.log('❗ Error fetching transaction')
        if (e.message !== 'Maximum number of reconnect attempts reached!') {
          console.error(e)
        }
      }
    })
  })

  while (true) {
    try {
      await web3.web3.eth.getBlock('latest', (error, result) => {
        if (result && result.number > lastProcessedBlock) {
          _rec1.blockNumber = _rec2.blockNumber = result.number
          _rec1.blockTime = _rec2.blockTime = (result.timestamp - lastBlockTime) / (result.number - lastProcessedBlock)
          lastProcessedBlock = result.number
          lastBlockTime = result.timestamp
          for (const txIndex in result.transactions) {
            const txHash = result.transactions[txIndex]
            redisClient.confirmTx(txHash, result.timestamp)
          }
        }
      })
    } catch (error) {
      console.log('❗ Error fetching latest block')
      if (error.message !== 'Maximum number of reconnect attempts reached!') {
        console.error(error)
      }
    }
    await sleep(1000)
  }
}

const getRecommendations = async (_rec1, _rec2) => {
  while (true) {
    redisClient.getAllPools().then((result) => {
      v1.predictV1([].concat(result.fastestPool, result.fastPool, result.standardPool, result.safePool), _rec1)
      v2.predictV2(result.fastestPool, result.fastPool, result.standardPool, result.safePool, _rec2)
    }).catch((e) => {
      console.error(e)
    })
    await sleep(5000)
  }
}

const v1Recommendation = new Recommendation()
const v2Recommendation = new Recommendation()
const web3 = new Web3Client(RPC)
const redisClient = new RedisClient()

web3.initClient()

console.log('🔥 Matic Gas Station running ...')

run(v1Recommendation, v2Recommendation)
  .then((_) => { })
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })

getRecommendations(v1Recommendation, v2Recommendation)
  .then((_) => { })
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })

runServer(v1Recommendation, v2Recommendation)
