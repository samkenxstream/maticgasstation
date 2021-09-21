module.exports = class Transaction {
  constructor (txHash, gasPrice, timestamp, prediction) {
    this.txHash = txHash
    this.status = 0
    this.gasPrice = gasPrice
    this.timestamp = timestamp
    this.prediction = prediction
  }
}
