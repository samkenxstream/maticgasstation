const path = require('path');
const { writeFile } = require('fs');

// class for storing, publishing gas price recommendations
// along with blocktime & block number when recommendation was made
module.exports = class Recommendation {
    safeLow = NaN
    standard = NaN
    fast = NaN
    fastest = NaN
    blockTime = NaN
    blockNumber = NaN

    // updates gas price recommendation with latest values
    updateGasPrices(safeLow, standard, fast, fastest) {
        this.safeLow = safeLow
        this.standard = standard
        this.fast = fast
        this.fastest = fastest
    }

    // jsonify this class content, which is to be written
    // into sink file, to be served by node server
    toJSON() {
        return JSON.stringify(
            {
                safeLow: this.safeLow,
                standard: this.standard,
                fast: this.fast,
                fastest: this.fastest,
                blockTime: this.blockTime,
                blockNumber: this.blockNumber
            }
        )
    }

    // write json response to given file path, where `sink` is
    // relative path to file
    write(sink) {
        return new Promise((resolve, reject) => {
            writeFile(path.join(__dirname, sink), this.toJSON(), err => {
                if (err) {
                    reject('❌ Failed to write recommendation')
                }

                resolve('🎉 Wrote new recommendation')
            })
        })
    }


}
