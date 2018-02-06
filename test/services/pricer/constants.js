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
  priceOracles: JSON.parse(process.env.OST_PO_PRICE_ORACLES)
  /*priceOracleOstUsdAddress: process.env., //conversionRate is 5
  priceOracleOstEurAddress: process.env., //conversionRate is 2
  priceOracleOstUsdZeroPricePointAddress: process.env.,
  pricerOstAddress: process.env.,
  pricerOstZeroPricePointAddress: process.env.,
  pricerDummyAddress: process.env.,
  */
};
module.exports = constants;