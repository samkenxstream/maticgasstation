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

}