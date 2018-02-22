
const returnTypeUUID = "uuid";
const returnTypeHash = "txHash";
const returnTypeReceipt = "txReceipt";

const constants = {
  deployer: process.env.OST_PRICER_DEPLOYER_ADDR,
  deployerPassphrase: process.env.OST_PRICER_DEPLOYER_PASSPHRASE,
  ops: process.env.OST_PRICER_OPS_ADDR,
  opsPassphrase: process.env.OST_PRICER_OPS_PASSPHRASE,
  account1: process.env.OST_PRICER_PO_TEST_ACCOUNT1,
  accountPassphrase1: process.env.OST_PRICER_PO_TEST_ACCOUNT1_PASSPHRASE,
  account2: process.env.OST_PRICER_PO_TEST_ACCOUNT2,
  accountPassphrase2: process.env.OST_PRICER_PO_TEST_ACCOUNT2_PASSPHRASE,
  account3: process.env.OST_PRICER_PO_TEST_ACCOUNT3,
  accountPassphrase3: process.env.OST_PRICER_PO_TEST_ACCOUNT3_PASSPHRASE,
  account4: process.env.OST_PRICER_PO_TEST_ACCOUNT4,
  accountPassphrase4: process.env.OST_PRICER_PO_TEST_ACCOUNT4_PASSPHRASE,
  currencyUSD: "USD",
  currencyEUR: "EUR",
  currencyINR: "INR",
  currencyBlank: "",
  pricerOstUsdAddress: process.env.TEST_PRICER_C5_ADDRESS,
  pricerOstEurAddress: process.env.TEST_PRICER_C2_ADDRESS,
  pricerOstUsd10DecimalAddress: process.env.TEST_PRICER_C3_ADDRESS,
  priceOracles: JSON.parse(process.env.OST_PO_PRICE_ORACLES),
  TC5Address: process.env.TEST_COIN1_C5_ADDRESS,
  TC2Address: process.env.TEST_COIN2_C2_ADDRESS,
  TC3Address: process.env.TEST_COIN3_C3_ADDRESS,
  chainId: process.env.OST_PRICER_CHAIN_ID,
  returnTypeUUID: returnTypeUUID,
  returnTypeHash: returnTypeHash,
  returnTypeReceipt: returnTypeReceipt,
  optionsUUID: {returnType: returnTypeUUID, tag: "test"},
  optionsHash: {returnType: returnTypeHash, tag: "test"},
  optionsReceipt: {returnType: returnTypeReceipt, tag: "test"}
};
module.exports = constants;
