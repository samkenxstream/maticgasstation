module.exports = class Recommendation {
    safeLow = NaN
    standard = NaN
    fast = NaN
    fastest = NaN
    blockTime = NaN
    blockNumber = NaN

    constructor(safeLow, standard, fast, fastest, blockTime, blockNumber) {
        this.safeLow = safeLow
        this.standard = standard
        this.fast = fast
        this.fastest = fastest
        this.blockTime = blockTime
        this.blockNumber = blockNumber
    }

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
