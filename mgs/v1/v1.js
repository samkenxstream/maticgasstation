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
exports.fetchAndProcessConfirmedTxs = async (_transactions, _rec, _avgBlockSize) => {
  const start = new Date().getTime()

  const result = await axios.post(`${RPC}/graphql`, {
    query: `
    { block { number, transactions { gasPrice }, gasUsed, gasLimit } }
          `
  })

  const latestBlock = result.data.data.block
  const blockSize = latestBlock.transactions.length
  const gasUsed = latestBlock.gasUsed
  const gasLimit = latestBlock.gasLimit

  if (blockSize > 0) {
    _avgBlockSize.changeSize(
      Math.floor((_avgBlockSize.blockSize * 24 + (blockSize * gasLimit / gasUsed)) / 25),
      parseInt(latestBlock.transactions[blockSize - 1].gasPrice)
    )
  }

  if (!(_transactions.latestBlockNumber < latestBlock.number)) {
    return
  }

  _rec.blockNumber = latestBlock.number

  if (latestBlock.transactions.length == 0) {
    return
  }

  for (let i = 0; i < blockSize; i++) {
    _transactions.add(
      new Transaction(
        latestBlock.number,
        parseInt(latestBlock.transactions[i].gasPrice) / 1e9
      )
    )
  }

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
}
