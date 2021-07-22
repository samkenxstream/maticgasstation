const GasPrice = require("./gasPrice")

module.exports = class GasPriceList {

    constructor(){
        this.priceCounts = {}
        this.totalSum = 0
        this.cumSumPercentages = []
    }

    add(gasPriceHex) {
        const gasPrice = parseInt(gasPriceHex) / 1e9
        this.totalSum += gasPrice
        if(gasPrice in this.priceCounts) {
            this.priceCounts[gasPrice].incrementCount()
        } else {
            this.priceCounts[gasPrice] = new GasPrice(gasPrice)
        }
    }

    extractGasPrices = () => Object.values(this.priceCounts)

    ascendingGasPrices = () => this.extractGasPrices().sort((a, b) => a.gasPrice - b.gasPrice)

    getCumulativePercentages() {
        let prices = this.ascendingGasPrices()
        let upto = 0

        for (let i = 0; i < prices.length; i++) {

            upto += prices[i].gasPrice * prices[i].count
            this.cumSumPercentages.push([prices[i].gasPrice, (upto / this.totalSum) * 100])

        }
    }

    getRecommendation(threshold) {
        if(threshold != 100) {
            return Math.min(...this.cumSumPercentages.filter(v => v[1] >= threshold).map(v => v[0]))
        } else {
            return this.cumSumPercentages.slice(-1)[0][0]
        }
    }
    
}