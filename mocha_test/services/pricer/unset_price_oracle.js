/* global describe, it */

const chai = require('chai')
  , assert = chai.assert;

const rootPrefix = "../../.."
  , constants = require(rootPrefix + '/mocha_test/services/pricer/constants')
  , pricerUtils = require('./pricer_utils')
  , pricer = require(rootPrefix + '/lib/contract_interact/pricer')
  , pricerOstUsd = new pricer(constants.pricerOstUsdAddress)
;


describe('Unset price oracle', function() {

  it('should pass the initial address checks', function() {
    assert.isDefined(constants.deployer);
    assert.isDefined(constants.ops);
    assert.isDefined(constants.account1);
    assert.notEqual(constants.deployer, constants.ops);
    assert.notEqual(constants.deployer, constants.account1);
    assert.notEqual(constants.ops, constants.account1);
  });

  it('should fail when sender is not ops', async function() {
    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    const response = await pricerOstUsd.setPriceOracle(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyUSD,
      constants.priceOracles.OST.USD,
      0xBA43B7400);

    assert.equal(response.isSuccess(), true);
    assert.exists(response.data.transactionHash);
    await pricerUtils.verifyReceipt(pricerOstUsd, response.data.transactionHash);

    const poResult1 = await pricerOstUsd.priceOracles(constants.currencyUSD);
    assert.equal(poResult1.isSuccess(), true);
    assert.equal(poResult1.data.priceOracles, constants.priceOracles.OST.USD);

    const response2 = await pricerOstUsd.unsetPriceOracle(
      constants.deployer,
      constants.deployerPassphrase,
      constants.currencyUSD,
      0xBA43B7400);

    assert.equal(response2.isSuccess(), true);
    assert.exists(response2.data.transactionHash);
    await pricerUtils.verifyReceipt(pricerOstUsd, response2.data.transactionHash);

    const poResult2 = await pricerOstUsd.priceOracles(constants.currencyUSD);
    assert.equal(poResult2.isSuccess(), true);
    assert.equal(poResult2.data.priceOracles, constants.priceOracles.OST.USD);

  });


  it('should fail when currency is blank', async function() {

    const response = await pricerOstUsd.unsetPriceOracle(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyBlank,
      0xBA43B7400);
    assert.equal(response.isFailure(), true);

  });


  it('should fail when gas amount is 0', async function() {

    const response = await pricerOstUsd.unsetPriceOracle(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyUSD,
      0);
    assert.equal(response.isFailure(), true);

  });

  it('should fail when sender address is 0', async function() {

    const response = await pricerOstUsd.unsetPriceOracle(
      0,
      constants.opsPassphrase,
      constants.currencyUSD,
      0xBA43B7400);
    assert.equal(response.isFailure(), true);

  });

  // it('should fail when price oracle was not set prior', async function() {
  //   this.timeout(100000);
  //   const result = await pricerOstUsd.unsetPriceOracle(
  //     constants.ops,
  //     constants.opsPassphrase,
  //     constants.currencyINR,
  //     0xBA43B7400);
  //   const poResult = await pricerOstUsd.priceOracles(constants.currencyINR);
  //   assert.equal(poResult, 0x0);
  // });


  it('should pass when price oracle was set prior', async function() {
    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    const setResponse = await pricerOstUsd.setPriceOracle(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyUSD,
      constants.priceOracles.OST.USD,
      0xBA43B7400);

    assert.equal(setResponse.isSuccess(), true);
    assert.exists(setResponse.data.transactionHash);
    await pricerUtils.verifyReceipt(pricerOstUsd, setResponse.data.transactionHash);

    const poResult1 = await pricerOstUsd.priceOracles(constants.currencyUSD);
    assert.equal(poResult1.isSuccess(), true);
    assert.equal(poResult1.data.priceOracles, constants.priceOracles.OST.USD);

    const unsetResponse = await pricerOstUsd.unsetPriceOracle(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyUSD,
      0xBA43B7400);

    assert.equal(unsetResponse.isSuccess(), true);
    assert.exists(unsetResponse.data.transactionHash);
    await pricerUtils.verifyReceipt(pricerOstUsd, unsetResponse.data.transactionHash);

    const poResult2 = await pricerOstUsd.priceOracles(constants.currencyUSD);
    assert.equal(poResult2.isSuccess(), true);
    assert.equal(poResult2.data.priceOracles, 0x0);

  });

});


