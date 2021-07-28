const { config } = require('dotenv')
const path = require('path')
const axios = require('axios')
const humanizeDuration = require('humanize-duration')

const Transaction = require('./transaction')

config({ path: path.join(__dirname, '../.env'), silent: true })

const SAFELOWV1 = process.env.v1SAFELOW || 30
const STANDARDV1 = process.env.v1STANDARD || 60
const FASTV1 = process.env.v1FAST || 90
const FASTESTV1 = process.env.v1FASTEST || 100
const RPC = process.env.RPC

// fetch latest block mined, if it's not already processed & non-empty
// then we'll process each transaction in it, put them in transaction pool,
// after that it'll be computing gas price recommendation depending upon past data
// and env variable values
exports.fetchAndProcessConfirmedTxs = async (_transactions, _rec) => {
  console.log('🔅-1️⃣ Processing Block')
  const start = new Date().getTime()

  const result = await axios.post(`${RPC}/graphql`, {
    query: `
            { block { number, transactions { gasPrice } } }
          `
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
