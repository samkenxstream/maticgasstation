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
        if (this.safeLow.length >= 3 * this.safeLowThreshold) {
            this.safeLow.shift()
        }
        if (this.standard.length >= 3 * this.standardThreshold) {
            this.standard.shift()
        }
        if (this.fast.length >= 3 * this.fastThreshold) {
            this.fast.shift()
        }
        if (this.fastest.length >= 3 * this.fastestThreshold) {
            this.fastest.shift()
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
            safeLow: this.safeLow.sort((a, b) => a - b)[Math.floor(this.safeLowThreshold)],
            standard: this.standard.sort((a, b) => a - b)[Math.floor(this.standardThreshold)],
            fast: this.fast.sort((a, b) => a - b)[Math.floor(this.fastThreshold)],
            fastest: this.fastest.sort((a, b) => a - b)[Math.floor(this.fastestThreshold)],
            blockTime: this.blockTime,
            blockNumber: this.blockNumber,
        }
    }
}
