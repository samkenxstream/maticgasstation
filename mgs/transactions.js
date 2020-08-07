module.exports = class Transactions {

    all = []
    size = 1

    constructor(size) {
        this.size = size
    }

    add(transaction) {
        if (this.all.length >= this.size) {
            this.all.shift();
        }

        this.all.push(transaction)
    }

    extractGasPrices() {
        return this.all.map(v => v.gasPrice)
    }

    ascendingGasPrices() {
        return this.extractGasPrices().sort((a, b) => a - b)
    }

    cumulativeSumOfGasPrices() {
        let buffer = [];
        let prices = this.ascendingGasPrices()
        let upto = 0

        for (let i = 0; i < prices.length; i++) {

            buffer.push([prices[i], upto + prices[i]])
            upto += prices[i]

        }

        return buffer
    }

    cumulativePercentageOfGasPrices() {
        let buffer = this.cumulativeSumOfGasPrices();
        let max = buffer[buffer.length - 1][1];

        return buffer.map(v => [v[0], (v[1] / max) * 100]);
    }

    getMinGasPriceWithAcceptanceRateX(gasPrices, x) {
        return Math.min(...gasPrices.filter(v => v[1] >= x).map(v => v[1]));
    }

}
