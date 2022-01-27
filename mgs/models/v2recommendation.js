// class for storing, publishing gas price recommendations
// along with blocktime & block number when recommendation was made
module.exports = class v2Recommendation {
  safeLow = {}
  standard = {}
  fast = {}
  estimatedBaseFee = NaN
  blockTime = NaN
  blockNumber = NaN

  // updates gas price recommendation with latest values
  updateGasPrices(safeLow, standard, fast, baseFee, blockNumber, blockTime) {
      this.safeLow = {
        maxPriorityFee: safeLow,
        maxFee: safeLow + baseFee
      }
      this.standard = {
        maxPriorityFee: standard,
        maxFee: standard + baseFee
      }
      this.fast = {
        maxPriorityFee: fast,
        maxFee: fast + baseFee
      }
      this.estimatedBaseFee = baseFee
      this.blockNumber = blockNumber
      this.blockTime = blockTime
  }

  // To be invoked when responding to client request
  servable() {
      return {
          safeLow: this.safeLow,
          standard: this.standard,
          fast: this.fast,
          estimatedBaseFee: this.estimatedBaseFee,
          blockTime: this.blockTime,
          blockNumber: this.blockNumber
      }
  }
}
