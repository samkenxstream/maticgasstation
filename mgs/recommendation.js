// class for storing, publishing gas price recommendations
// along with blocktime & block number when recommendation was made
module.exports = class Recommendation {
  safeLow = 1000000000
  standard = 1000000000
  fast = 1000000000
  fastest = 1000000000
  blockTime = NaN
  blockNumber = NaN

  // updates gas price recommendation with latest values
  updateGasPrices(safeLow, standard, fast, fastest) {
    this.safeLow = safeLow
    this.standard = standard
    this.fast = fast
    this.fastest = fastest
  }

  // To be invoked when responding to client request
  servable() {
    return {
      safeLow: this.safeLow / 1e9,
      standard: this.standard / 1e9,
      fast: this.fast / 1e9,
      fastest: this.fastest / 1e9,
      blockTime: this.blockTime,
      blockNumber: this.blockNumber,
    }
  }
}
