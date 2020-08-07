module.exports = class Recommendation {
    safeLow = NaN
    standard = NaN
    fast = NaN
    fastest = NaN
    blockTime = NaN
    blockNumber = NaN

    updateGasPrices(safeLow, standard, fast, fastest) {
        this.safeLow = safeLow
        this.standard = standard
        this.fast = fast
        this.fastest = fastest
    }

    toJSON() {
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
