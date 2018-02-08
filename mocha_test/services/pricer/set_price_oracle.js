
/* global describe, it */

const chai = require('chai')
  , assert = chai.assert;

const rootPrefix = "../../.."
  , constants = require(rootPrefix + '/mocha_test/services/pricer/constants')
  , pricer = require(rootPrefix + '/lib/contract_interact/pricer')
  , pricerOstUsd = new pricer(constants.pricerOstUsdAddress)
  , pricerOstEur = new pricer(constants.pricerOstEurAddress)
  , pricerOstUsd10Decimal = new pricer(constants.pricerOstUsd10DecimalAddress)
;

describe('Set price oracle', function() {

  it('should pass the initial address checks', async function() {
    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);
    assert.isDefined(constants.deployer);
    assert.isDefined(constants.ops);
    assert.isDefined(constants.account1);
    assert.notEqual(constants.deployer, constants.ops);
    assert.notEqual(constants.deployer, constants.account1);
    assert.notEqual(constants.ops, constants.account1);

    await pricerOstUsd.unsetPriceOracle(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyUSD,
      0xBA43B7400);

    const poResult1 = await pricerOstUsd.priceOracles(constants.currencyUSD);
    assert.equal(poResult1, 0x0);

    await pricerOstEur.unsetPriceOracle(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyEUR,
      0xBA43B7400);

    const poResult2 = await pricerOstEur.priceOracles(constants.currencyEUR);
    assert.equal(poResult2, 0x0);

  });

  it('should fail when sender is not ops', async function() {
    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    await pricerOstUsd.unsetPriceOracle(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyUSD,
      0xBA43B7400);

    const poResult1 = await pricerOstUsd.priceOracles(constants.currencyUSD);
    assert.equal(poResult1, 0x0);

    await pricerOstUsd.setPriceOracle(
      constants.deployer,
      constants.deployerPassphrase,
      constants.currencyUSD,
      constants.priceOracles.OST.USD,
      0xBA43B7400);

    const poResult2 = await pricerOstUsd.priceOracles(constants.currencyUSD);
    assert.equal(poResult2, 0x0);

  });

  it('should fail when currency is blank', async function() {
    try {
      await pricerOstUsd.setPriceOracle(
        constants.ops,
        constants.opsPassphrase,
        constants.currencyBlank,
        constants.priceOracles.OST.USD,
        0xBA43B7400);
    }
    catch (err) {
      assert.equal(err, 'Currency is mandatory');
    }
  });


  it('should fail when oracleAddress is 0', async function() {
    var error = false;
    try {
      await pricerOstUsd.setPriceOracle(
        constants.ops,
        constants.opsPassphrase,
        constants.currencyUSD,
        0,
        0xBA43B7400);
    }
    catch (err) {
      error = true;
    }
    assert.isTrue(error);
  });

  it('should fail when gas amount is 0', async function() {
    var error = false;
    try {
      await pricerOstUsd.setPriceOracle(
        constants.ops,
        constants.opsPassphrase,
        constants.currencyUSD,
        constants.priceOracles.OST.USD,
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
      await pricerOstUsd.setPriceOracle(
        0,
        constants.opsPassphrase,
        constants.currencyUSD,
        constants.priceOracles.OST.USD,
        0xBA43B7400);
    }
    catch (err) {
      error = true;
    }
    assert.isTrue(error);
  });

  it('should fail when price oracle has different quote currency', async function() {
    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    await pricerOstUsd.setPriceOracle(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyUSD,
      constants.priceOracles.ETH.USD,
      0xBA43B7400);
    const poResult = await pricerOstUsd.priceOracles(constants.currencyUSD);
    assert.notEqual(poResult, constants.priceOracles.ETH.USD);

  });


  it('should fail when price oracle has different decimal', async function() {
    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    await pricerOstUsd10Decimal.setPriceOracle(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyUSD,
      constants.priceOracles.OST.USD,
      0xBA43B7400);

    const poResult = await pricerOstUsd.priceOracles(constants.currencyUSD);
    assert.equal(poResult, 0);

  });

  it('should pass when OST/USD price oracle is set', async function() {
    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    await pricerOstUsd.setPriceOracle(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyUSD,
      constants.priceOracles.OST.USD,
      0xBA43B7400);

    const poResult = await pricerOstUsd.priceOracles(constants.currencyUSD);
    assert.equal(constants.priceOracles.OST.USD, poResult);

  });

  it('should pass when OST/EUR price oracle is set', async function() {
    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    await pricerOstUsd.setPriceOracle(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyEUR,
      constants.priceOracles.OST.EUR,
      0xBA43B7400);
    const poResult = await pricerOstUsd.priceOracles(constants.currencyEUR);
    assert.equal(constants.priceOracles.OST.EUR, poResult);

  });
});

