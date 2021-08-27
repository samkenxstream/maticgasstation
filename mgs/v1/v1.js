const { config } = require('dotenv')
const path = require('path')

config({ path: path.join(__dirname, '../.env'), silent: true })

const SAFELOWV1 = process.env.v1SAFELOW || 5
const STANDARDV1 = process.env.v1STANDARD || 10
const FASTV1 = process.env.v1FAST || 20
const FASTESTV1 = process.env.v1FASTEST || 35

// fetch latest block mined, if it's not already processed & non-empty
// then we'll process each transaction in it, put them in transaction pool,
// after that it'll be computing gas price recommendation depending upon past data
// and env variable values
exports.predictV1 = (_prices, _rec) => {
  let upto = 0
  _prices.sort((a, b) => a - b)
  let buffer = []
  for (i in _prices) {
    upto += _prices[i]
    buffer.push([_prices[i], upto])
  }
  for (i in buffer) {
    buffer[i][1] = buffer[i][1] * 100 / upto
  }
  _rec.updateGasPrices(
    Math.min(...buffer.filter((v) => v[1] >= SAFELOWV1).map((v) => v[0])),
    Math.min(...buffer.filter((v) => v[1] >= STANDARDV1).map((v) => v[0])),
    Math.min(...buffer.filter((v) => v[1] >= FASTV1).map((v) => v[0])),
    Math.min(...buffer.filter((v) => v[1] >= FASTESTV1).map((v) => v[0]))
  )
}
