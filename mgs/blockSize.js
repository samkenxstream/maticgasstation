module.exports = class BlockSize {
    constructor(initialBlockSize) {
        this.blockSize = initialBlockSize
    }

    // method to change the block size
    changeSize(_blockSize) {
        this.blockSize = _blockSize
    }
}
