module.exports = class GasPrice {

    constructor(gasPrice) {
        this.gasPrice = gasPrice
        this.count = 1
    }

    incrementCount() {
        this.count += 1
    }

}