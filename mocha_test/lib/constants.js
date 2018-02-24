const rootPrefix = '../..'
  , returnTypes = require(rootPrefix + "/lib/global_constant/return_types")
;

const constants = {
  gasUsed: 0xBA43B7400,
  deployer: process.env.OST_UTILITY_DEPLOYER_ADDR,
  deployerPassphrase: process.env.OST_UTILITY_DEPLOYER_PASSPHRASE,
  ops: process.env.OST_UTILITY_OPS_ADDR,
  opsPassphrase: process.env.OST_UTILITY_OPS_PASSPHRASE,
  account1: process.env.OST_UTILITY_TEST_ACCOUNT1,
  accountPassphrase1: process.env.OST_UTILITY_TEST_ACCOUNT1_PASSPHRASE,
  account1InitialBrandedTokenBalance: '100000',
  account2: process.env.OST_UTILITY_TEST_ACCOUNT2,
  accountPassphrase2: process.env.OST_UTILITY_TEST_ACCOUNT2_PASSPHRASE,
  account3: process.env.OST_UTILITY_TEST_ACCOUNT3,
  accountPassphrase3: process.env.OST_UTILITY_TEST_ACCOUNT3_PASSPHRASE,
  account4: process.env.OST_UTILITY_TEST_ACCOUNT4,
  accountPassphrase4: process.env.OST_UTILITY_TEST_ACCOUNT4_PASSPHRASE,
  currencyUSD: "USD",
  currencyEUR: "EUR",
  currencyINR: "INR",
  currencyBlank: "",
  pricerOstUsdAddress: process.env.OST_UTILITY_TEST_PRICER_C5_ADDRESS,
  pricerOstEurAddress: process.env.OST_UTILITY_TEST_PRICER_C2_ADDRESS,
  pricerOstUsd10DecimalAddress: process.env.OST_UTILITY_TEST_PRICER_C3_ADDRESS,
  priceOracles: JSON.parse(process.env.OST_UTILITY_PRICE_ORACLES),
  TC5Address: process.env.OST_UTILITY_TEST_COIN1_C5_ADDRESS,
  TC2Address: process.env.OST_UTILITY_TEST_COIN2_C2_ADDRESS,
  TC3Address: process.env.OST_UTILITY_TEST_COIN3_C3_ADDRESS,
  chainId: process.env.OST_UTILITY_CHAIN_ID,
  returnTypeUUID: returnTypes.transactionUuid(),
  returnTypeHash: returnTypes.transactionHash(),
  returnTypeReceipt: returnTypes.transactionReceipt(),
  optionsUUID: {returnType: returnTypes.transactionUuid(), tag: returnTypes.transactionUuid()},
  optionsHash: {returnType: returnTypes.transactionHash(), tag: returnTypes.transactionHash()},
  optionsReceipt: {returnType: returnTypes.transactionReceipt(), tag: returnTypes.transactionReceipt()},
  // Worker specific constants
  workerAccount1: process.env.OST_WORKER_TEST_ACCOUNT1,
  workerAccountPassphrase1: process.env.OST_WORKER_TEST_ACCOUNT1_PASSPHRASE,
  // Airdrop specific constants
  airdropBudgetHolder: process.env.OST_AIRDROP_BUDGET_HOLDER,
  airdropBudgetHolderPassphrase: process.env.OST_AIRDROP_BUDGET_HOLDER_PASSPHRASE,
  workersContractAddress: process.env.OST_UTILITY_WORKER_CONTRACT_ADDRESS,
  airdropOstUsdAddress: process.env.OST_UTILITY_TEST_AIRDROP1_CONTRACT_ADDRESS,
  airdropBudgetBrandedTokenBalance: '100',
  airdropUsers: {
    '0x934ebd34b2a4f16d4de16256df36a6013785557d': {airdropAmount: 50*10**18, expiryTimestamp: 0},
    '0x934ebd34b2a4f16d4de16256df36a6013785557e': {airdropAmount: 50*10**18, expiryTimestamp: 0}
  }
};
module.exports = constants;
