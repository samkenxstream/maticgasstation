'use strict';

export default async (web3) => {
    let latestBlock = await web3.eth.getBlock('latest');
    let prevBlock = await web3.eth.getBlock(latestBlock.number - 1);
    return latestBlock.timestamp - prevBlock.timestamp;
};
