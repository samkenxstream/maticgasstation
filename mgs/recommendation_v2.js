// class for storing, publishing gas price recommendations
// along with blocktime & block number when recommendation was made
module.exports = class RecommendationV2 {
    safeLow = []
    standard = []
    fast = []
    fastest = []
    blockTime = 2
    blockNumber = NaN

    constructor(safeLowThreshold, standardThreshold, fastThreshold, fastestThreshold) {
        this.safeLowThreshold = safeLowThreshold
        this.standardThreshold = standardThreshold
        this.fastThreshold = fastThreshold
        this.fastestThreshold = fastestThreshold
    }

    // updates gas price recommendation with latest values
    updateGasPrices(safeLow, standard, fast, fastest) {
        if (this.safeLow.length >= 5) {
            this.safeLow.shift()
        }
        this.safeLow.push(safeLow)
        this.standard.push(standard)
        this.fast.push(fast)
        this.fastest.push(fastest)
    }

    // To be invoked when responding to client request
    servable() {
        if (this.safeLow.length == 0) {
            return {
                safeLow: 1,
                standard: 1,
                fast: 1,
                fastest: 1,
                blockTime: this.blockTime,
                blockNumber: this.blockNumber,
            }
        }
        return {
            safeLow: Math.min.apply(null, this.safeLow),
            standard: Math.min.apply(null, this.standard),
            fast: Math.min.apply(null, this.fast),
            fastest: Math.min.apply(null, this.fastest),
            blockTime: this.blockTime,
            blockNumber: this.blockNumber,
        }
    }
}
