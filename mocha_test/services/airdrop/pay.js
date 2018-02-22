/* global describe, it */

const chai = require('chai')
  , assert = chai.assert;

const rootPrefix = "../../.."
  , constants = require(rootPrefix + '/mocha_test/lib/constants')
  , BigNumber = require('bignumber.js')
  , utils = require(rootPrefix+'/mocha_test/lib/utils')
  , airdrop = require(rootPrefix + '/lib/contract_interact/airdrop')
  , workers = require(rootPrefix + '/lib/contract_interact/workers')
  , workersContract = new workers(constants.workerContractAddress, constants.chainId)
  , airdropOstUsd = new airdrop(constants.airdropOstUsdAddress, constants.chainId)
  , mockToken = require(rootPrefix + '/lib/contract_interact/EIP20TokenMock')
  , TC5 = new mockToken(constants.TC5Address)
  , btHelper = require(rootPrefix + '/lib/contract_interact/branded_token')
  , cacheHelper = new btHelper(constants.TC5Address, constants.chainId)
  , web3RpcProvider = require(rootPrefix + '/lib/web3/providers/rpc')
;

async function getAmountFromCache(address) {
  const response = await cacheHelper.getBalanceFromCache(address);
  return new BigNumber(response.data.response);
};

describe('Airdrop Pay', function() {

  it('should pass the initial checks', async function() {
    // eslint-disable-next-line no-invalid-this
    this.timeout(300000);

    assert.isDefined(constants.deployer);
    assert.isDefined(constants.ops);
    assert.isDefined(constants.account1);
    assert.notEqual(constants.deployer, constants.ops);
    assert.notEqual(constants.deployer, constants.account1);
    assert.notEqual(constants.ops, constants.account1);

    const currentBlockNumber = await web3RpcProvider.eth.getBlockNumber()
      , deactivationHeight = new BigNumber(currentBlockNumber).plus(10000)
    ;
    // set worker
    const setWorkerResponse = await workersContract.setWorker(
      constants.ops,
      constants.opsPassphrase,
      constants.workerAccount1,
      deactivationHeight.toNumber(),
      constants.gasUsed,
      {returnType: constants.returnTypeReceipt});

    // verify if the transaction receipt is valid
    utils.verifyTransactionReceipt(setWorkerResponse);

    // Set Price Oracle
    const spoResponse = await airdropOstUsd.setPriceOracle(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyUSD,
      constants.priceOracles.OST.USD,
      constants.gasUsed,
      {returnType: constants.returnTypeReceipt});

    // verify if the transaction receipt is valid
    utils.verifyTransactionReceipt(spoResponse);

    // verify if the transaction has was actually mined
    await utils.verifyIfMined(airdropOstUsd, spoResponse.data.transaction_hash);

    // set accepted margin
    const amResponse = await airdropOstUsd.setAcceptedMargin(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyUSD,
      50,
      constants.gasUsed,
      {returnType: constants.returnTypeReceipt});

    // verify if the transaction receipt is valid
    utils.verifyTransactionReceipt(amResponse);

    // verify if the transaction has was actually mined
    await utils.verifyIfMined(airdropOstUsd, amResponse.data.transaction_hash);

    // verify if its set
    const amResult = await airdropOstUsd.acceptedMargins(constants.currencyUSD);
    assert.equal(amResult.isSuccess(), true);
    assert.equal(50, amResult.data.acceptedMargins);

    // verify if its set
    const poResult = await airdropOstUsd.priceOracles(constants.currencyUSD);
    assert.equal(poResult.isSuccess(), true);
    assert.equal(constants.priceOracles.OST.USD, poResult.data.priceOracles);

    await TC5.setBalance(
      constants.ops,
      constants.opsPassphrase,
      constants.account1,
      airdropOstUsd.toWei('1000'),
      constants.gasUsed);

    const account1Balance = await TC5.balanceOf(constants.account1);
    assert.equal(account1Balance, airdropOstUsd.toWei('1000'));

    await TC5.setBalance(
      constants.ops,
      constants.opsPassphrase,
      constants.account2,
      airdropOstUsd.toWei('0'),
      constants.gasUsed);

    const account2Balance = await TC5.balanceOf(constants.account2);
    assert.equal(account2Balance, airdropOstUsd.toWei('0'));

    await TC5.setBalance(
      constants.ops,
      constants.opsPassphrase,
      constants.account3,
      airdropOstUsd.toWei('0'),
      constants.gasUsed);

    const account3Balance = await TC5.balanceOf(constants.account3);
    assert.equal(account3Balance, airdropOstUsd.toWei('0'));

    await TC5.setBalance(
      constants.ops,
      constants.opsPassphrase,
      constants.account4,
      airdropOstUsd.toWei('0'),
      constants.gasUsed);

    const account4Balance = await TC5.balanceOf(constants.account4);
    assert.equal(account4Balance, airdropOstUsd.toWei('0'));

    // Populate Cache
    cacheHelper.getBalanceOf(constants.account1);
    cacheHelper.getBalanceOf(constants.account2);
    cacheHelper.getBalanceOf(constants.account3);
    cacheHelper.getBalanceOf(constants.account4);

  });

  it('should pass when all parameters are valid', async function() {
    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    const initialAccount1Balance = new BigNumber(await TC5.balanceOf(constants.account1))
      , initialAccount3Balance = new BigNumber(await TC5.balanceOf(constants.account3))
      , initialAccount4Balance = new BigNumber(await TC5.balanceOf(constants.account4))
    ;

    // Cache check
    const initialAccount1BalanceCache = await getAmountFromCache(constants.account1)
      , initialAccount3BalanceCache = await getAmountFromCache(constants.account3)
      , initialAccount4BalanceCache = await getAmountFromCache(constants.account4)
    ;

    assert.equal(initialAccount1Balance.toNumber(), initialAccount1BalanceCache.toNumber(), "account1: Actual and cacheValue mismatch");
    assert.equal(initialAccount3Balance.toNumber(), initialAccount3BalanceCache.toNumber(), "account3: Actual and cacheValue mismatch");
    assert.equal(initialAccount4Balance.toNumber(), initialAccount4BalanceCache.toNumber(), "account4: Actual and cacheValue mismatch");

    const beneficiary = constants.account3
      , commissionAmount = new BigNumber(airdropOstUsd.toWei('2'))
      , commissionBeneficiary = constants.account4
      , currency = constants.currencyUSD
      , transferAmount = new BigNumber(airdropOstUsd.toWei('7'))
    ;

    const acceptedMarginData = await airdropOstUsd.acceptedMargins(currency);
    assert.equal(acceptedMarginData.isSuccess(), true);

    const estimatedValues = await airdropOstUsd.getPricePointAndCalculatedAmounts(
      transferAmount,
      commissionAmount,
      currency);

    assert.equal(estimatedValues.isSuccess(), true);

    const estimatedTokenAmount = new BigNumber(estimatedValues.data.tokenAmount);
    const estimatedCommissionTokenAmount = new BigNumber(estimatedValues.data.commissionTokenAmount);

    const intendedPricePoint = estimatedValues.data.pricePoint;

    const estimatedTotalAmount = new BigNumber(0).plus(estimatedTokenAmount).plus(estimatedCommissionTokenAmount);
    const airdropBudgetAmount = new BigNumber(airdropOstUsd.toWei('1000000')); // 1 million

    // Approve airdropBudgetHolder for transfer
    await TC5.approve(
      constants.airdropBudgetHolder,
      constants.airdropBudgetHolderPassphrase,
      constants.airdropOstUsdAddress,
      airdropBudgetAmount,
      constants.gasUsed);

    // Approve account1 for transfer
    await TC5.approve(
      constants.account1,
      constants.accountPassphrase1,
      constants.airdropOstUsdAddress,
      estimatedTotalAmount,
      constants.gasUsed);

    const payResponse = await airdropOstUsd.pay(
      constants.workerAccount1,
      constants.workerAccountPassphrase1,
      beneficiary,
      transferAmount,
      commissionBeneficiary,
      commissionAmount,
      currency,
      intendedPricePoint,
      constants.account1,
      0,
      constants.gasUsed,
      {returnType: constants.returnTypeReceipt});

    // verify if the transaction receipt is valid
    utils.verifyTransactionReceipt(payResponse);

    // verify if the transaction is actually mined
    await utils.verifyIfMined(airdropOstUsd, payResponse.data.transaction_hash);

    const account1Balance = new BigNumber(await TC5.balanceOf(constants.account1))
      , account3Balance = new BigNumber(await TC5.balanceOf(constants.account3))
      , account4Balance = new BigNumber(await TC5.balanceOf(constants.account4))
    ;

    assert.equal(
      new BigNumber(0).plus(initialAccount1Balance)
        .minus(estimatedTokenAmount)
        .minus(estimatedCommissionTokenAmount)
        .toNumber(), account1Balance.toNumber());

    assert.equal(
      new BigNumber(0).plus(initialAccount3Balance)
        .plus(estimatedTokenAmount)
        .toNumber(), account3Balance.toNumber());

    assert.equal(
      new BigNumber(0).plus(initialAccount4Balance)
        .plus(estimatedCommissionTokenAmount)
        .toNumber(), account4Balance.toNumber());

    // Cache check
    const finalAccount1BalanceCache = await getAmountFromCache(constants.account1)
      , finalAccount3BalanceCache = await getAmountFromCache(constants.account3)
      , finalAccount4BalanceCache = await getAmountFromCache(constants.account4)
    ;

    assert.equal(account1Balance.toNumber(), finalAccount1BalanceCache.toNumber(), "account1: Actual and cacheValue mismatch after test");
    assert.equal(account3Balance.toNumber(), finalAccount3BalanceCache.toNumber(), "account3: Actual and cacheValue mismatch after test");
    assert.equal(account4Balance.toNumber(), finalAccount4BalanceCache.toNumber(), "account4: Actual and cacheValue mismatch after test");

  });

});