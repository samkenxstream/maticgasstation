// class for storing, publishing gas price recommendations
// along with blocktime & block number when recommendation was made
module.exports = class v1Recommendation {
    safeLow = NaN
    standard = NaN
    fast = NaN
    fastest = NaN
    blockTime = NaN
    blockNumber = NaN

    // updates gas price recommendation with latest values
    updateGasPrices(safeLow, standard, fast, blockNumber, blockTime) {
        this.safeLow = safeLow
        this.standard = standard
        this.fast = fast
        this.fastest = fast
        this.blockNumber = blockNumber
        this.blockTime = blockTime
    }

    // To be invoked when responding to client request
    servable() {
        return {
            safeLow: this.safeLow,
            standard: this.standard,
            fast: this.fast,
            fastest: this.fastest,
            blockTime: this.blockTime,
            blockNumber: this.blockNumber
        }
    }
}
