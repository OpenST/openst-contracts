/* global describe, it */

const chai = require('chai')
  , assert = chai.assert;

const rootPrefix = "../../.."
  , constants = require(rootPrefix + '/mocha_test/lib/constants')
  , BigNumber = require('bignumber.js')
  , utils = require(rootPrefix+'/mocha_test/lib/utils')
  , pricer = require(rootPrefix + '/lib/contract_interact/pricer')
  , pricerOstUsd = new pricer(constants.pricerOstUsdAddress, constants.chainId)
  , pricerOstEur = new pricer(constants.pricerOstEurAddress, constants.chainId)
  , mockToken = require(rootPrefix + '/lib/contract_interact/EIP20TokenMock')
  , TC5 = new mockToken(constants.TC5Address)
  , btHelper = require(rootPrefix + '/lib/contract_interact/branded_token')
  , cacheHelper = new btHelper(constants.TC5Address, constants.chainId);
;

async function getAmountFromCache(address) {
  const resp = await cacheHelper.getBalanceFromCache(address);
  return new BigNumber(resp.data.response);
}

describe('Pay', function() {

  it('should pass the initial checks', async function() {
    // eslint-disable-next-line no-invalid-this
    this.timeout(300000);

    assert.isDefined(constants.deployer);
    assert.isDefined(constants.ops);
    assert.isDefined(constants.account1);
    assert.notEqual(constants.deployer, constants.ops);
    assert.notEqual(constants.deployer, constants.account1);
    assert.notEqual(constants.ops, constants.account1);

    // set accepted margin
    const amResponse = await pricerOstUsd.setAcceptedMargin(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyUSD,
      50,
      constants.gasUsed,
      {returnType: constants.returnTypeReceipt});

    // verify if the transaction receipt is valid
    utils.verifyTransactionReceipt(amResponse);

    // verify if the transaction has was actually mined
    await utils.verifyIfMined(pricerOstUsd, amResponse.data.transaction_hash);

    // verify if its set
    const amResult = await pricerOstUsd.acceptedMargins(constants.currencyUSD);
    assert.equal(amResult.isSuccess(), true);
    assert.equal(50, amResult.data.acceptedMargins);

    // set price oracle
    const spoResponse = await pricerOstUsd.setPriceOracle(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyUSD,
      constants.priceOracles.OST.USD,
      constants.gasUsed,
      {returnType: constants.returnTypeReceipt});

    // verify if the transaction receipt is valid
    utils.verifyTransactionReceipt(spoResponse);

    // verify if the transaction has was actually mined
    await utils.verifyIfMined(pricerOstUsd, spoResponse.data.transaction_hash);

    // verify if its set
    const poResult = await pricerOstUsd.priceOracles(constants.currencyUSD);
    assert.equal(poResult.isSuccess(), true);
    assert.equal(constants.priceOracles.OST.USD, poResult.data.priceOracles);

    await TC5.setBalance(
      constants.ops,
      constants.opsPassphrase,
      constants.account1,
      pricerOstUsd.toWei('1000'),
      constants.gasUsed);

    const account1Balance = await TC5.balanceOf(constants.account1);
    assert.equal(account1Balance, pricerOstUsd.toWei('1000'));

    await TC5.setBalance(
      constants.ops,
      constants.opsPassphrase,
      constants.account2,
      pricerOstUsd.toWei('0'),
      constants.gasUsed);

    const account2Balance = await TC5.balanceOf(constants.account2);
    assert.equal(account2Balance, pricerOstUsd.toWei('0'));

    await TC5.setBalance(
      constants.ops,
      constants.opsPassphrase,
      constants.account3,
      pricerOstUsd.toWei('0'),
      constants.gasUsed);

    const account3Balance = await TC5.balanceOf(constants.account3);
    assert.equal(account3Balance, pricerOstUsd.toWei('0'));

    await TC5.setBalance(
      constants.ops,
      constants.opsPassphrase,
      constants.account4,
      pricerOstUsd.toWei('0'),
      constants.gasUsed);

    const account4Balance = await TC5.balanceOf(constants.account4);
    assert.equal(account4Balance, pricerOstUsd.toWei('0'));

    // populate cache
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
      , initialAccount4Balance = new BigNumber(await TC5.balanceOf(constants.account4));

    // Cache check
    const initialAccount1BalanceCache = await getAmountFromCache(constants.account1)
      , initialAccount3BalanceCache = await getAmountFromCache(constants.account3)
      , initialAccount4BalanceCache = await getAmountFromCache(constants.account4);

    assert.equal(initialAccount1Balance.toNumber(), initialAccount1BalanceCache.toNumber(), "account1: Actual and cacheValue mismatch");
    assert.equal(initialAccount3Balance.toNumber(), initialAccount3BalanceCache.toNumber(), "account3: Actual and cacheValue mismatch");
    assert.equal(initialAccount4Balance.toNumber(), initialAccount4BalanceCache.toNumber(), "account4: Actual and cacheValue mismatch");

    const beneficiary = constants.account3
      , commissionAmount = new BigNumber(pricerOstUsd.toWei('2'))
      , commissionBeneficiary = constants.account4
      , currency = constants.currencyUSD
      , transferAmount = new BigNumber(pricerOstUsd.toWei('7'))
      ;

    const acceptedMarginData = await pricerOstUsd.acceptedMargins(currency);
    assert.equal(acceptedMarginData.isSuccess(), true);

    const estimatedValues = await pricerOstUsd.getPricePointAndCalculatedAmounts(
      transferAmount,
      commissionAmount,
      currency);

    assert.equal(estimatedValues.isSuccess(), true);

    const estimatedTokenAmount = new BigNumber(estimatedValues.data.tokenAmount);
    const estimatedCommissionTokenAmount = new BigNumber(estimatedValues.data.commissionTokenAmount);

    const intendedPricePoint = estimatedValues.data.pricePoint;

    const estimatedTotalAmount = new BigNumber(0).plus(estimatedTokenAmount).plus(estimatedCommissionTokenAmount);

    await TC5.approve(
      constants.account1,
      constants.accountPassphrase1,
      constants.pricerOstUsdAddress,
      estimatedTotalAmount,
      constants.gasUsed);

    const payResponse = await pricerOstUsd.pay(
      constants.account1,
      constants.accountPassphrase1,
      beneficiary,
      transferAmount,
      commissionBeneficiary,
      commissionAmount,
      currency,
      intendedPricePoint,
      constants.gasUsed,
      {returnType: constants.returnTypeReceipt});

    // verify if the transaction receipt is valid
    utils.verifyTransactionReceipt(payResponse);

    // verify if the transaction has was actually mined
    await utils.verifyIfMined(pricerOstUsd, payResponse.data.transaction_hash);

    const account1Balance = new BigNumber(await TC5.balanceOf(constants.account1))
      , account3Balance = new BigNumber(await TC5.balanceOf(constants.account3))
      , account4Balance = new BigNumber(await TC5.balanceOf(constants.account4));

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
      , finalAccount4BalanceCache = await getAmountFromCache(constants.account4);

    assert.equal(account1Balance.toNumber(), finalAccount1BalanceCache.toNumber(), "account1: Actual and cacheValue mismatch after test");
    assert.equal(account3Balance.toNumber(), finalAccount3BalanceCache.toNumber(), "account3: Actual and cacheValue mismatch after test");
    assert.equal(account4Balance.toNumber(), finalAccount4BalanceCache.toNumber(), "account4: Actual and cacheValue mismatch after test");

  });


  it('should fail when sender balance is less than the amount being transfered', async function() {
    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    const initialAccount1Balance = new BigNumber(await TC5.balanceOf(constants.account1))
      , initialAccount3Balance = new BigNumber(await TC5.balanceOf(constants.account3))
      , initialAccount4Balance = new BigNumber(await TC5.balanceOf(constants.account4));

    const initialAccount1BalanceCache = await getAmountFromCache(constants.account1)
      , initialAccount3BalanceCache = await getAmountFromCache(constants.account3)
      , initialAccount4BalanceCache = await getAmountFromCache(constants.account4)
    ;

    assert.equal(initialAccount1Balance.toNumber(), initialAccount1BalanceCache.toNumber(), "account1: Actual and cacheValue mismatch");
    assert.equal(initialAccount3Balance.toNumber(), initialAccount3BalanceCache.toNumber(), "account3: Actual and cacheValue mismatch");
    assert.equal(initialAccount4Balance.toNumber(), initialAccount4BalanceCache.toNumber(), "account4: Actual and cacheValue mismatch");

    const beneficiary = constants.account3
      , commissionAmount = new BigNumber(pricerOstUsd.toWei('100000'))
      , commissionBeneficiary = constants.account4
      , currency = constants.currencyUSD
      , transferAmount = new BigNumber(pricerOstUsd.toWei('5000'))
      ;

    const acceptedMarginData = await pricerOstUsd.acceptedMargins(currency);
    assert.equal(acceptedMarginData.isSuccess(), true);

    const estimatedValues = await pricerOstUsd.getPricePointAndCalculatedAmounts(
      transferAmount,
      commissionAmount,
      currency);
    assert.equal(estimatedValues.isSuccess(), true);

    const estimatedTokenAmount = new BigNumber(estimatedValues.data.tokenAmount);
    const estimatedCommissionTokenAmount = new BigNumber(estimatedValues.data.commissionTokenAmount);
    const intendedPricePoint = estimatedValues.data.pricePoint;
    const estimatedMargin = new BigNumber(acceptedMarginData.data.acceptedMargins);

    const total = estimatedTokenAmount.plus(estimatedCommissionTokenAmount).plus(estimatedMargin);

    await TC5.approve(
      constants.account1,
      constants.accountPassphrase1,
      constants.pricerOstUsdAddress,
      total,
      constants.gasUsed);

    const payResponse = await pricerOstUsd.pay(
      constants.account1,
      constants.accountPassphrase1,
      beneficiary,
      transferAmount,
      commissionBeneficiary,
      commissionAmount,
      currency,
      intendedPricePoint,
      constants.gasUsed,
      {returnType: constants.returnTypeReceipt});

    assert.equal(payResponse.isFailure(), true, "Low balance check");

    const account1Balance = new BigNumber(await TC5.balanceOf(constants.account1))
      , account3Balance = new BigNumber(await TC5.balanceOf(constants.account3))
      , account4Balance = new BigNumber(await TC5.balanceOf(constants.account4));

    assert.equal(initialAccount1Balance.toNumber(), account1Balance.toNumber());
    assert.equal(initialAccount3Balance.toNumber(), account3Balance.toNumber());
    assert.equal(initialAccount4Balance.toNumber(), account4Balance.toNumber());

    // Cache check
    const finalAccount1BalanceCache = await getAmountFromCache(constants.account1)
      , finalAccount3BalanceCache = await getAmountFromCache(constants.account3)
      , finalAccount4BalanceCache = await getAmountFromCache(constants.account4);

    assert.equal(account1Balance.toNumber(), finalAccount1BalanceCache.toNumber(), "account1: Actual and cacheValue mismatch after test");
    assert.equal(account3Balance.toNumber(), finalAccount3BalanceCache.toNumber(), "account3: Actual and cacheValue mismatch after test");
    assert.equal(account4Balance.toNumber(), finalAccount4BalanceCache.toNumber(), "account4: Actual and cacheValue mismatch after test");

  });


  it('should fail when sender has approved less amount than the amount being transfered', async function() {
    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    const initialAccount1Balance = new BigNumber(await TC5.balanceOf(constants.account1))
      , initialAccount3Balance = new BigNumber(await TC5.balanceOf(constants.account3))
      , initialAccount4Balance = new BigNumber(await TC5.balanceOf(constants.account4));

    // Cache check
    const initialAccount1BalanceCache = await getAmountFromCache(constants.account1)
      , initialAccount3BalanceCache = await getAmountFromCache(constants.account3)
      , initialAccount4BalanceCache = await getAmountFromCache(constants.account4);

    assert.equal(initialAccount1Balance.toNumber(), initialAccount1BalanceCache.toNumber(), "account1: Actual and cacheValue mismatch");
    assert.equal(initialAccount3Balance.toNumber(), initialAccount3BalanceCache.toNumber(), "account3: Actual and cacheValue mismatch");
    assert.equal(initialAccount4Balance.toNumber(), initialAccount4BalanceCache.toNumber(), "account4: Actual and cacheValue mismatch");

    const beneficiary = constants.account3
      , commissionAmount = new BigNumber(pricerOstUsd.toWei('5'))
      , commissionBeneficiary = constants.account4
      , currency = constants.currencyUSD
      , transferAmount = new BigNumber(pricerOstUsd.toWei('12'))
      ;

    const acceptedMarginData = await pricerOstUsd.acceptedMargins(currency);
    assert.equal(acceptedMarginData.isSuccess(), true);

    const estimatedValues = await pricerOstUsd.getPricePointAndCalculatedAmounts(
      transferAmount,
      commissionAmount,
      currency);
    assert.equal(estimatedValues.isSuccess(), true);

    const estimatedTokenAmount = new BigNumber(estimatedValues.data.tokenAmount);
    const estimatedCommissionTokenAmount = new BigNumber(estimatedValues.data.commissionTokenAmount);
    const intendedPricePoint = estimatedValues.data.pricePoint;
    const estimatedMargin = new BigNumber(acceptedMarginData.data.acceptedMargins);

    const total = estimatedTokenAmount
      .plus(estimatedCommissionTokenAmount)
      .minus(estimatedMargin)
      .minus(new BigNumber(100));

    await TC5.approve(
      constants.account1,
      constants.accountPassphrase1,
      constants.pricerOstUsdAddress,
      total,
      constants.gasUsed);

    const payResponse = await pricerOstUsd.pay(
      constants.account1,
      constants.accountPassphrase1,
      beneficiary,
      transferAmount,
      commissionBeneficiary,
      commissionAmount,
      currency,
      intendedPricePoint,
      constants.gasUsed,
      {returnType: constants.returnTypeReceipt});

    // verify if the transaction receipt is valid
    utils.verifyTransactionReceipt(payResponse);

    // verify if the transaction has was actually mined
    await utils.verifyIfMined(pricerOstUsd, payResponse.data.transaction_hash);

    const account1Balance = new BigNumber(await TC5.balanceOf(constants.account1))
      , account3Balance = new BigNumber(await TC5.balanceOf(constants.account3))
      , account4Balance = new BigNumber(await TC5.balanceOf(constants.account4));

    assert.equal(initialAccount1Balance.toNumber(), account1Balance.toNumber());
    assert.equal(initialAccount3Balance.toNumber(), account3Balance.toNumber());
    assert.equal(initialAccount4Balance.toNumber(), account4Balance.toNumber());

    // Cache check
    const finalAccount1BalanceCache = await getAmountFromCache(constants.account1)
      , finalAccount3BalanceCache = await getAmountFromCache(constants.account3)
      , finalAccount4BalanceCache = await getAmountFromCache(constants.account4);

    assert.equal(account1Balance.toNumber(), finalAccount1BalanceCache.toNumber(), "account1: Actual and cacheValue mismatch after test");
    assert.equal(account3Balance.toNumber(), finalAccount3BalanceCache.toNumber(), "account3: Actual and cacheValue mismatch after test");
    assert.equal(account4Balance.toNumber(), finalAccount4BalanceCache.toNumber(), "account4: Actual and cacheValue mismatch after test");

  });


  it('should fail when beneficiary address is 0', async function() {
    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    const initialAccount1Balance = new BigNumber(await TC5.balanceOf(constants.account1))
      , initialAccount3Balance = new BigNumber(await TC5.balanceOf(constants.account3))
      , initialAccount4Balance = new BigNumber(await TC5.balanceOf(constants.account4));

    // Cache check
    const initialAccount1BalanceCache = await getAmountFromCache(constants.account1)
      , initialAccount3BalanceCache = await getAmountFromCache(constants.account3)
      , initialAccount4BalanceCache = await getAmountFromCache(constants.account4);

    assert.equal(initialAccount1Balance.toNumber(), initialAccount1BalanceCache.toNumber(), "account1: Actual and cacheValue mismatch");
    assert.equal(initialAccount3Balance.toNumber(), initialAccount3BalanceCache.toNumber(), "account3: Actual and cacheValue mismatch");
    assert.equal(initialAccount4Balance.toNumber(), initialAccount4BalanceCache.toNumber(), "account4: Actual and cacheValue mismatch");

    const beneficiary = 0
      , commissionAmount = new BigNumber(pricerOstUsd.toWei('5'))
      , commissionBeneficiary = constants.account4
      , currency = constants.currencyUSD
      , transferAmount = new BigNumber(pricerOstUsd.toWei('7'))
      ;

    const acceptedMarginData = await pricerOstUsd.acceptedMargins(currency);
    assert.equal(acceptedMarginData.isSuccess(), true);

    const estimatedValues = await pricerOstUsd.getPricePointAndCalculatedAmounts(
      transferAmount,
      commissionAmount,
      currency);
    assert.equal(estimatedValues.isSuccess(), true);

    const estimatedTokenAmount = new BigNumber(estimatedValues.data.tokenAmount);
    const estimatedCommissionTokenAmount = new BigNumber(estimatedValues.data.commissionTokenAmount);
    const estimatedMargin = new BigNumber(acceptedMarginData.data.acceptedMargins);
    const intendedPricePoint = estimatedValues.data.pricePoint;

    const total = estimatedTokenAmount
      .plus(estimatedCommissionTokenAmount)
      .plus(estimatedMargin);

    await TC5.approve(
      constants.account1,
      constants.accountPassphrase1,
      constants.pricerOstUsdAddress,
      total,
      constants.gasUsed);

    const payResponse = await pricerOstUsd.pay(
      constants.account1,
      constants.accountPassphrase1,
      beneficiary,
      transferAmount,
      commissionBeneficiary,
      commissionAmount,
      currency,
      intendedPricePoint,
      constants.gasUsed,
      {returnType: constants.returnTypeReceipt});

    assert.equal(payResponse.isFailure(), true);

    const account1Balance = new BigNumber(await TC5.balanceOf(constants.account1))
      , account3Balance = new BigNumber(await TC5.balanceOf(constants.account3))
      , account4Balance = new BigNumber(await TC5.balanceOf(constants.account4));

    assert.equal(initialAccount1Balance.toNumber(), account1Balance.toNumber());
    assert.equal(initialAccount3Balance.toNumber(), account3Balance.toNumber());
    assert.equal(initialAccount4Balance.toNumber(), account4Balance.toNumber());

    // Cache check
    const finalAccount1BalanceCache = await getAmountFromCache(constants.account1)
      , finalAccount3BalanceCache = await getAmountFromCache(constants.account3)
      , finalAccount4BalanceCache = await getAmountFromCache(constants.account4)
    ;

    assert.equal(account1Balance.toNumber(), finalAccount1BalanceCache.toNumber(), "account1: Actual and cacheValue mismatch after test");
    assert.equal(account3Balance.toNumber(), finalAccount3BalanceCache.toNumber(), "account3: Actual and cacheValue mismatch after test");
    assert.equal(account4Balance.toNumber(), finalAccount4BalanceCache.toNumber(), "account4: Actual and cacheValue mismatch after test");

  });


  it('should fail when currency is not available in pricer', async function() {
    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    const initialAccount1Balance = new BigNumber(await TC5.balanceOf(constants.account1))
      , initialAccount3Balance = new BigNumber(await TC5.balanceOf(constants.account3))
      , initialAccount4Balance = new BigNumber(await TC5.balanceOf(constants.account4));

    // Cache check
    const initialAccount1BalanceCache = await getAmountFromCache(constants.account1)
      , initialAccount3BalanceCache = await getAmountFromCache(constants.account3)
      , initialAccount4BalanceCache = await getAmountFromCache(constants.account4)
    ;

    assert.equal(initialAccount1Balance.toNumber(), initialAccount1BalanceCache.toNumber(), "account1: Actual and cacheValue mismatch");
    assert.equal(initialAccount3Balance.toNumber(), initialAccount3BalanceCache.toNumber(), "account3: Actual and cacheValue mismatch");
    assert.equal(initialAccount4Balance.toNumber(), initialAccount4BalanceCache.toNumber(), "account4: Actual and cacheValue mismatch");

    const beneficiary = constants.account3
      , commissionAmount = new BigNumber(pricerOstUsd.toWei('10'))
      , commissionBeneficiary = constants.account4
      , currency = constants.currencyUSD
      , transferAmount = new BigNumber(pricerOstUsd.toWei('5'))
      ;

    const acceptedMarginData = await pricerOstUsd.acceptedMargins(currency);
    assert.equal(acceptedMarginData.isSuccess(), true);

    const estimatedValues = await pricerOstUsd.getPricePointAndCalculatedAmounts(
      transferAmount,
      commissionAmount,
      currency);
    assert.equal(estimatedValues.isSuccess(), true);

    const estimatedTokenAmount = new BigNumber(estimatedValues.data.tokenAmount);
    const estimatedCommissionTokenAmount = new BigNumber(estimatedValues.data.commissionTokenAmount);
    const estimatedMargin = new BigNumber(acceptedMarginData.data.acceptedMargins);
    const intendedPricePoint = estimatedValues.data.pricePoint;

    const total = estimatedTokenAmount
      .plus(estimatedCommissionTokenAmount)
      .plus(estimatedMargin);

    await TC5.approve(
      constants.account1,
      constants.accountPassphrase1,
      constants.pricerOstUsdAddress,
      total,
      constants.gasUsed);

    const payResponse = await pricerOstUsd.pay(
      constants.account1,
      constants.accountPassphrase1,
      beneficiary,
      transferAmount,
      commissionBeneficiary,
      commissionAmount,
      constants.currencyINR,
      intendedPricePoint,
      constants.gasUsed,
      {returnType: constants.returnTypeReceipt});

    // verify if the transaction receipt is valid
    utils.verifyTransactionReceipt(payResponse);

    // verify if the transaction has was actually mined
    await utils.verifyIfMined(pricerOstUsd, payResponse.data.transaction_hash);

    const account1Balance = new BigNumber(await TC5.balanceOf(constants.account1))
      , account3Balance = new BigNumber(await TC5.balanceOf(constants.account3))
      , account4Balance = new BigNumber(await TC5.balanceOf(constants.account4));

    assert.equal(initialAccount1Balance.toNumber(), account1Balance.toNumber());
    assert.equal(initialAccount3Balance.toNumber(), account3Balance.toNumber());
    assert.equal(initialAccount4Balance.toNumber(), account4Balance.toNumber());

    // Cache check
    const finalAccount1BalanceCache = await getAmountFromCache(constants.account1)
      , finalAccount3BalanceCache = await getAmountFromCache(constants.account3)
      , finalAccount4BalanceCache = await getAmountFromCache(constants.account4);

    assert.equal(account1Balance.toNumber(), finalAccount1BalanceCache.toNumber(), "account1: Actual and cacheValue mismatch after test");
    assert.equal(account3Balance.toNumber(), finalAccount3BalanceCache.toNumber(), "account3: Actual and cacheValue mismatch after test");
    assert.equal(account4Balance.toNumber(), finalAccount4BalanceCache.toNumber(), "account4: Actual and cacheValue mismatch after test");

  });


  it('should fail when commision amount is not 0 and commision beneficiary address is 0', async function() {
    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    const initialAccount1Balance = new BigNumber(await TC5.balanceOf(constants.account1))
      , initialAccount3Balance = new BigNumber(await TC5.balanceOf(constants.account3))
      , initialAccount4Balance = new BigNumber(await TC5.balanceOf(constants.account4));

    // Cache check
    const initialAccount1BalanceCache = await getAmountFromCache(constants.account1)
      , initialAccount3BalanceCache = await getAmountFromCache(constants.account3)
      , initialAccount4BalanceCache = await getAmountFromCache(constants.account4);

    assert.equal(initialAccount1Balance.toNumber(), initialAccount1BalanceCache.toNumber(), "account1: Actual and cacheValue mismatch");
    assert.equal(initialAccount3Balance.toNumber(), initialAccount3BalanceCache.toNumber(), "account3: Actual and cacheValue mismatch");
    assert.equal(initialAccount4Balance.toNumber(), initialAccount4BalanceCache.toNumber(), "account4: Actual and cacheValue mismatch");

    const beneficiary = constants.account1
      , commissionAmount = new BigNumber(pricerOstUsd.toWei('10'))
      , commissionBeneficiary = 0
      , currency = constants.currencyUSD
      , transferAmount = new BigNumber(pricerOstUsd.toWei('5'))
      ;

    const acceptedMarginData = await pricerOstUsd.acceptedMargins(currency);
    assert.equal(acceptedMarginData.isSuccess(), true);

    const estimatedValues = await pricerOstUsd.getPricePointAndCalculatedAmounts(
      transferAmount,
      commissionAmount,
      currency);
    assert.equal(estimatedValues.isSuccess(), true);

    const estimatedTokenAmount = new BigNumber(estimatedValues.data.tokenAmount);
    const estimatedCommissionTokenAmount = new BigNumber(estimatedValues.data.commissionTokenAmount);
    const estimatedMargin = new BigNumber(acceptedMarginData.data.acceptedMargins);
    const intendedPricePoint = estimatedValues.data.pricePoint;

    const total = estimatedTokenAmount
      .plus(estimatedCommissionTokenAmount)
      .plus(estimatedMargin);

    await TC5.approve(
      constants.account1,
      constants.accountPassphrase1,
      constants.pricerOstUsdAddress,
      total,
      constants.gasUsed);

    const payResponse = await pricerOstUsd.pay(
      constants.account1,
      constants.accountPassphrase1,
      beneficiary,
      transferAmount,
      commissionBeneficiary,
      commissionAmount,
      currency,
      intendedPricePoint,
      constants.gasUsed,
      {returnType: constants.returnTypeReceipt});

    assert.equal(payResponse.isFailure(), true);

    const account1Balance = new BigNumber(await TC5.balanceOf(constants.account1))
      , account3Balance = new BigNumber(await TC5.balanceOf(constants.account3))
      , account4Balance = new BigNumber(await TC5.balanceOf(constants.account4));

    assert.equal(initialAccount1Balance.toNumber(), account1Balance.toNumber());
    assert.equal(initialAccount3Balance.toNumber(), account3Balance.toNumber());
    assert.equal(initialAccount4Balance.toNumber(), account4Balance.toNumber());

    // Cache check
    const finalAccount1BalanceCache = await getAmountFromCache(constants.account1)
      , finalAccount3BalanceCache = await getAmountFromCache(constants.account3)
      , finalAccount4BalanceCache = await getAmountFromCache(constants.account4);

    assert.equal(account1Balance.toNumber(), finalAccount1BalanceCache.toNumber(), "account1: Actual and cacheValue mismatch after test");
    assert.equal(account3Balance.toNumber(), finalAccount3BalanceCache.toNumber(), "account3: Actual and cacheValue mismatch after test");
    assert.equal(account4Balance.toNumber(), finalAccount4BalanceCache.toNumber(), "account4: Actual and cacheValue mismatch after test");

  });

  it('should fail when intendedPricePoint is more than the acceptable margin of current price point', async function() {
    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    const initialAccount1Balance = new BigNumber(await TC5.balanceOf(constants.account1))
      , initialAccount3Balance = new BigNumber(await TC5.balanceOf(constants.account3))
      , initialAccount4Balance = new BigNumber(await TC5.balanceOf(constants.account4));

    // Cache check
    const initialAccount1BalanceCache = await getAmountFromCache(constants.account1)
      , initialAccount3BalanceCache = await getAmountFromCache(constants.account3)
      , initialAccount4BalanceCache = await getAmountFromCache(constants.account4)
    ;

    assert.equal(initialAccount1Balance.toNumber(), initialAccount1BalanceCache.toNumber(), "account1: Actual and cacheValue mismatch");
    assert.equal(initialAccount3Balance.toNumber(), initialAccount3BalanceCache.toNumber(), "account3: Actual and cacheValue mismatch");
    assert.equal(initialAccount4Balance.toNumber(), initialAccount4BalanceCache.toNumber(), "account4: Actual and cacheValue mismatch");

    const beneficiary = constants.account3
      , commissionAmount = new BigNumber(pricerOstUsd.toWei('10'))
      , commissionBeneficiary = constants.account4
      , currency = constants.currencyUSD
      , transferAmount = new BigNumber(pricerOstUsd.toWei('5'))
    ;

    const acceptedMarginData = await pricerOstUsd.acceptedMargins(currency);
    assert.equal(acceptedMarginData.isSuccess(), true);

    const estimatedValues = await pricerOstUsd.getPricePointAndCalculatedAmounts(
      transferAmount,
      commissionAmount,
      currency);
    assert.equal(estimatedValues.isSuccess(), true);

    const estimatedTokenAmount = new BigNumber(estimatedValues.data.tokenAmount);
    const estimatedCommissionTokenAmount = new BigNumber(estimatedValues.data.commissionTokenAmount);
    const estimatedMargin = new BigNumber(acceptedMarginData.data.acceptedMargins);
    const intendedPricePoint = estimatedValues.data.pricePoint;

    const total = estimatedTokenAmount.plus(estimatedCommissionTokenAmount).plus(estimatedMargin);

    await TC5.approve(
      constants.account1,
      constants.accountPassphrase1,
      constants.pricerOstUsdAddress,
      total,
      constants.gasUsed);

    const changedPricePoint = new BigNumber(intendedPricePoint)
      .plus(estimatedMargin)
      .plus(new BigNumber(1));

    const payResponse = await pricerOstUsd.pay(
      constants.account1,
      constants.accountPassphrase1,
      beneficiary,
      transferAmount,
      commissionBeneficiary,
      commissionAmount,
      currency,
      changedPricePoint,
      constants.gasUsed,
      {returnType: constants.returnTypeReceipt});

    // verify if the transaction receipt is valid
    utils.verifyTransactionReceipt(payResponse);

    // verify if the transaction has was actually mined
    await utils.verifyIfMined(pricerOstUsd, payResponse.data.transaction_hash);

    const account1Balance = new BigNumber(await TC5.balanceOf(constants.account1))
      , account3Balance = new BigNumber(await TC5.balanceOf(constants.account3))
      , account4Balance = new BigNumber(await TC5.balanceOf(constants.account4));

    assert.equal(initialAccount1Balance.toNumber(), account1Balance.toNumber());
    assert.equal(initialAccount3Balance.toNumber(), account3Balance.toNumber());
    assert.equal(initialAccount4Balance.toNumber(), account4Balance.toNumber());

    // Cache check
    const finalAccount1BalanceCache = await getAmountFromCache(constants.account1)
      , finalAccount3BalanceCache = await getAmountFromCache(constants.account3)
      , finalAccount4BalanceCache = await getAmountFromCache(constants.account4)
    ;

    assert.equal(account1Balance.toNumber(), finalAccount1BalanceCache.toNumber(), "account1: Actual and cacheValue mismatch after test");
    assert.equal(account3Balance.toNumber(), finalAccount3BalanceCache.toNumber(), "account3: Actual and cacheValue mismatch after test");
    assert.equal(account4Balance.toNumber(), finalAccount4BalanceCache.toNumber(), "account4: Actual and cacheValue mismatch after test");

  });


  it('should fail when intendedPricePoint is less than the acceptable margin of current price point', async function() {
    // eslint-disable-next-line no-invalid-this
    this.timeout(200000);

    const initialAccount1Balance = new BigNumber(await TC5.balanceOf(constants.account1))
      , initialAccount3Balance = new BigNumber(await TC5.balanceOf(constants.account3))
      , initialAccount4Balance = new BigNumber(await TC5.balanceOf(constants.account4));

    // Cache check
    const initialAccount1BalanceCache = await getAmountFromCache(constants.account1)
      , initialAccount3BalanceCache = await getAmountFromCache(constants.account3)
      , initialAccount4BalanceCache = await getAmountFromCache(constants.account4);

    assert.equal(initialAccount1Balance.toNumber(), initialAccount1BalanceCache.toNumber(), "account1: Actual and cacheValue mismatch");
    assert.equal(initialAccount3Balance.toNumber(), initialAccount3BalanceCache.toNumber(), "account3: Actual and cacheValue mismatch");
    assert.equal(initialAccount4Balance.toNumber(), initialAccount4BalanceCache.toNumber(), "account4: Actual and cacheValue mismatch");

    const beneficiary = constants.account3
      , commissionAmount = new BigNumber(pricerOstUsd.toWei('10'))
      , commissionBeneficiary = constants.account4
      , currency = constants.currencyUSD
      , transferAmount = new BigNumber(pricerOstUsd.toWei('5'))
      ;

    const acceptedMarginData = await pricerOstUsd.acceptedMargins(currency);
    assert.equal(acceptedMarginData.isSuccess(), true);

    const estimatedValues = await pricerOstUsd.getPricePointAndCalculatedAmounts(
      transferAmount,
      commissionAmount,
      currency);
    assert.equal(estimatedValues.isSuccess(), true);

    const estimatedTokenAmount = new BigNumber(estimatedValues.data.tokenAmount);
    const estimatedCommissionTokenAmount = new BigNumber(estimatedValues.data.commissionTokenAmount);
    const estimatedMargin = new BigNumber(acceptedMarginData.data.acceptedMargins);
    const intendedPricePoint = estimatedValues.data.pricePoint;

    const total = estimatedTokenAmount
      .plus(estimatedCommissionTokenAmount)
      .plus(estimatedMargin);

    await TC5.approve(
      constants.account1,
      constants.accountPassphrase1,
      constants.pricerOstUsdAddress,
      total,
      constants.gasUsed);

    const changedPricePoint = new BigNumber(intendedPricePoint)
      .minus(estimatedMargin)
      .minus(new BigNumber(1));

    const payResponse = await pricerOstUsd.pay(
      constants.account1,
      constants.accountPassphrase1,
      beneficiary,
      transferAmount,
      commissionBeneficiary,
      commissionAmount,
      currency,
      changedPricePoint,
      constants.gasUsed,
      {returnType: constants.returnTypeReceipt});

    // verify if the transaction receipt is valid
    utils.verifyTransactionReceipt(payResponse);

    // verify if the transaction has was actually mined
    await utils.verifyIfMined(pricerOstUsd, payResponse.data.transaction_hash);

    const account1Balance = new BigNumber(await TC5.balanceOf(constants.account1))
      , account3Balance = new BigNumber(await TC5.balanceOf(constants.account3))
      , account4Balance = new BigNumber(await TC5.balanceOf(constants.account4));

    assert.equal(initialAccount1Balance.toNumber(), account1Balance.toNumber());
    assert.equal(initialAccount3Balance.toNumber(), account3Balance.toNumber());
    assert.equal(initialAccount4Balance.toNumber(), account4Balance.toNumber());

    // Cache check
    const finalAccount1BalanceCache = await getAmountFromCache(constants.account1)
      , finalAccount3BalanceCache = await getAmountFromCache(constants.account3)
      , finalAccount4BalanceCache = await getAmountFromCache(constants.account4);

    assert.equal(account1Balance.toNumber(), finalAccount1BalanceCache.toNumber(), "account1: Actual and cacheValue mismatch after test");
    assert.equal(account3Balance.toNumber(), finalAccount3BalanceCache.toNumber(), "account3: Actual and cacheValue mismatch after test");
    assert.equal(account4Balance.toNumber(), finalAccount4BalanceCache.toNumber(), "account4: Actual and cacheValue mismatch after test");

  });


  it('should fail when price point is 0 and currency is not blank', async function() {
    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    const initialAccount1Balance = new BigNumber(await TC5.balanceOf(constants.account1))
      , initialAccount3Balance = new BigNumber(await TC5.balanceOf(constants.account3))
      , initialAccount4Balance = new BigNumber(await TC5.balanceOf(constants.account4));

    // Cache check
    const initialAccount1BalanceCache = await getAmountFromCache(constants.account1)
      , initialAccount3BalanceCache = await getAmountFromCache(constants.account3)
      , initialAccount4BalanceCache = await getAmountFromCache(constants.account4);

    assert.equal(initialAccount1Balance.toNumber(), initialAccount1BalanceCache.toNumber(), "account1: Actual and cacheValue mismatch");
    assert.equal(initialAccount3Balance.toNumber(), initialAccount3BalanceCache.toNumber(), "account3: Actual and cacheValue mismatch");
    assert.equal(initialAccount4Balance.toNumber(), initialAccount4BalanceCache.toNumber(), "account4: Actual and cacheValue mismatch");

    const beneficiary = constants.account3
      , commissionAmount = new BigNumber(pricerOstUsd.toWei('10'))
      , commissionBeneficiary = constants.account4
      , currency = constants.currencyUSD
      , transferAmount = new BigNumber(pricerOstUsd.toWei('5'))
      ;

    const acceptedMarginData = await pricerOstUsd.acceptedMargins(currency);
    assert.equal(acceptedMarginData.isSuccess(), true);

    const estimatedValues = await pricerOstUsd.getPricePointAndCalculatedAmounts(
      transferAmount,
      commissionAmount,
      currency);
    assert.equal(estimatedValues.isSuccess(), true);

    const estimatedTokenAmount = new BigNumber(estimatedValues.data.tokenAmount);
    const estimatedCommissionTokenAmount = new BigNumber(estimatedValues.data.commissionTokenAmount);
    const estimatedMargin = new BigNumber(acceptedMarginData.data.acceptedMargins);
    const intendedPricePoint = estimatedValues.data.pricePoint;

    const total = estimatedTokenAmount
      .plus(estimatedCommissionTokenAmount)
      .plus(estimatedMargin);

    await TC5.approve(
      constants.account1,
      constants.accountPassphrase1,
      constants.pricerOstUsdAddress,
      total,
      constants.gasUsed);

    const payResponse = await pricerOstUsd.pay(
      constants.account1,
      constants.accountPassphrase1,
      beneficiary,
      transferAmount,
      commissionBeneficiary,
      commissionAmount,
      constants.currencyINR,
      intendedPricePoint,
      constants.gasUsed,
      {returnType: constants.returnTypeReceipt});

    // verify if the transaction receipt is valid
    utils.verifyTransactionReceipt(payResponse);

    // verify if the transaction has was actually mined
    await utils.verifyIfMined(pricerOstUsd, payResponse.data.transaction_hash);

    const account1Balance = new BigNumber(await TC5.balanceOf(constants.account1))
      , account3Balance = new BigNumber(await TC5.balanceOf(constants.account3))
      , account4Balance = new BigNumber(await TC5.balanceOf(constants.account4));

    assert.equal(initialAccount1Balance.toNumber(), account1Balance.toNumber());
    assert.equal(initialAccount3Balance.toNumber(), account3Balance.toNumber());
    assert.equal(initialAccount4Balance.toNumber(), account4Balance.toNumber());

    // Cache check
    const finalAccount1BalanceCache = await getAmountFromCache(constants.account1)
      , finalAccount3BalanceCache = await getAmountFromCache(constants.account3)
      , finalAccount4BalanceCache = await getAmountFromCache(constants.account4);

    assert.equal(account1Balance.toNumber(), finalAccount1BalanceCache.toNumber(), "account1: Actual and cacheValue mismatch after test");
    assert.equal(account3Balance.toNumber(), finalAccount3BalanceCache.toNumber(), "account3: Actual and cacheValue mismatch after test");
    assert.equal(account4Balance.toNumber(), finalAccount4BalanceCache.toNumber(), "account4: Actual and cacheValue mismatch after test");

  });


  it('should pass when all parameters are valid and commission beneficiary address, commissionAmount is 0', async function() {
    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    const initialAccount1Balance = new BigNumber(await TC5.balanceOf(constants.account1))
      , initialAccount3Balance = new BigNumber(await TC5.balanceOf(constants.account3))
      , initialAccount4Balance = new BigNumber(await TC5.balanceOf(constants.account4));

    // Cache check
    const initialAccount1BalanceCache = await getAmountFromCache(constants.account1)
      , initialAccount3BalanceCache = await getAmountFromCache(constants.account3)
      , initialAccount4BalanceCache = await getAmountFromCache(constants.account4);

    assert.equal(initialAccount1Balance.toNumber(), initialAccount1BalanceCache.toNumber(), "account1: Actual and cacheValue mismatch");
    assert.equal(initialAccount3Balance.toNumber(), initialAccount3BalanceCache.toNumber(), "account3: Actual and cacheValue mismatch");
    assert.equal(initialAccount4Balance.toNumber(), initialAccount4BalanceCache.toNumber(), "account4: Actual and cacheValue mismatch");

    const beneficiary = constants.account3
      , commissionAmount = new BigNumber(pricerOstUsd.toWei('0'))
      , commissionBeneficiary = constants.account4
      , currency = constants.currencyUSD
      , transferAmount = new BigNumber(pricerOstUsd.toWei('5'))
      ;

    const acceptedMarginData = await pricerOstUsd.acceptedMargins(currency);
    assert.equal(acceptedMarginData.isSuccess(), true);

    const estimatedValues = await pricerOstUsd.getPricePointAndCalculatedAmounts(
      transferAmount,
      commissionAmount,
      currency);
    assert.equal(estimatedValues.isSuccess(), true);
    assert.equal(estimatedValues.data.commissionTokenAmount, 0);

    const estimatedTokenAmount = new BigNumber(estimatedValues.data.tokenAmount);
    const estimatedMargin = new BigNumber(acceptedMarginData.data.acceptedMargins);
    const intendedPricePoint = estimatedValues.data.pricePoint;

    const total = estimatedTokenAmount.plus(estimatedMargin);

    await TC5.approve(
      constants.account1,
      constants.accountPassphrase1,
      constants.pricerOstUsdAddress,
      total,
      constants.gasUsed);

    const payResponse = await pricerOstUsd.pay(
      constants.account1,
      constants.accountPassphrase1,
      beneficiary,
      transferAmount,
      commissionBeneficiary,
      commissionAmount,
      currency,
      intendedPricePoint,
      constants.gasUsed,
      {returnType: constants.returnTypeReceipt});

    // verify if the transaction receipt is valid
    utils.verifyTransactionReceipt(payResponse);

    // verify if the transaction has was actually mined
    await utils.verifyIfMined(pricerOstUsd, payResponse.data.transaction_hash);

    const account1Balance = new BigNumber(await TC5.balanceOf(constants.account1))
      , account3Balance = new BigNumber(await TC5.balanceOf(constants.account3))
      , account4Balance = new BigNumber(await TC5.balanceOf(constants.account4));

    assert.equal(initialAccount1Balance.minus(estimatedTokenAmount).toNumber(), account1Balance.toNumber());
    assert.equal(initialAccount3Balance.plus(estimatedTokenAmount).toNumber(), account3Balance.toNumber());
    assert.equal(initialAccount4Balance.toNumber(), account4Balance.toNumber());

    // Cache check
    const finalAccount1BalanceCache = await getAmountFromCache(constants.account1)
      , finalAccount3BalanceCache = await getAmountFromCache(constants.account3)
      , finalAccount4BalanceCache = await getAmountFromCache(constants.account4);

    assert.equal(account1Balance.toNumber(), finalAccount1BalanceCache.toNumber(), "account1: Actual and cacheValue mismatch after test");
    assert.equal(account3Balance.toNumber(), finalAccount3BalanceCache.toNumber(), "account3: Actual and cacheValue mismatch after test");
    assert.equal(account4Balance.toNumber(), finalAccount4BalanceCache.toNumber(), "account4: Actual and cacheValue mismatch after test");

  });


  it('should pass when all parameters are valid and currency is blank (BT Transfer)', async function() {
    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    const initialAccount1Balance = new BigNumber(await TC5.balanceOf(constants.account1))
      , initialAccount3Balance = new BigNumber(await TC5.balanceOf(constants.account3))
      , initialAccount4Balance = new BigNumber(await TC5.balanceOf(constants.account4));

    // Cache check
    const initialAccount1BalanceCache = await getAmountFromCache(constants.account1)
      , initialAccount3BalanceCache = await getAmountFromCache(constants.account3)
      , initialAccount4BalanceCache = await getAmountFromCache(constants.account4);

    assert.equal(initialAccount1Balance.toNumber(), initialAccount1BalanceCache.toNumber(), "account1: Actual and cacheValue mismatch");
    assert.equal(initialAccount3Balance.toNumber(), initialAccount3BalanceCache.toNumber(), "account3: Actual and cacheValue mismatch");
    assert.equal(initialAccount4Balance.toNumber(), initialAccount4BalanceCache.toNumber(), "account4: Actual and cacheValue mismatch");

    const beneficiary = constants.account3
      , commissionAmount = new BigNumber(pricerOstUsd.toWei('5'))
      , commissionBeneficiary = constants.account4
      , currency = constants.currencyBlank
      , transferAmount = new BigNumber(pricerOstUsd.toWei('10'))
      ;

    const intendedPricePoint = 0;

    const total = transferAmount.plus(commissionAmount);

    await TC5.approve(
      constants.account1,
      constants.accountPassphrase1,
      constants.pricerOstUsdAddress,
      total,
      constants.gasUsed);

    const payResponse = await pricerOstUsd.pay(
      constants.account1,
      constants.accountPassphrase1,
      beneficiary,
      transferAmount,
      commissionBeneficiary,
      commissionAmount,
      currency,
      intendedPricePoint,
      constants.gasUsed,
      {returnType: constants.returnTypeReceipt});

    // verify if the transaction receipt is valid
    utils.verifyTransactionReceipt(payResponse);

    // verify if the transaction has was actually mined
    await utils.verifyIfMined(pricerOstUsd, payResponse.data.transaction_hash);

    const account1Balance = new BigNumber(await TC5.balanceOf(constants.account1))
      , account3Balance = new BigNumber(await TC5.balanceOf(constants.account3))
      , account4Balance = new BigNumber(await TC5.balanceOf(constants.account4));

    assert.equal(initialAccount1Balance.minus(total).toNumber(), account1Balance.toNumber());
    assert.equal(initialAccount3Balance.plus(transferAmount).toNumber(), account3Balance.toNumber());
    assert.equal(initialAccount4Balance.plus(commissionAmount).toNumber(), account4Balance.toNumber());

    // Cache check
    const finalAccount1BalanceCache = await getAmountFromCache(constants.account1)
      , finalAccount3BalanceCache = await getAmountFromCache(constants.account3)
      , finalAccount4BalanceCache = await getAmountFromCache(constants.account4);

    assert.equal(account1Balance.toNumber(), finalAccount1BalanceCache.toNumber(), "account1: Actual and cacheValue mismatch after test");
    assert.equal(account3Balance.toNumber(), finalAccount3BalanceCache.toNumber(), "account3: Actual and cacheValue mismatch after test");
    assert.equal(account4Balance.toNumber(), finalAccount4BalanceCache.toNumber(), "account4: Actual and cacheValue mismatch after test");
  });


  it('should fail when intended price point is 0', async function() {
    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    const initialAccount1Balance = new BigNumber(await TC5.balanceOf(constants.account1))
      , initialAccount3Balance = new BigNumber(await TC5.balanceOf(constants.account3))
      , initialAccount4Balance = new BigNumber(await TC5.balanceOf(constants.account4));

    // Cache check
    const initialAccount1BalanceCache = await getAmountFromCache(constants.account1)
      , initialAccount3BalanceCache = await getAmountFromCache(constants.account3)
      , initialAccount4BalanceCache = await getAmountFromCache(constants.account4);

    assert.equal(initialAccount1Balance.toNumber(), initialAccount1BalanceCache.toNumber(), "account1: Actual and cacheValue mismatch");
    assert.equal(initialAccount3Balance.toNumber(), initialAccount3BalanceCache.toNumber(), "account3: Actual and cacheValue mismatch");
    assert.equal(initialAccount4Balance.toNumber(), initialAccount4BalanceCache.toNumber(), "account4: Actual and cacheValue mismatch");

    const beneficiary = constants.account3
      , commissionAmount = new BigNumber(pricerOstUsd.toWei('10'))
      , commissionBeneficiary = constants.account4
      , currency = constants.currencyUSD
      , transferAmount = new BigNumber(pricerOstUsd.toWei('5'))
      ;

    const acceptedMarginData = await pricerOstUsd.acceptedMargins(currency);
    assert.equal(acceptedMarginData.isSuccess(), true);

    const estimatedValues = await pricerOstUsd.getPricePointAndCalculatedAmounts(
      transferAmount,
      commissionAmount,
      currency);
    assert.equal(estimatedValues.isSuccess(), true);

    const estimatedTokenAmount = new BigNumber(estimatedValues.data.tokenAmount);
    const estimatedCommissionTokenAmount = new BigNumber(estimatedValues.data.commissionTokenAmount);
    const estimatedMargin = new BigNumber(acceptedMarginData.data.acceptedMargins);

    const total = estimatedTokenAmount.plus(estimatedCommissionTokenAmount).plus(estimatedMargin);

    await TC5.approve(
      constants.account1,
      constants.accountPassphrase1,
      constants.pricerOstUsdAddress,
      total,
      constants.gasUsed);

    const payResponse = await pricerOstUsd.pay(
      constants.account1,
      constants.accountPassphrase1,
      beneficiary,
      transferAmount,
      commissionBeneficiary,
      commissionAmount,
      constants.currencyUSD,
      0,
      constants.gasUsed,
      {returnType: constants.returnTypeReceipt});

    assert.equal(payResponse.isFailure(), true, "intendedPricePoint 0 cheek");
    // verify if the transaction receipt is valid
    //utils.verifyTransactionReceipt(payResponse);

    // verify if the transaction has was actually mined
    //await utils.verifyIfMined(pricerOstUsd, payResponse.data.transaction_hash);

    const account1Balance = new BigNumber(await TC5.balanceOf(constants.account1))
      , account3Balance = new BigNumber(await TC5.balanceOf(constants.account3))
      , account4Balance = new BigNumber(await TC5.balanceOf(constants.account4));

    assert.equal(initialAccount1Balance.toNumber(), account1Balance.toNumber());
    assert.equal(initialAccount3Balance.toNumber(), account3Balance.toNumber());
    assert.equal(initialAccount4Balance.toNumber(), account4Balance.toNumber());

    // Cache check
    const finalAccount1BalanceCache = await getAmountFromCache(constants.account1)
      , finalAccount3BalanceCache = await getAmountFromCache(constants.account3)
      , finalAccount4BalanceCache = await getAmountFromCache(constants.account4);

    assert.equal(account1Balance.toNumber(), finalAccount1BalanceCache.toNumber(), "account1: Actual and cacheValue mismatch after test");
    assert.equal(account3Balance.toNumber(), finalAccount3BalanceCache.toNumber(), "account3: Actual and cacheValue mismatch after test");
    assert.equal(account4Balance.toNumber(), finalAccount4BalanceCache.toNumber(), "account4: Actual and cacheValue mismatch after test");

  });


  it('should pass for interaction layer test when return type is uuid', async function() {

    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    const beneficiary = constants.account3
      , commissionAmount = new BigNumber(pricerOstUsd.toWei('2'))
      , commissionBeneficiary = constants.account4
      , currency = constants.currencyUSD
      , transferAmount = new BigNumber(pricerOstUsd.toWei('7'))
      ;

    const acceptedMarginData = await pricerOstUsd.acceptedMargins(currency);
    assert.equal(acceptedMarginData.isSuccess(), true);

    const estimatedValues = await pricerOstUsd.getPricePointAndCalculatedAmounts(
      transferAmount,
      commissionAmount,
      currency);

    assert.equal(estimatedValues.isSuccess(), true);

    const estimatedTokenAmount = new BigNumber(estimatedValues.data.tokenAmount);
    const estimatedCommissionTokenAmount = new BigNumber(estimatedValues.data.commissionTokenAmount);

    const intendedPricePoint = estimatedValues.data.pricePoint;

    const estimatedTotalAmount = new BigNumber(0).plus(estimatedTokenAmount).plus(estimatedCommissionTokenAmount);

    await TC5.approve(
      constants.account1,
      constants.accountPassphrase1,
      constants.pricerOstUsdAddress,
      estimatedTotalAmount,
      constants.gasUsed);

    const payResponse = await pricerOstUsd.pay(
      constants.account1,
      constants.accountPassphrase1,
      beneficiary,
      transferAmount,
      commissionBeneficiary,
      commissionAmount,
      currency,
      intendedPricePoint,
      constants.gasUsed,
      {returnType: constants.returnTypeUUID});

    // verify if the transaction receipt is valid
    // we will not verify if it got mined as its just interaction layer testing
    utils.verifyTransactionUUID(payResponse);

  });

  it('should pass for interaction layer test when return type is txHash', async function() {

    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    const beneficiary = constants.account3
      , commissionAmount = new BigNumber(pricerOstUsd.toWei('2'))
      , commissionBeneficiary = constants.account4
      , currency = constants.currencyUSD
      , transferAmount = new BigNumber(pricerOstUsd.toWei('7'))
      ;

    const acceptedMarginData = await pricerOstUsd.acceptedMargins(currency);
    assert.equal(acceptedMarginData.isSuccess(), true);

    const estimatedValues = await pricerOstUsd.getPricePointAndCalculatedAmounts(
      transferAmount,
      commissionAmount,
      currency);

    assert.equal(estimatedValues.isSuccess(), true);

    const estimatedTokenAmount = new BigNumber(estimatedValues.data.tokenAmount);
    const estimatedCommissionTokenAmount = new BigNumber(estimatedValues.data.commissionTokenAmount);

    const intendedPricePoint = estimatedValues.data.pricePoint;

    const estimatedTotalAmount = new BigNumber(0).plus(estimatedTokenAmount).plus(estimatedCommissionTokenAmount);

    await TC5.approve(
      constants.account1,
      constants.accountPassphrase1,
      constants.pricerOstUsdAddress,
      estimatedTotalAmount,
      constants.gasUsed);

    const payResponse = await pricerOstUsd.pay(
      constants.account1,
      constants.accountPassphrase1,
      beneficiary,
      transferAmount,
      commissionBeneficiary,
      commissionAmount,
      currency,
      intendedPricePoint,
      constants.gasUsed,
      {returnType: constants.returnTypeHash});

    // verify if the transaction hash is valid
    // we will not verify if it got mined as its just interaction layer testing
    utils.verifyTransactionHash(payResponse);

  });

  it('should pass for interaction layer test when return type is txReceipt', async function() {

    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    const beneficiary = constants.account3
      , commissionAmount = new BigNumber(pricerOstUsd.toWei('2'))
      , commissionBeneficiary = constants.account4
      , currency = constants.currencyUSD
      , transferAmount = new BigNumber(pricerOstUsd.toWei('7'))
      ;

    const acceptedMarginData = await pricerOstUsd.acceptedMargins(currency);
    assert.equal(acceptedMarginData.isSuccess(), true);

    const estimatedValues = await pricerOstUsd.getPricePointAndCalculatedAmounts(
      transferAmount,
      commissionAmount,
      currency);

    assert.equal(estimatedValues.isSuccess(), true);

    const estimatedTokenAmount = new BigNumber(estimatedValues.data.tokenAmount);
    const estimatedCommissionTokenAmount = new BigNumber(estimatedValues.data.commissionTokenAmount);

    const intendedPricePoint = estimatedValues.data.pricePoint;

    const estimatedTotalAmount = new BigNumber(0).plus(estimatedTokenAmount).plus(estimatedCommissionTokenAmount);

    await TC5.approve(
      constants.account1,
      constants.accountPassphrase1,
      constants.pricerOstUsdAddress,
      estimatedTotalAmount,
      constants.gasUsed);

    const payResponse = await pricerOstUsd.pay(
      constants.account1,
      constants.accountPassphrase1,
      beneficiary,
      transferAmount,
      commissionBeneficiary,
      commissionAmount,
      currency,
      intendedPricePoint,
      constants.gasUsed,
      {returnType: constants.returnTypeReceipt});

    // verify if the transaction receipt is valid.
    // We will not check here if the value is really set as its just interaction layer testing.
    utils.verifyTransactionReceipt(payResponse);

  });


  it('should fail when sender has insufficient balance (BT Transfer)', async function() {
    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    const initialAccount1Balance = new BigNumber(await TC5.balanceOf(constants.account1))
      , initialAccount3Balance = new BigNumber(await TC5.balanceOf(constants.account3))
      , initialAccount4Balance = new BigNumber(await TC5.balanceOf(constants.account4));

    // Cache check
    const initialAccount1BalanceCache = await getAmountFromCache(constants.account1)
      , initialAccount3BalanceCache = await getAmountFromCache(constants.account3)
      , initialAccount4BalanceCache = await getAmountFromCache(constants.account4);

    assert.equal(initialAccount1Balance.toNumber(), initialAccount1BalanceCache.toNumber(), "account1: Actual and cacheValue mismatch");
    assert.equal(initialAccount3Balance.toNumber(), initialAccount3BalanceCache.toNumber(), "account3: Actual and cacheValue mismatch");
    assert.equal(initialAccount4Balance.toNumber(), initialAccount4BalanceCache.toNumber(), "account4: Actual and cacheValue mismatch");

    const beneficiary = constants.account3
      , commissionAmount = new BigNumber(pricerOstUsd.toWei('0.1'))
      , commissionBeneficiary = constants.account4
      , currency = constants.currencyBlank
      , transferAmount = new BigNumber(pricerOstUsd.toWei('50000'))
      ;

    const intendedPricePoint = 0;

    const total = transferAmount.plus(commissionAmount);

    await TC5.approve(
      constants.account1,
      constants.accountPassphrase1,
      constants.pricerOstUsdAddress,
      total,
      constants.gasUsed);

    const payResponse = await pricerOstUsd.pay(
      constants.account1,
      constants.accountPassphrase1,
      beneficiary,
      transferAmount,
      commissionBeneficiary,
      commissionAmount,
      currency,
      intendedPricePoint,
      constants.gasUsed,
      {returnType: constants.returnTypeReceipt});

    assert.equal(payResponse.isFailure(), true, "insufficient balance cheek");

    const account1Balance = new BigNumber(await TC5.balanceOf(constants.account1))
      , account3Balance = new BigNumber(await TC5.balanceOf(constants.account3))
      , account4Balance = new BigNumber(await TC5.balanceOf(constants.account4));

    assert.equal(initialAccount1Balance.toNumber(), account1Balance.toNumber());
    assert.equal(initialAccount3Balance.toNumber(), account3Balance.toNumber());
    assert.equal(initialAccount4Balance.toNumber(), account4Balance.toNumber());

    // Cache check
    const finalAccount1BalanceCache = await getAmountFromCache(constants.account1)
      , finalAccount3BalanceCache = await getAmountFromCache(constants.account3)
      , finalAccount4BalanceCache = await getAmountFromCache(constants.account4);

    assert.equal(account1Balance.toNumber(), finalAccount1BalanceCache.toNumber(), "account1: Actual and cacheValue mismatch after test");
    assert.equal(account3Balance.toNumber(), finalAccount3BalanceCache.toNumber(), "account3: Actual and cacheValue mismatch after test");
    assert.equal(account4Balance.toNumber(), finalAccount4BalanceCache.toNumber(), "account4: Actual and cacheValue mismatch after test");
  });

});


