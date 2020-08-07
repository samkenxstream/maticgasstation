const path = require('path');
const { writeFile } = require('fs');

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

    write(sink) {
        return new Promise((resolve, reject) => {
            writeFile(path.join(__dirname, sink), JSON.stringify(this.toJSON()), err => {
                if (err) {
                    reject('Failed to write !')
                }
                resolve('Wrote !')
            })
        })
    }


}
