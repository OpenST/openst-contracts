
/* global describe, it */

const chai = require('chai')
  , assert = chai.assert;

const rootPrefix = "../../.."
  , constants = require(rootPrefix + '/mocha_test/services/pricer/constants')
  , pricerUtils = require('./pricer_utils')
  , pricer = require(rootPrefix + '/lib/contract_interact/pricer')
  , pricerOstUsd = new pricer(constants.pricerOstUsdAddress)
;

describe('Get price point', function() {

  it('should pass the initial address checks', function() {

    assert.isDefined(constants.deployer);
    assert.isDefined(constants.ops);
    assert.isDefined(constants.account1);
    assert.notEqual(constants.deployer, constants.ops);
    assert.notEqual(constants.deployer, constants.account1);
    assert.notEqual(constants.ops, constants.account1);

  });

  it('should get failure when currency is blank', async function() {
    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);
    const pricePoint = await pricerOstUsd.getPricePoint(constants.currencyINR);
    assert.equal(pricePoint.isFailure(), true);

  });


  it('should get failure when currency is does not exists in system', async function() {
    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);
    const pricePoint = await pricerOstUsd.getPricePoint("ABC");
    assert.equal(pricePoint.isFailure(), true);

  });


  it('should get correct price oracle address after set', async function() {
    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    // set price point 1
    const response = await pricerOstUsd.setPriceOracle(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyEUR,
      constants.priceOracles.OST.EUR,
      0xBA43B7400);

    assert.equal(response.isSuccess(), true);
    assert.exists(response.data.transactionHash);
    await pricerUtils.verifyReceipt(pricerOstUsd, response.data.transactionHash);

    const poResult = await pricerOstUsd.priceOracles(constants.currencyEUR);
    assert.equal(poResult.isSuccess(), true);
    assert.equal(poResult.data.priceOracles, constants.priceOracles.OST.EUR);


    // set price point 2
    const response2 = await pricerOstUsd.setPriceOracle(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyUSD,
      constants.priceOracles.OST.USD,
      0xBA43B7400);

    assert.equal(response2.isSuccess(), true);
    assert.exists(response2.data.transactionHash);
    await pricerUtils.verifyReceipt(pricerOstUsd, response2.data.transactionHash);

    const poResult2 = await pricerOstUsd.priceOracles(constants.currencyUSD);
    assert.equal(poResult2.isSuccess(), true);
    assert.equal(poResult2.data.priceOracles, constants.priceOracles.OST.USD);

    const pricePoint1 = await pricerOstUsd.getPricePoint(constants.currencyUSD);
    assert.equal(pricePoint1.isSuccess(), true);
    assert.equal(pricePoint1.data.pricePoint, pricerOstUsd.toWei('0.5'));

    const pricePoint2 = await pricerOstUsd.getPricePoint(constants.currencyEUR);
    assert.equal(pricePoint2.isSuccess(), true);
    assert.equal(pricePoint2.data.pricePoint, pricerOstUsd.toWei('0.2'));

  });


  it('should get correct price oracle address after unset', async function() {
    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    const response = await pricerOstUsd.unsetPriceOracle(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyUSD,
      0xBA43B7400);

    assert.equal(response.isSuccess(), true);
    assert.exists(response.data.transactionHash);
    await pricerUtils.verifyReceipt(pricerOstUsd, response.data.transactionHash);

    const poResult = await pricerOstUsd.priceOracles(constants.currencyUSD);
    assert.equal(poResult.isSuccess(), true);
    assert.equal(poResult.data.priceOracles, 0x0);

    const pricePoint1 = await pricerOstUsd.getPricePoint(constants.currencyUSD);
    assert.equal(pricePoint1.isFailure(), true);

    // price point for OST/EUR will remain the same
    const pricePoint2 = await pricerOstUsd.getPricePoint(constants.currencyEUR);
    assert.equal(pricePoint2.isSuccess(), true);
    assert.equal(pricePoint2.data.pricePoint, pricerOstUsd.toWei('0.2'));

  });

});

