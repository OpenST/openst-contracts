const chai = require('chai')
  , assert = chai.assert;

const rootPrefix = "../../.."
  , constants = require(rootPrefix + '/test/services/pricer/constants')
  , BigNumber = require('bignumber.js')
  , pricer = require(rootPrefix + '/lib/contract_interact/pricer')
  , pricerOstUsd = new pricer(constants.pricerOstUsdAddress)
  , pricerOstEur = new pricer(constants.pricerOstEurAddress)
  , mockToken = require(rootPrefix + '/lib/contract_interact/EIP20TokenMock')
  , TC5 = new mockToken(constants.TC5Address)
;

/* global describe, it */

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

    await pricerOstUsd.setAcceptedMargin(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyUSD,
      50,
      0xBA43B7400);

    const amResult = await pricerOstUsd.acceptedMargins(constants.currencyUSD);
    assert.equal(50, amResult);

    await pricerOstUsd.setPriceOracle(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyUSD,
      constants.priceOracles.OST.USD,
      0xBA43B7400);
    const poResult = await pricerOstUsd.priceOracles(constants.currencyUSD);
    assert.equal(constants.priceOracles.OST.USD, poResult);


    await TC5.setBalance(
      constants.ops,
      constants.opsPassphrase,
      constants.account1,
      pricerOstUsd.toWei('1000'),
      0xBA43B7400);

    const account1Balance = await TC5.balanceOf(constants.account1);
    assert.equal(account1Balance, pricerOstUsd.toWei('1000'));

    await TC5.setBalance(
      constants.ops,
      constants.opsPassphrase,
      constants.account2,
      pricerOstUsd.toWei('0'),
      0xBA43B7400);

    const account2Balance = await TC5.balanceOf(constants.account2);
    assert.equal(account2Balance, pricerOstUsd.toWei('0'));

    await TC5.setBalance(
      constants.ops,
      constants.opsPassphrase,
      constants.account3,
      pricerOstUsd.toWei('0'),
      0xBA43B7400);

    const account3Balance = await TC5.balanceOf(constants.account3);
    assert.equal(account3Balance, pricerOstUsd.toWei('0'));

    await TC5.setBalance(
      constants.ops,
      constants.opsPassphrase,
      constants.account4,
      pricerOstUsd.toWei('0'),
      0xBA43B7400);

    const account4Balance = await TC5.balanceOf(constants.account4);
    assert.equal(account4Balance, pricerOstUsd.toWei('0'));

  });

  it('should pass when all parameters are valid', async function() {
    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    const initialAccount1Balance = new BigNumber(await TC5.balanceOf(constants.account1))
      , initialAccount3Balance = new BigNumber(await TC5.balanceOf(constants.account3))
      , initialAccount4Balance = new BigNumber(await TC5.balanceOf(constants.account4));

    const beneficiary = constants.account3
      , commissionAmount = new BigNumber(pricerOstUsd.toWei('5'))
      , commissionBeneficiary = constants.account4
      , currency = constants.currencyUSD
      , intendedPricePoint = await pricerOstUsd.getPricePoint(currency)
      , transferAmount = new BigNumber(pricerOstUsd.toWei('10'))
      ;

    const acceptedMargin = await pricerOstUsd.acceptedMargins(currency);
    const estimatedValues = await pricerOstUsd.getPricePointAndCalculatedAmounts(
      transferAmount,
      commissionAmount,
      currency);

    const estimatedTokenAmount = new BigNumber(estimatedValues.tokenAmount);
    const estimatedCommissionTokenAmount = new BigNumber(estimatedValues.commissionTokenAmount);
    const estimatedMargin = new BigNumber(acceptedMargin);

    const estimatedTotalAmount = estimatedTokenAmount.plus(estimatedCommissionTokenAmount).plus(estimatedMargin);

    await TC5.approve(
      constants.account1,
      constants.accountPassphrase1,
      constants.pricerOstUsdAddress,
      estimatedTotalAmount,
      0xBA43B7400);

    await pricerOstUsd.pay(
      constants.account1,
      constants.accountPassphrase1,
      beneficiary,
      transferAmount,
      commissionBeneficiary,
      commissionAmount,
      currency,
      intendedPricePoint,
      0xBA43B7400);

    const account1Balance = new BigNumber(await TC5.balanceOf(constants.account1))
      , account3Balance = new BigNumber(await TC5.balanceOf(constants.account3))
      , account4Balance = new BigNumber(await TC5.balanceOf(constants.account4));

    assert.equal(
      initialAccount1Balance
        .minus(estimatedTokenAmount)
        .minus(estimatedCommissionTokenAmount)
        .toNumber(), account1Balance.toNumber());

    assert.equal(
      initialAccount3Balance
        .plus(estimatedTokenAmount)
        .toNumber(), account3Balance.toNumber());

    assert.equal(
      initialAccount4Balance
        .plus(estimatedCommissionTokenAmount)
        .toNumber(), account4Balance.toNumber());

  });

  it('should fail when sender balance is less than the amount being transfered', async function() {
    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    const initialAccount1Balance = new BigNumber(await TC5.balanceOf(constants.account1))
      , initialAccount3Balance = new BigNumber(await TC5.balanceOf(constants.account3))
      , initialAccount4Balance = new BigNumber(await TC5.balanceOf(constants.account4));

    const beneficiary = constants.account3
      , commissionAmount = new BigNumber(pricerOstUsd.toWei('100000'))
      , commissionBeneficiary = constants.account4
      , currency = constants.currencyUSD
      , intendedPricePoint = await pricerOstUsd.getPricePoint(currency)
      , transferAmount = new BigNumber(pricerOstUsd.toWei('5000'))
      ;

    const acceptedMargin = await pricerOstUsd.acceptedMargins(currency);
    const estimatedValues = await pricerOstUsd.getPricePointAndCalculatedAmounts(
      transferAmount,
      commissionAmount,
      currency);

    const estimatedTokenAmount = new BigNumber(estimatedValues.tokenAmount);
    const estimatedCommissionTokenAmount = new BigNumber(estimatedValues.commissionTokenAmount);
    const estimatedMargin = new BigNumber(acceptedMargin);

    const total = estimatedTokenAmount.plus(estimatedCommissionTokenAmount).plus(estimatedMargin);

    await TC5.approve(
      constants.account1,
      constants.accountPassphrase1,
      constants.pricerOstUsdAddress,
      total,
      0xBA43B7400);

    await pricerOstUsd.pay(
      constants.account1,
      constants.accountPassphrase1,
      beneficiary,
      transferAmount,
      commissionBeneficiary,
      commissionAmount,
      currency,
      intendedPricePoint,
      0xBA43B7400);

    const account1Balance = new BigNumber(await TC5.balanceOf(constants.account1))
      , account3Balance = new BigNumber(await TC5.balanceOf(constants.account3))
      , account4Balance = new BigNumber(await TC5.balanceOf(constants.account4));

    assert.equal(initialAccount1Balance.toNumber(), account1Balance.toNumber());
    assert.equal(initialAccount3Balance.toNumber(), account3Balance.toNumber());
    assert.equal(initialAccount4Balance.toNumber(), account4Balance.toNumber());

  });


  it('should fail when sender has approved less amount than the amount being transfered', async function() {
    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    const initialAccount1Balance = new BigNumber(await TC5.balanceOf(constants.account1))
      , initialAccount3Balance = new BigNumber(await TC5.balanceOf(constants.account3))
      , initialAccount4Balance = new BigNumber(await TC5.balanceOf(constants.account4));

    const beneficiary = constants.account3
      , commissionAmount = new BigNumber(pricerOstUsd.toWei('5'))
      , commissionBeneficiary = constants.account4
      , currency = constants.currencyUSD
      , intendedPricePoint = await pricerOstUsd.getPricePoint(currency)
      , transferAmount = new BigNumber(pricerOstUsd.toWei('12'))
      ;

    const acceptedMargin = await pricerOstUsd.acceptedMargins(currency);
    const estimatedValues = await pricerOstUsd.getPricePointAndCalculatedAmounts(
      transferAmount,
      commissionAmount,
      currency);

    const estimatedTokenAmount = new BigNumber(estimatedValues.tokenAmount);
    const estimatedCommissionTokenAmount = new BigNumber(estimatedValues.commissionTokenAmount);
    const estimatedMargin = new BigNumber(acceptedMargin);

    const total = estimatedTokenAmount
      .plus(estimatedCommissionTokenAmount)
      .minus(estimatedMargin)
      .minus(new BigNumber(100));

    await TC5.approve(
      constants.account1,
      constants.accountPassphrase1,
      constants.pricerOstUsdAddress,
      total,
      0xBA43B7400);

    await pricerOstUsd.pay(
      constants.account1,
      constants.accountPassphrase1,
      beneficiary,
      transferAmount,
      commissionBeneficiary,
      commissionAmount,
      currency,
      intendedPricePoint,
      0xBA43B7400);

    const account1Balance = new BigNumber(await TC5.balanceOf(constants.account1))
      , account3Balance = new BigNumber(await TC5.balanceOf(constants.account3))
      , account4Balance = new BigNumber(await TC5.balanceOf(constants.account4));

    assert.equal(initialAccount1Balance.toNumber(), account1Balance.toNumber());
    assert.equal(initialAccount3Balance.toNumber(), account3Balance.toNumber());
    assert.equal(initialAccount4Balance.toNumber(), account4Balance.toNumber());

  });

  it('should fail when beneficiary address is 0', async function() {
    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    const initialAccount1Balance = new BigNumber(await TC5.balanceOf(constants.account1))
      , initialAccount3Balance = new BigNumber(await TC5.balanceOf(constants.account3))
      , initialAccount4Balance = new BigNumber(await TC5.balanceOf(constants.account4));

    const beneficiary = 0
      , commissionAmount = new BigNumber(pricerOstUsd.toWei('5'))
      , commissionBeneficiary = constants.account4
      , currency = constants.currencyUSD
      , intendedPricePoint = await pricerOstUsd.getPricePoint(currency)
      , transferAmount = new BigNumber(pricerOstUsd.toWei('7'))
      ;

    const acceptedMargin = await pricerOstUsd.acceptedMargins(currency);
    const estimatedValues = await pricerOstUsd.getPricePointAndCalculatedAmounts(
      transferAmount,
      commissionAmount,
      currency);

    const estimatedTokenAmount = new BigNumber(estimatedValues.tokenAmount);
    const estimatedCommissionTokenAmount = new BigNumber(estimatedValues.commissionTokenAmount);
    const estimatedMargin = new BigNumber(acceptedMargin);

    const total = estimatedTokenAmount
      .plus(estimatedCommissionTokenAmount)
      .plus(estimatedMargin);

    await TC5.approve(
      constants.account1,
      constants.accountPassphrase1,
      constants.pricerOstUsdAddress,
      total,
      0xBA43B7400);

    var isError = false;
    try {
      await pricerOstUsd.pay(
        constants.account1,
        constants.accountPassphrase1,
        beneficiary,
        transferAmount,
        commissionBeneficiary,
        commissionAmount,
        currency,
        intendedPricePoint,
        0xBA43B7400);
    }
    catch (err) {
      isError = true;
      assert.instanceOf(err, Error);
    }
    assert.equal(isError, true);

    const account1Balance = new BigNumber(await TC5.balanceOf(constants.account1))
      , account3Balance = new BigNumber(await TC5.balanceOf(constants.account3))
      , account4Balance = new BigNumber(await TC5.balanceOf(constants.account4));

    assert.equal(initialAccount1Balance.toNumber(), account1Balance.toNumber());
    assert.equal(initialAccount3Balance.toNumber(), account3Balance.toNumber());
    assert.equal(initialAccount4Balance.toNumber(), account4Balance.toNumber());

  });

  it('should fail when currency is not available in pricer', async function() {
    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    const initialAccount1Balance = new BigNumber(await TC5.balanceOf(constants.account1))
      , initialAccount3Balance = new BigNumber(await TC5.balanceOf(constants.account3))
      , initialAccount4Balance = new BigNumber(await TC5.balanceOf(constants.account4));

    const beneficiary = constants.account3
      , commissionAmount = new BigNumber(pricerOstUsd.toWei('10'))
      , commissionBeneficiary = constants.account4
      , currency = constants.currencyUSD
      , intendedPricePoint = await pricerOstUsd.getPricePoint(currency)
      , transferAmount = new BigNumber(pricerOstUsd.toWei('5'))
      ;

    const acceptedMargin = await pricerOstUsd.acceptedMargins(currency);
    const estimatedValues = await pricerOstUsd.getPricePointAndCalculatedAmounts(
      transferAmount,
      commissionAmount,
      currency);

    const estimatedTokenAmount = new BigNumber(estimatedValues.tokenAmount);
    const estimatedCommissionTokenAmount = new BigNumber(estimatedValues.commissionTokenAmount);
    const estimatedMargin = new BigNumber(acceptedMargin);

    const total = estimatedTokenAmount
      .plus(estimatedCommissionTokenAmount)
      .plus(estimatedMargin);

    await TC5.approve(
      constants.account1,
      constants.accountPassphrase1,
      constants.pricerOstUsdAddress,
      total,
      0xBA43B7400);

    await pricerOstUsd.pay(
      constants.account1,
      constants.accountPassphrase1,
      beneficiary,
      transferAmount,
      commissionBeneficiary,
      commissionAmount,
      constants.currencyINR,
      intendedPricePoint,
      0xBA43B7400);

    const account1Balance = new BigNumber(await TC5.balanceOf(constants.account1))
      , account3Balance = new BigNumber(await TC5.balanceOf(constants.account3))
      , account4Balance = new BigNumber(await TC5.balanceOf(constants.account4));

    assert.equal(initialAccount1Balance.toNumber(), account1Balance.toNumber());
    assert.equal(initialAccount3Balance.toNumber(), account3Balance.toNumber());
    assert.equal(initialAccount4Balance.toNumber(), account4Balance.toNumber());

  });

  it('should fail when commision amount is not 0 and commision beneficiary address is 0', async function() {
    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    const initialAccount1Balance = new BigNumber(await TC5.balanceOf(constants.account1))
      , initialAccount3Balance = new BigNumber(await TC5.balanceOf(constants.account3))
      , initialAccount4Balance = new BigNumber(await TC5.balanceOf(constants.account4));

    const beneficiary = constants.account1
      , commissionAmount = new BigNumber(pricerOstUsd.toWei('10'))
      , commissionBeneficiary = 0
      , currency = constants.currencyUSD
      , intendedPricePoint = await pricerOstUsd.getPricePoint(currency)
      , transferAmount = new BigNumber(pricerOstUsd.toWei('5'))
      ;

    const acceptedMargin = await pricerOstUsd.acceptedMargins(currency);
    const estimatedValues = await pricerOstUsd.getPricePointAndCalculatedAmounts(
      transferAmount,
      commissionAmount,
      currency);

    const estimatedTokenAmount = new BigNumber(estimatedValues.tokenAmount);
    const estimatedCommissionTokenAmount = new BigNumber(estimatedValues.commissionTokenAmount);
    const estimatedMargin = new BigNumber(acceptedMargin);

    const total = estimatedTokenAmount
      .plus(estimatedCommissionTokenAmount)
      .plus(estimatedMargin);

    await TC5.approve(
      constants.account1,
      constants.accountPassphrase1,
      constants.pricerOstUsdAddress,
      total,
      0xBA43B7400);

    var isError = false;
    try {
      await pricerOstUsd.pay(
        constants.account1,
        constants.accountPassphrase1,
        beneficiary,
        transferAmount,
        commissionBeneficiary,
        commissionAmount,
        currency,
        intendedPricePoint,
        0xBA43B7400);
    }
    catch (err) {
      isError = true;
      assert.instanceOf(err, Error);
    }
    assert.equal(isError, true);

    const account1Balance = new BigNumber(await TC5.balanceOf(constants.account1))
      , account3Balance = new BigNumber(await TC5.balanceOf(constants.account3))
      , account4Balance = new BigNumber(await TC5.balanceOf(constants.account4));

    assert.equal(initialAccount1Balance.toNumber(), account1Balance.toNumber());
    assert.equal(initialAccount3Balance.toNumber(), account3Balance.toNumber());
    assert.equal(initialAccount4Balance.toNumber(), account4Balance.toNumber());
  });


  it('should fail when intendedPricePoint is more than the acceptable margin of current price point', async function() {
    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    const initialAccount1Balance = new BigNumber(await TC5.balanceOf(constants.account1))
      , initialAccount3Balance = new BigNumber(await TC5.balanceOf(constants.account3))
      , initialAccount4Balance = new BigNumber(await TC5.balanceOf(constants.account4));

    const beneficiary = constants.account3
      , commissionAmount = new BigNumber(pricerOstUsd.toWei('10'))
      , commissionBeneficiary = constants.account4
      , currency = constants.currencyUSD
      , intendedPricePoint = await pricerOstUsd.getPricePoint(currency)
      , transferAmount = new BigNumber(pricerOstUsd.toWei('5'))
      ;

    const acceptedMargin = await pricerOstUsd.acceptedMargins(currency);
    const estimatedValues = await pricerOstUsd.getPricePointAndCalculatedAmounts(
      transferAmount,
      commissionAmount,
      currency);

    const estimatedTokenAmount = new BigNumber(estimatedValues.tokenAmount);
    const estimatedCommissionTokenAmount = new BigNumber(estimatedValues.commissionTokenAmount);
    const estimatedMargin = new BigNumber(acceptedMargin);

    const total = estimatedTokenAmount.plus(estimatedCommissionTokenAmount).plus(estimatedMargin);

    await TC5.approve(
      constants.account1,
      constants.accountPassphrase1,
      constants.pricerOstUsdAddress,
      total,
      0xBA43B7400);

    const changedPricePoint = new BigNumber(intendedPricePoint)
      .plus(estimatedMargin)
      .plus(new BigNumber(1));

    await pricerOstUsd.pay(
      constants.account1,
      constants.accountPassphrase1,
      beneficiary,
      transferAmount,
      commissionBeneficiary,
      commissionAmount,
      currency,
      changedPricePoint,
      0xBA43B7400);

    const account1Balance = new BigNumber(await TC5.balanceOf(constants.account1))
      , account3Balance = new BigNumber(await TC5.balanceOf(constants.account3))
      , account4Balance = new BigNumber(await TC5.balanceOf(constants.account4));

    assert.equal(initialAccount1Balance.toNumber(), account1Balance.toNumber());
    assert.equal(initialAccount3Balance.toNumber(), account3Balance.toNumber());
    assert.equal(initialAccount4Balance.toNumber(), account4Balance.toNumber());

  });


  it('should fail when intendedPricePoint is less than the acceptable margin of current price point', async function() {
    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    const initialAccount1Balance = new BigNumber(await TC5.balanceOf(constants.account1))
      , initialAccount3Balance = new BigNumber(await TC5.balanceOf(constants.account3))
      , initialAccount4Balance = new BigNumber(await TC5.balanceOf(constants.account4));

    const beneficiary = constants.account3
      , commissionAmount = new BigNumber(pricerOstUsd.toWei('10'))
      , commissionBeneficiary = constants.account4
      , currency = constants.currencyUSD
      , intendedPricePoint = await pricerOstUsd.getPricePoint(currency)
      , transferAmount = new BigNumber(pricerOstUsd.toWei('5'))
      ;

    const acceptedMargin = await pricerOstUsd.acceptedMargins(currency);
    const estimatedValues = await pricerOstUsd.getPricePointAndCalculatedAmounts(
      transferAmount,
      commissionAmount,
      currency);

    const estimatedTokenAmount = new BigNumber(estimatedValues.tokenAmount);
    const estimatedCommissionTokenAmount = new BigNumber(estimatedValues.commissionTokenAmount);
    const estimatedMargin = new BigNumber(acceptedMargin);

    const total = estimatedTokenAmount
      .plus(estimatedCommissionTokenAmount)
      .plus(estimatedMargin);

    await TC5.approve(
      constants.account1,
      constants.accountPassphrase1,
      constants.pricerOstUsdAddress,
      total,
      0xBA43B7400);

    const changedPricePoint = new BigNumber(intendedPricePoint)
      .minus(estimatedMargin)
      .minus(new BigNumber(1));

    await pricerOstUsd.pay(
      constants.account1,
      constants.accountPassphrase1,
      beneficiary,
      transferAmount,
      commissionBeneficiary,
      commissionAmount,
      currency,
      changedPricePoint,
      0xBA43B7400);

    const account1Balance = new BigNumber(await TC5.balanceOf(constants.account1))
      , account3Balance = new BigNumber(await TC5.balanceOf(constants.account3))
      , account4Balance = new BigNumber(await TC5.balanceOf(constants.account4));

    assert.equal(initialAccount1Balance.toNumber(), account1Balance.toNumber());
    assert.equal(initialAccount3Balance.toNumber(), account3Balance.toNumber());
    assert.equal(initialAccount4Balance.toNumber(), account4Balance.toNumber());

  });


  it('should fail when price point is 0 and currency is not blank', async function() {
    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    const initialAccount1Balance = new BigNumber(await TC5.balanceOf(constants.account1))
      , initialAccount3Balance = new BigNumber(await TC5.balanceOf(constants.account3))
      , initialAccount4Balance = new BigNumber(await TC5.balanceOf(constants.account4));

    const beneficiary = constants.account3
      , commissionAmount = new BigNumber(pricerOstUsd.toWei('10'))
      , commissionBeneficiary = constants.account4
      , currency = constants.currencyUSD
      , intendedPricePoint = await pricerOstUsd.getPricePoint(currency)
      , transferAmount = new BigNumber(pricerOstUsd.toWei('5'))
      ;

    const acceptedMargin = await pricerOstUsd.acceptedMargins(currency);
    const estimatedValues = await pricerOstUsd.getPricePointAndCalculatedAmounts(
      transferAmount,
      commissionAmount,
      currency);

    const estimatedTokenAmount = new BigNumber(estimatedValues.tokenAmount);
    const estimatedCommissionTokenAmount = new BigNumber(estimatedValues.commissionTokenAmount);
    const estimatedMargin = new BigNumber(acceptedMargin);

    const total = estimatedTokenAmount
      .plus(estimatedCommissionTokenAmount)
      .plus(estimatedMargin);

    await TC5.approve(
      constants.account1,
      constants.accountPassphrase1,
      constants.pricerOstUsdAddress,
      total,
      0xBA43B7400);

    const result = await pricerOstUsd.pay(
      constants.account1,
      constants.accountPassphrase1,
      beneficiary,
      transferAmount,
      commissionBeneficiary,
      commissionAmount,
      constants.currencyINR,
      intendedPricePoint,
      0xBA43B7400);

    const account1Balance = new BigNumber(await TC5.balanceOf(constants.account1))
      , account3Balance = new BigNumber(await TC5.balanceOf(constants.account3))
      , account4Balance = new BigNumber(await TC5.balanceOf(constants.account4));

    assert.equal(initialAccount1Balance.toNumber(), account1Balance.toNumber());
    assert.equal(initialAccount3Balance.toNumber(), account3Balance.toNumber());
    assert.equal(initialAccount4Balance.toNumber(), account4Balance.toNumber());

  });

  it('should pass when all parameters are valid and commission beneficiary address, commissionAmount is 0', async function() {
    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    const initialAccount1Balance = new BigNumber(await TC5.balanceOf(constants.account1))
      , initialAccount3Balance = new BigNumber(await TC5.balanceOf(constants.account3))
      , initialAccount4Balance = new BigNumber(await TC5.balanceOf(constants.account4));

    const beneficiary = constants.account3
      , commissionAmount = new BigNumber(pricerOstUsd.toWei('0'))
      , commissionBeneficiary = constants.account4
      , currency = constants.currencyUSD
      , intendedPricePoint = await pricerOstUsd.getPricePoint(currency)
      , transferAmount = new BigNumber(pricerOstUsd.toWei('5'))
      ;

    const acceptedMargin = await pricerOstUsd.acceptedMargins(currency);
    const estimatedValues = await pricerOstUsd.getPricePointAndCalculatedAmounts(
      transferAmount,
      commissionAmount,
      currency);

    assert.equal(estimatedValues.commissionTokenAmount, 0);
    const estimatedTokenAmount = new BigNumber(estimatedValues.tokenAmount);
    const estimatedMargin = new BigNumber(acceptedMargin);

    const total = estimatedTokenAmount.plus(estimatedMargin);

    await TC5.approve(
      constants.account1,
      constants.accountPassphrase1,
      constants.pricerOstUsdAddress,
      total,
      0xBA43B7400);

    const result = await pricerOstUsd.pay(
      constants.account1,
      constants.accountPassphrase1,
      beneficiary,
      transferAmount,
      commissionBeneficiary,
      commissionAmount,
      currency,
      intendedPricePoint,
      0xBA43B7400);

    const account1Balance = new BigNumber(await TC5.balanceOf(constants.account1))
      , account3Balance = new BigNumber(await TC5.balanceOf(constants.account3))
      , account4Balance = new BigNumber(await TC5.balanceOf(constants.account4));

    assert.equal(initialAccount1Balance.minus(estimatedTokenAmount).toNumber(), account1Balance.toNumber());
    assert.equal(initialAccount3Balance.plus(estimatedTokenAmount).toNumber(), account3Balance.toNumber());
    assert.equal(initialAccount4Balance.toNumber(), account4Balance.toNumber());

  });

  it('should pass when all parameters are currency is blank', async function() {
    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    const initialAccount1Balance = new BigNumber(await TC5.balanceOf(constants.account1))
      , initialAccount3Balance = new BigNumber(await TC5.balanceOf(constants.account3))
      , initialAccount4Balance = new BigNumber(await TC5.balanceOf(constants.account4));

    const beneficiary = constants.account3
      , commissionAmount = new BigNumber(pricerOstUsd.toWei('5'))
      , commissionBeneficiary = constants.account4
      , currency = constants.currencyBlank
      , intendedPricePoint = new BigNumber(0)
      , transferAmount = new BigNumber(pricerOstUsd.toWei('10'))
      ;

    const total = transferAmount.plus(commissionAmount);

    await TC5.approve(
      constants.account1,
      constants.accountPassphrase1,
      constants.pricerOstUsdAddress,
      total,
      0xBA43B7400);

    await pricerOstUsd.pay(
      constants.account1,
      constants.accountPassphrase1,
      beneficiary,
      transferAmount,
      commissionBeneficiary,
      commissionAmount,
      currency,
      intendedPricePoint,
      0xBA43B7400);

    const account1Balance = new BigNumber(await TC5.balanceOf(constants.account1))
      , account3Balance = new BigNumber(await TC5.balanceOf(constants.account3))
      , account4Balance = new BigNumber(await TC5.balanceOf(constants.account4));

    assert.equal(initialAccount1Balance.minus(total).toNumber(), account1Balance.toNumber());
    assert.equal(initialAccount3Balance.plus(transferAmount).toNumber(), account3Balance.toNumber());
    assert.equal(initialAccount4Balance.plus(commissionAmount).toNumber(), account4Balance.toNumber());
  });

  it('should fail when intended price point is 0', async function() {
    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    const initialAccount1Balance = new BigNumber(await TC5.balanceOf(constants.account1))
      , initialAccount3Balance = new BigNumber(await TC5.balanceOf(constants.account3))
      , initialAccount4Balance = new BigNumber(await TC5.balanceOf(constants.account4));

    const beneficiary = constants.account3
      , commissionAmount = new BigNumber(pricerOstUsd.toWei('10'))
      , commissionBeneficiary = constants.account4
      , currency = constants.currencyUSD
      , intendedPricePoint = 0
      , transferAmount = new BigNumber(pricerOstUsd.toWei('5'))
      ;

    const acceptedMargin = await pricerOstUsd.acceptedMargins(currency);
    const estimatedValues = await pricerOstUsd.getPricePointAndCalculatedAmounts(
      transferAmount,
      commissionAmount,
      currency);

    const estimatedTokenAmount = new BigNumber(estimatedValues.tokenAmount);
    const estimatedCommissionTokenAmount = new BigNumber(estimatedValues.commissionTokenAmount);
    const estimatedMargin = new BigNumber(acceptedMargin);

    const total = estimatedTokenAmount.plus(estimatedCommissionTokenAmount).plus(estimatedMargin);

    await TC5.approve(
      constants.account1,
      constants.accountPassphrase1,
      constants.pricerOstUsdAddress,
      total,
      0xBA43B7400);

    await pricerOstUsd.pay(
      constants.account1,
      constants.accountPassphrase1,
      beneficiary,
      transferAmount,
      commissionBeneficiary,
      commissionAmount,
      constants.currencyUSD,
      intendedPricePoint,
      0xBA43B7400);

    const account1Balance = new BigNumber(await TC5.balanceOf(constants.account1))
      , account3Balance = new BigNumber(await TC5.balanceOf(constants.account3))
      , account4Balance = new BigNumber(await TC5.balanceOf(constants.account4));

    assert.equal(initialAccount1Balance.toNumber(), account1Balance.toNumber());
    assert.equal(initialAccount3Balance.toNumber(), account3Balance.toNumber());
    assert.equal(initialAccount4Balance.toNumber(), account4Balance.toNumber());

  });
});
