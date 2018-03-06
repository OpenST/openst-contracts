
/* global describe, it */

const chai = require('chai')
  , assert = chai.assert;

const rootPrefix = "../../.."
  , constants = require(rootPrefix + '/mocha_test/lib/constants')
  , utils = require(rootPrefix+'/mocha_test/lib/utils')
  , pricer = require(rootPrefix + '/lib/contract_interact/pricer')
  , pricerOstUsd = new pricer(constants.pricerOstUsdAddress, constants.chainId)
  , pricerOstEur = new pricer(constants.pricerOstEurAddress, constants.chainId)
;


describe('Get price point and calculated amounts', function() {

  it('should pass the initial address checks', async function() {
    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    assert.isDefined(constants.deployer);
    assert.isDefined(constants.ops);
    assert.isDefined(constants.account1);
    assert.notEqual(constants.deployer, constants.ops);
    assert.notEqual(constants.deployer, constants.account1);
    assert.notEqual(constants.ops, constants.account1);

    // set price oracle
    const response1 = await pricerOstUsd.setPriceOracle(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyUSD,
      constants.priceOracles.OST.USD,
      constants.gasUsed,
      constants.optionsReceipt);

    // verify if the transaction receipt is valid
    utils.verifyTransactionReceipt(response1);

    // verify if the transaction has was actually mined
    await utils.verifyIfMined(pricerOstUsd, response1.data.transaction_hash);

    // verify if its set
    const poResult1 = await pricerOstUsd.priceOracles(constants.currencyUSD);
    assert.equal(poResult1.isSuccess(), true);
    assert.equal(constants.priceOracles.OST.USD, poResult1.data.priceOracles);

    // set price oracle
    const response2 = await pricerOstEur.setPriceOracle(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyEUR,
      constants.priceOracles.OST.EUR,
      constants.gasUsed,
      constants.optionsReceipt);

    // verify if the transaction receipt is valid
    utils.verifyTransactionReceipt(response2);

    // verify if the transaction has was actually mined
    await utils.verifyIfMined(pricerOstEur, response1.data.transaction_hash);

    // verify if its set
    const poResult2 = await pricerOstEur.priceOracles(constants.currencyEUR);
    assert.equal(poResult2.isSuccess(), true);
    assert.equal(constants.priceOracles.OST.EUR, poResult2.data.priceOracles);

  });


  it('should fail when currency is 0', async function() {

    const response = await pricerOstUsd.getPricePointAndCalculatedAmounts(
      pricerOstUsd.toWei('1'),
      pricerOstUsd.toWei('0.5'),
      constants.currencyBlank);
    assert.equal(response.isFailure(), true);

  });

  it('should fail when price point is 0', async function() {

    const response = await pricerOstUsd.getPricePointAndCalculatedAmounts(
        pricerOstUsd.toWei('1'),
        pricerOstUsd.toWei('0.5'),
        constants.currencyINR);
      assert.equal(response.isFailure(), true);

  });


  it('should pass when all parameters are valid and conversion rate is 5', async function() {

    const pricePointData = await pricerOstUsd.getPricePoint(constants.currencyUSD);
    assert.equal(pricePointData.isSuccess(), true);
    const pricePoint = pricePointData.data.pricePoint;

    const decimalData = await pricerOstUsd.decimals();
    assert.equal(decimalData.isSuccess(), true);
    const decimal = decimalData.data.decimals;

    const conversionRateData = await pricerOstUsd.conversionRate();
    assert.equal(conversionRateData.isSuccess(), true);

    const conversionRateDecimalsData = await pricerOstUsd.conversionRateDecimals();
    assert.equal(conversionRateDecimalsData.isSuccess(), true);

    const conversionRate = conversionRateData.data.conversionRate;
    const conversionRateDecimals = conversionRateDecimalsData.data.conversionRateDecimals;

    const conversionFactor = conversionRate/(10**conversionRateDecimals);

    const amount = pricerOstUsd.toWei('1')
      , commissionAmount = pricerOstUsd.toWei('0.5')
      , calculatedAmount = (amount*conversionFactor*(10**decimal))/pricePoint
      , calculatedCommisionAmount = (commissionAmount*conversionFactor*(10**decimal))/pricePoint;

    const result = await pricerOstUsd.getPricePointAndCalculatedAmounts(
      amount,
      commissionAmount,
      constants.currencyUSD);
    assert.equal(result.isSuccess(), true);

    assert.equal(result.data.pricePoint, pricePoint);
    assert.equal(result.data.tokenAmount, calculatedAmount);
    assert.equal(result.data.commissionTokenAmount, calculatedCommisionAmount);

  });


  it('should pass when all parameters are valid and conversion rate is 2', async function() {

    const pricePointData = await pricerOstEur.getPricePoint(constants.currencyEUR);
    assert.equal(pricePointData.isSuccess(), true);
    const pricePoint = pricePointData.data.pricePoint;

    const decimalData = await pricerOstEur.decimals();
    assert.equal(decimalData.isSuccess(), true);
    const decimal = decimalData.data.decimals;

    const conversionRateData = await pricerOstEur.conversionRate();
    assert.equal(conversionRateData.isSuccess(), true);

    const conversionRateDecimalsData = await pricerOstEur.conversionRateDecimals();
    assert.equal(conversionRateDecimalsData.isSuccess(), true);

    const conversionRate = conversionRateData.data.conversionRate;
    const conversionRateDecimals = conversionRateDecimalsData.data.conversionRateDecimals;

    const conversionFactor = conversionRate/(10**conversionRateDecimals);

    const amount = pricerOstEur.toWei('1')
      , commissionAmount = pricerOstEur.toWei('0.5')
      , calculatedAmount = (amount*conversionFactor*(10**decimal))/pricePoint
      , calculatedCommisionAmount = (commissionAmount*conversionFactor*(10**decimal))/pricePoint;

    const result = await pricerOstEur.getPricePointAndCalculatedAmounts(
      amount,
      commissionAmount,
      constants.currencyEUR);
    assert.equal(result.isSuccess(), true);

    assert.equal(result.data.pricePoint, pricePoint);
    assert.equal(result.data.tokenAmount, calculatedAmount);
    assert.equal(result.data.commissionTokenAmount, calculatedCommisionAmount);

  });

});
