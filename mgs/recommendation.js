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
        return JSON.stringify(
            {
                safeLow: this.safeLow,
                standard: this.standard,
                fast: this.fast,
                fastest: this.fastest,
                blockTime: this.blockTime,
                blockNumber: this.blockNumber
            }, null, '\t'
        )
    }

    write(sink) {
        return new Promise((resolve, reject) => {
            writeFile(path.join(__dirname, sink), this.toJSON(), err => {
                if (err) {
                    reject('[!]Failed to write recommendation')
                }
                resolve('[+]Wrote new recommendation')
            })
        })
    }


}
