module.exports = class BlockSize {
    constructor(initialBlockSize) {
        this.blockSize = initialBlockSize
        this.lowestGasPrice = [1000000000]
    }

    // method to change the block size
    changeSize(_blockSize, _lowestGasPrice) {
        this.blockSize = _blockSize
        if (this.lowestGasPrice.length >= 10) {
            this.lowestGasPrice.shift()
        }
        this.lowestGasPrice.push(_lowestGasPrice)
    }
}
