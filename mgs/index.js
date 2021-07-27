const { config } = require("dotenv")
const path = require("path")
const axios = require("axios")
const humanizeDuration = require("humanize-duration")

const GasPriceList = require("./gasPriceList")
const Transaction = require("./transaction")
const Transactions = require("./transactions")
const Recommendation = require("./recommendation")
const { runServer } = require("./serve")

// reading variables from environment file, set them as you
// need in .env file in current working directory
config({ path: path.join(__dirname, ".env"), silent: true })

// setting environment variables
const SAFELOWV1 = process.env.v1SAFELOW || 30
const STANDARDV1 = process.env.v1STANDARD || 60
const FASTV1 = process.env.v1FAST || 90
const FASTESTV1 = process.env.v1FASTEST || 100
const SAFELOWV2 = process.env.v2SAFELOW || 200
const STANDARDV2 = process.env.v2STANDARD || 125
const FASTV2 = process.env.v2FAST || 50
const FASTESTV2 = process.env.v2FASTEST || 25
const RPC = process.env.RPC
const BUFFERSIZE = process.env.BUFFERSIZE || 500

// Assert RPC is defined
const checkRPC = (_) => {
  if (process.env.RPC == undefined || process.env.RPC == "") {
    console.error("RPC field not found in ENV")
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
        `,
    })
    .then((result) => {
      return result.data.data.block
    })

  const previousBlock = await axios
    .post(`${RPC}/graphql`, {
      query: `
          { block(number: "${latestBlock.number - 1}") { number, timestamp } }
        `,
    })
    .then((result) => {
      return result.data.data.block
    })

  const blockTime = latestBlock.timestamp - previousBlock.timestamp

  _v1Rec.blockTime = blockTime
  _v2Rec.blockTime = blockTime
}

// fetch latest block mined, if it's not already processed & non-empty
// then we'll process each transaction in it, put them in transaction pool,
// after that it'll be computing gas price recommendation depending upon past data
// and env variable values
const fetchAndProcessConfirmedTxs = async (_transactions, _rec) => {
  console.log("🔅-1️⃣ Processing Block")
  const start = new Date().getTime()

  const result = await axios.post(`${RPC}/graphql`, {
    query: `
          { block { number, transactions { gasPrice } } }
        `,
  })

  const latestBlock = result.data.data.block

  if (!(_transactions.latestBlockNumber < latestBlock.number)) {
    return
  }

  _rec.blockNumber = latestBlock.number

  if (latestBlock.transactions.length == 0) {
    console.log(`❗️-1️⃣ Empty Block : ${latestBlock.number}`)
    return
  }

  for (let i = 0; i < latestBlock.transactions.length; i++) {
    _transactions.add(
      new Transaction(
        latestBlock.number,
        parseInt(latestBlock.transactions[i].gasPrice) / 1e9
      )
    )
  }

  console.log(
    `✅-1️⃣ Block : ${latestBlock.number} in ${humanizeDuration(
      new Date().getTime() - start
    )}`
  )

  const cumsumGasPrices = _transactions.cumulativePercentageOfGasPrices()

  _rec.updateGasPrices(
    _transactions.getMinGasPriceWithAcceptanceRateX(cumsumGasPrices, SAFELOWV1),
    _transactions.getMinGasPriceWithAcceptanceRateX(
      cumsumGasPrices,
      STANDARDV1
    ),
    _transactions.getMinGasPriceWithAcceptanceRateX(cumsumGasPrices, FASTV1),
    _transactions.getMinGasPriceWithAcceptanceRateX(cumsumGasPrices, FASTESTV1)
  )

  console.log(
    `👍-1️⃣ Recommendation on block ${latestBlock.number} in ${humanizeDuration(
      new Date().getTime() - start
    )}`
  )
}

// fetch pending transactions' gas prices from the txPool of the node
// using graphQL to fetch
// can be fetched using txPool API and web3 as well (not implemented here)
const fetchAndProcessPendingTxs = async (_rec) => {
  console.log("🔅-2️⃣ Processing Pending")
  const start = new Date().getTime()

  const gasPriceList = new GasPriceList()

  // querying for pending txs
  const result = await axios.post(`${RPC}/graphql`, {
    query: `
          { block { number }, pending { transactions { gasPrice, gas, from { address } } } }
        `,
  })

  const latestBlockNumber = result.data.data.block.number

  // updating the last mined block details
  _rec.blockNumber = latestBlockNumber

  const prices = result.data.data.pending.transactions

  // adding gas prices to the gasPriceList object
  // and processing for cummulative percentage values
  // to calculate recommendations
  // then, updating the new recommended values
  let lastProcessedAddress
  let wontPass = false
  for (let i = 0; i < prices.length; i++) {
    const gasPrice = parseInt(prices[i].gasPrice)
    const gas = parseInt(prices[i].gas)
    const address = prices[i].from.address
    if (address != lastProcessedAddress) {
      lastProcessedAddress = address
      wontPass = false
    }
    if (!wontPass) {
      if (gasPrice / 1e9 >= 1) {
        gasPriceList.add(gasPrice, gas)
      } else {
        wontPass = true
      }
    }
  }

  console.log(
    `✅-2️⃣ Processed pending : ${latestBlockNumber} in ${humanizeDuration(
      new Date().getTime() - start
    )}`
  )

  gasPriceList.orderPrices()

  _rec.updateGasPrices(
    gasPriceList.getRecommendation(SAFELOWV2),
    gasPriceList.getRecommendation(STANDARDV2),
    gasPriceList.getRecommendation(FASTV2),
    gasPriceList.getRecommendation(FASTESTV2)
  )

  console.log(
    `👍-2️⃣ Recommendation on block ${latestBlockNumber} in ${humanizeDuration(
      new Date().getTime() - start
    )}`
  )
}

// sleep for `ms` miliseconds, just do nothing
const sleep = async (ms) =>
  new Promise((resolve, reject) => {
    setTimeout(resolve, ms)
  })

// infinite loop, to keep fetching latest confirmed txs, for computing
// v1 gas price recommendations
const runV1 = async (_transactions, _rec) => {
  while (true) {
    await fetchAndProcessConfirmedTxs(_transactions, _rec)
    await sleep(1000)
  }
}

// infinite loop, to keep fetching latest pending txs, for computing
// v2 gas price recommendations
const runV2 = async (_rec) => {
  while (true) {
    await fetchAndProcessPendingTxs(_rec)
    await sleep(1000)
  }
}

// const web3 = getWeb3()
const transactions = new Transactions(BUFFERSIZE)
const v1Recommendation = new Recommendation()
const v2Recommendation = new Recommendation()

console.log("🔥 Matic Gas Station running ...")

setInterval(updateBlockTime, 60000, v1Recommendation, v2Recommendation)

runV1(transactions, v1Recommendation)
  .then((_) => {})
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })

runV2(v2Recommendation)
  .then((_) => {})
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })

runServer(v1Recommendation, v2Recommendation)
