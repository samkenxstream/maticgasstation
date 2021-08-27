const { config } = require('dotenv')
const path = require('path')
var Web3 = require('web3')
const redis = require('redis')
const { promisify } = require('util')

const v1 = require('./v1/v1')
const v2 = require('./v2/v2')

const Recommendation = require('./recommendation')
const Transaction = require('./tx')
const { runServer } = require('./serve')

// reading variables from environment file, set them as you
// need in .env file in current working directory
config({ path: path.join(__dirname, '.env'), silent: true })

// setting environment variables
const RPC = process.env.RPC

// Assert RPC is defined
const checkRPC = (_) => {
  if (process.env.RPC == undefined || process.env.RPC == '') {
    console.error('RPC field not found in ENV')
    process.exit(1)
  }
}

checkRPC()

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

  const pendingSubscription = web3.eth.subscribe('pendingTransactions', (err, res) => {
    if (err) {
      console.log('error1')
      console.error(err)
    }
  })

  pendingSubscription.on('data', (txHash) => {
    setTimeout(async () => {
      try {
        let tx = await web3.eth.getTransaction(txHash)
        if (tx) {
          const gasPrice = parseInt(tx.gasPrice)
          const gas = tx.gas
          const prediction = gasPrice >= 0.75 * _rec2.fastest ? 0 : gasPrice >= 0.75 * _rec2.fast ? 1 : gasPrice >= 0.75 * _rec2.standard ? 2 : gasPrice >= 0.75 * _rec2.safeLow ? 3 : -1
          if (gasPrice >= 1e9 && gasPrice * gas <= 1e18) {
            client.setex(txHash, 180, JSON.stringify(new Transaction(txHash, gasPrice, Date.now(), prediction)))
          }
        }
      } catch (e) {
        console.log('error2')
        console.error(e.message)
      }
    })
  })

  while (true) {
    await web3.eth.getBlock('latest', (error, result) => {
      if (error) {
        console.log('error3')
        console.error(error)
      }
      if (result && result.number > lastProcessedBlock) {
        _rec1.blockNumber = _rec2.blockNumber = result.number
        _rec1.blockTime = _rec2.blockTime = (result.timestamp - lastBlockTime) / (result.number - lastProcessedBlock)
        lastProcessedBlock = result.number
        lastBlockTime = result.timestamp

        console.log(`processing ${lastProcessedBlock}`)
        for (let txIndex in result.transactions) {
          const txHash = result.transactions[txIndex]
          client.get(txHash, function (error, tx) {
            if (tx) {
              transaction = JSON.parse(tx)
              const timeInPendingPool = result.timestamp - Math.floor(transaction.timestamp / 1000)
              transaction.status = 1
              transaction.pool = timeInPendingPool <= 10 ? 0 : timeInPendingPool <= 30 ? 1 : timeInPendingPool <= 60 ? 2 : 3
              client.setex(txHash, 60, JSON.stringify(transaction))
              if (transaction.pool != transaction.prediction) {
                console.log(`incorrectly predicted ${transaction.pool} as ${transaction.prediction}`)
              }
            }
          })
        }
      }
    })
    await sleep(1000)
  }
}

const getRecommendations = async (_rec1, _rec2) => {
  while (true) {
    let fastestPool = []
    let fastPool = []
    let standardPool = []
    let safePool = []
    let keys = await getKeysAsync('*')
    client.mget(keys, (error, transactions) => {
      if (transactions) {
        for (i in transactions) {
          if (transactions[i]) {
            tx = JSON.parse(transactions[i])
            if (tx.status == 1) {
              tx.pool == 0 ? fastestPool.push(tx.gasPrice) : tx.pool == 1 ? fastPool.push(tx.gasPrice) : tx.pool == 2 ? standardPool.push(tx.gasPrice) : safePool.push(tx.gasPrice)
            }
          }
        }

        v1.predictV1([].concat(fastestPool, fastPool, standardPool, safePool), _rec1)

        v2.predictV2(fastestPool, fastPool, standardPool, safePool, _rec2)
      }
    })
    await sleep(5000)
  }
}

const v1Recommendation = new Recommendation()
const v2Recommendation = new Recommendation()
var web3 = new Web3(RPC)
const client = redis.createClient()
const getKeysAsync = promisify(client.keys).bind(client)

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
