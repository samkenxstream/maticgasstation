const redis = require('redis')
const { promisify } = require('util')

module.exports = class RedisClient {
  constructor () {
    this.client = redis.createClient()
    this.getKeysAsync = promisify(this.client.keys).bind(this.client)
    this.getAllTxs = promisify(this.client.mget).bind(this.client)
  }

  set (txHash, txObject, expiry = 180) {
    this.client.setex(txHash, expiry, txObject)
  }

  confirmTx (txHash, blockTimestamp) {
    const self = this
    this.client.get(txHash, function (error, tx) {
      if (tx) {
        const transaction = JSON.parse(tx)
        const timeInPendingPool = blockTimestamp - Math.floor(transaction.timestamp / 1000)
        transaction.status = 1
        transaction.pool = timeInPendingPool <= 10 ? 0 : timeInPendingPool <= 30 ? 1 : timeInPendingPool <= 60 ? 2 : 3
        self.set(txHash, JSON.stringify(transaction), 60)
      } else if (error) {
        console.error(error)
      }
    })
  }

  async getAllPools () {
    const fastestPool = []
    const fastPool = []
    const standardPool = []
    const safePool = []

    const keys = await this.getKeysAsync('*')
    if (keys && keys.length > 0) {
      const transactions = await this.getAllTxs(keys)
      if (transactions) {
        for (const i in transactions) {
          if (transactions[i]) {
            const tx = JSON.parse(transactions[i])
            if (tx.status === 1) {
              tx.pool === 0 ? fastestPool.push(tx.gasPrice) : tx.pool === 1 ? fastPool.push(tx.gasPrice) : tx.pool === 2 ? standardPool.push(tx.gasPrice) : safePool.push(tx.gasPrice)
            }
          }
        }
        return {
          fastestPool,
          fastPool,
          standardPool,
          safePool
        }
      }
    }
    return { fastestPool, fastPool, standardPool, safePool }
  }
}
