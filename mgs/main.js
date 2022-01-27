const v1Recommendation = require('./models/recommendation')
const v2Recommendation = require('./models/v2recommendation')
const { runServer } = require('./api/serve')
import v1fetchPrices from './api/v1/v1'
import v2fetchPrices from './api/v2/v2'

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
