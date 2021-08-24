// class to define the list of pasPrice objects
const GasPrice = require('./gasPrice')

module.exports = class GasPriceList {
  constructor() {
    this.priceCounts = {}
    this.prices = []
    this.totalCount = 0
  }

  // add new gas prices to the list
  //
  // if the price already exists previously,
  // we will just be incrementing the count
  // else, we create and add a new object to the list
  add(_gasPrice, _gas) {
    const gasPrice = _gasPrice / 1e9
    const gas = _gas / 1e9
    if (gasPrice * gas < 1) {
      this.totalCount += 1
      if (gasPrice in this.priceCounts) {
        this.priceCounts[gasPrice].incrementCount()
      } else {
        this.priceCounts[gasPrice] = new GasPrice(gasPrice)
      }
    }
  }

  // To order these prices for further computations,
  // we'll be sorting it in descending order.
  // Since we used a dict to store price counts for
  // faster verisication, we'll be converting these
  // prices to an array before sorthing them.
  orderPrices() {
    const set = Object.values(this.priceCounts).sort(
      (a, b) => b.gasPrice - a.gasPrice
    )
    const startFrom = parseInt(Math.floor(this.totalCount / 50))
    let upto = 0
    for (let i = 0; i < set.length; i++) {
      upto += set[i].count
      if (upto > startFrom) {
        this.prices.push([set[i].gasPrice, upto - startFrom])
      }
    }
  }

  // compute gasPrice recommendations as per the given threshold
  getRecommendation(threshold) {
    if (this.totalCount == 0) {
      return 1
    } else if (threshold < this.prices.length) {
      return Math.max(
        ...this.prices.filter((v) => v[1] >= threshold).map((v) => v[0])
      )
    } else {
      return this.prices[this.prices.length - 1][0]
    }
  }
}
