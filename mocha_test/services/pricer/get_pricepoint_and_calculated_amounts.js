
/* global describe, it */

const chai = require('chai')
  , assert = chai.assert;

const rootPrefix = "../../.."
  , constants = require(rootPrefix + '/mocha_test/services/pricer/constants')
  , pricer = require(rootPrefix + '/lib/contract_interact/pricer')
  , pricerOstUsd = new pricer(constants.pricerOstUsdAddress)
  , pricerOstEur = new pricer(constants.pricerOstEurAddress)
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

    await pricerOstUsd.setPriceOracle(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyUSD,
      constants.priceOracles.OST.USD,
      0xBA43B7400);
    const poResult1 = await pricerOstUsd.priceOracles(constants.currencyUSD);
    assert.equal(constants.priceOracles.OST.USD, poResult1);

    await pricerOstEur.setPriceOracle(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyEUR,
      constants.priceOracles.OST.EUR,
      0xBA43B7400);
    const poResult2 = await pricerOstEur.priceOracles(constants.currencyEUR);
    assert.equal(constants.priceOracles.OST.EUR, poResult2);

  });

  it('should fail when currency is 0', async function() {
    try {
      await pricerOstUsd.getPricePointAndCalculatedAmounts(
        pricerOstUsd.toWei('1'),
        pricerOstUsd.toWei('0.5'),
        constants.currencyBlank);
    }
    catch (err) {
      assert.equal(err, 'Currency is mandatory');
    }
  });

  it('should fail when price point is 0', async function() {
    try {
      await pricerOstUsd.getPricePointAndCalculatedAmounts(
        pricerOstUsd.toWei('1'),
        pricerOstUsd.toWei('0.5'),
        constants.currencyINR);
    }
    catch (err) {
      assert.instanceOf(err, Error);
    }
  });

  it('should pass when all parameters are valid and conversion rate is 5', async function() {
    const pricePoint = await pricerOstUsd.getPricePoint(constants.currencyUSD)
      , decimal = await pricerOstUsd.decimals()
      , conversionRate = await pricerOstUsd.conversionRate()
      , amount = pricerOstUsd.toWei('1')
      , commissionAmount = pricerOstUsd.toWei('0.5')
      , calculatedAmount = (amount*conversionRate*(10**decimal))/pricePoint
      , calculatedCommisionAmount = (commissionAmount*conversionRate*(10**decimal))/pricePoint;

    const result = await pricerOstUsd.getPricePointAndCalculatedAmounts(
      amount,
      commissionAmount,
      constants.currencyUSD);

    assert.equal(result.pricePoint, pricePoint);
    assert.equal(result.tokenAmount, calculatedAmount);
    assert.equal(result.commissionTokenAmount, calculatedCommisionAmount);

  });

  it('should pass when all parameters are valid and conversion rate is 2', async function() {
    const pricePoint = await pricerOstEur.getPricePoint(constants.currencyEUR)
      , decimal = await pricerOstEur.decimals()
      , conversionRate = await pricerOstEur.conversionRate()
      , amount = pricerOstEur.toWei('1')
      , commissionAmount = pricerOstEur.toWei('0.5')
      , calculatedAmount = (amount*conversionRate*(10**decimal))/pricePoint
      , calculatedCommisionAmount = (commissionAmount*conversionRate*(10**decimal))/pricePoint;

    const result = await pricerOstEur.getPricePointAndCalculatedAmounts(
      amount,
      commissionAmount,
      constants.currencyEUR);

    assert.equal(result.pricePoint, pricePoint);
    assert.equal(result.tokenAmount, calculatedAmount);
    assert.equal(result.commissionTokenAmount, calculatedCommisionAmount);
  });

});

