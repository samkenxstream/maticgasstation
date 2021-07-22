// class to define the list of pasPrice objects
const GasPrice = require("./gasPrice");

module.exports = class GasPriceList {
  constructor() {
    this.priceCounts = {};
    this.totalSum = 0;
    this.cumSumPercentages = [];
  }

  // add new gas prices to the list
  //
  // if the price already exists previously,
  // we will just be incrementing the count
  // else, we create and add a new object to the lsit
  add(gasPriceHex) {
    const gasPrice = parseInt(gasPriceHex) / 1e9;
    this.totalSum += gasPrice;
    if (gasPrice in this.priceCounts) {
      this.priceCounts[gasPrice].incrementCount();
    } else {
      this.priceCounts[gasPrice] = new GasPrice(gasPrice);
    }
  }

  // We were holding the priceCounts in a dictionary for cheaper
  // look ups to verify if the price object already exists.
  // But to order those prices for further computations,
  // we'll be converting them into an array object
  // and then sort it in ascending order
  extractGasPrices = () => Object.values(this.priceCounts);

  ascendingGasPrices = () =>
    this.extractGasPrices().sort((a, b) => a.gasPrice - b.gasPrice);

  //compute cumulative percentage of gas prices, from cumulative sum
  getCumulativePercentages() {
    let prices = this.ascendingGasPrices();
    let upto = 0;

    for (let i = 0; i < prices.length; i++) {
      upto += prices[i].gasPrice * prices[i].count;
      this.cumSumPercentages.push([
        prices[i].gasPrice,
        (upto / this.totalSum) * 100,
      ]);
    }
  }

  // compute gasPrice recommendations as per the given threshold
  getRecommendation(threshold) {
    if (threshold != 100) {
      return Math.min(
        ...this.cumSumPercentages
          .filter((v) => v[1] >= threshold)
          .map((v) => v[0])
      );
    } else {
      return this.cumSumPercentages.slice(-1)[0][0];
    }
  }
};
