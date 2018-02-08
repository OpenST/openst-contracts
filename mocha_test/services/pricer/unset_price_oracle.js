/* global describe, it */

const chai = require('chai')
  , assert = chai.assert;

const rootPrefix = "../../.."
  , constants = require(rootPrefix + '/mocha_test/services/pricer/constants')
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

    await pricerOstUsd.setPriceOracle(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyUSD,
      constants.priceOracles.OST.USD,
      0xBA43B7400);

    const poResult1 = await pricerOstUsd.priceOracles(constants.currencyUSD);
    assert.equal(poResult1, constants.priceOracles.OST.USD);

    await pricerOstUsd.unsetPriceOracle(
      constants.deployer,
      constants.deployerPassphrase,
      constants.currencyUSD,
      0xBA43B7400);

    const poResult2 = await pricerOstUsd.priceOracles(constants.currencyUSD);
    assert.equal(poResult2, constants.priceOracles.OST.USD);

  });

  it('should fail when currency is blank', async function() {

    try {
      await pricerOstUsd.unsetPriceOracle(
        constants.ops,
        constants.opsPassphrase,
        constants.currencyBlank,
        0xBA43B7400);
    }
    catch (err) {
      assert.equal(err, 'Currency is mandatory');
    }

  });

  it('should fail when gas amount is 0', async function() {
    var error = false;
    try {
      await pricerOstUsd.unsetPriceOracle(
        constants.ops,
        constants.opsPassphrase,
        constants.currencyUSD,
        0);
    }
    catch (err) {
      error = true;
    }
    assert.isTrue(error);
  });

  it('should fail when sender address is 0', async function() {
    var error = false;
    try {
      await pricerOstUsd.unsetPriceOracle(
        0,
        constants.opsPassphrase,
        constants.currencyUSD,
        0xBA43B7400);
    }
    catch (err) {
      error = true;
    }
    assert.isTrue(error);
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

    await pricerOstUsd.setPriceOracle(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyUSD,
      constants.priceOracles.OST.USD,
      0xBA43B7400);

    const poResult1 = await pricerOstUsd.priceOracles(constants.currencyUSD);
    assert.equal(poResult1, constants.priceOracles.OST.USD);

    await pricerOstUsd.unsetPriceOracle(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyUSD,
      0xBA43B7400);

    const poResult2 = await pricerOstUsd.priceOracles(constants.currencyUSD);
    assert.equal(poResult2, 0x0);

  });

});

