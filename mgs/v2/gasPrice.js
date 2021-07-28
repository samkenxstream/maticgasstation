// this class defines the gasPrice object
// we also maintain the number of occurances
// of the price to reduce the footprint
// and for faster computations
module.exports = class GasPrice {
  constructor (gasPrice) {
    this.gasPrice = gasPrice
    this.count = 1
  }

  // method to increment the count of the gas price
  incrementCount () {
    this.count += 1
  }
}
