// class for storing, publishing gas price recommendations
// along with blocktime & block number when recommendation was made
module.exports = class Recommendation {
    safeLow = NaN
    standard = NaN
    fast = NaN
    fastest = NaN
    sinceLastBlock = NaN
    lastBlockNumber = NaN

    // updates gas price recommendation with latest values
    updateGasPrices(safeLow, standard, fast, fastest) {
        this.safeLow = safeLow
        this.standard = standard
        this.fast = fast
        this.fastest = fastest

        // todo: Remove this logging before production
        console.log(this)
    }

    // To be invoked when responding to client request
    servable() {
        return {
            safeLow: this.safeLow,
            standard: this.standard,
            fast: this.fast,
            fastest: this.fastest,
            sinceLastBlock: this.sinceLastBlock,
            lastBlockNumber: this.lastBlockNumber
        }
    }
}