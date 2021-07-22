const { config } = require("dotenv");
const path = require("path");
const axios = require("axios");
const humanizeDuration = require("humanize-duration");

const GasPriceList = require("./gasPriceList");
const Recommendation = require("./recommendation");
const { runServer } = require("./serve");

// reading variables from environment file, set them as you
// need in .env file in current working directory
config({ path: path.join(__dirname, ".env"), silent: true });

// setting environment variables
const SAFELOW = process.env.SAFELOW || 50;
const STANDARD = process.env.STANDARD || 75;
const FAST = process.env.FAST || 90;
const FASTEST = process.env.FASTEST || 100;
const RPC = process.env.RPC;

// Assert RPC is defined
const checkRPC = (_) => {
  if (process.env.RPC == undefined || process.env.RPC == "") {
    console.error("RPC field not found in ENV");
    process.exit(1);
  }
};

checkRPC();

// fetch pending transactions' gas prices from the txPool of the node
// using graphQL to fetch
// can be fetched using txPool API and web3 as well (not implemented here)
const fetchAndProcessTxs = async (_rec) => {
  gasPriceList = new GasPriceList();

  // querying for pending txs
  const result = await axios.post(`${RPC}/graphql`, {
    query: `
          { block { number, timestamp }, pending { transactions { gasPrice } } }
        `,
  });

  // updating the last mined block details
  _rec.lastBlockNumber = result.data.data.block.number;
  _rec.sinceLastBlock = humanizeDuration(
    new Date().getTime() - parseInt(result.data.data.block.timestamp) * 1000
  );

  prices = result.data.data.pending.transactions;

  // adding gas prices to the gasPriceList object
  //and processing for cummulative percentage values
  // to calculate recommendations
  // then, updating the new recommended values
  for (let i = 0; i < prices.length; i++) {
    gasPriceList.add(prices[i].gasPrice);
  }

  gasPriceList.getCumulativePercentages();

  recommendation.updateGasPrices(
    gasPriceList.getRecommendation(SAFELOW),
    gasPriceList.getRecommendation(STANDARD),
    gasPriceList.getRecommendation(FAST),
    gasPriceList.getRecommendation(FASTEST)
  );
};

// sleep for `ms` miliseconds, just do nothing
const sleep = async (ms) =>
  new Promise((res, _) => {
    setTimeout(res, ms);
  });

// infinite loop, to keep fetching latest pending txs, for computing
// gas price recommendations
const run = async (_rec) => {
  while (true) {
    await fetchAndProcessTxs(_rec);
    await sleep(2000);
  }
};

const recommendation = new Recommendation();

console.log("🔥 Matic Gas Station running ...");

run(recommendation)
  .then((_) => {})
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

runServer(recommendation);
