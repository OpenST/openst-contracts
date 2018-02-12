
/* global describe, it */

const chai = require('chai')
  , assert = chai.assert;

const rootPrefix = "../../.."
  , constants = require(rootPrefix + '/mocha_test/services/pricer/constants')
  , pricerUtils = require('./pricer_utils')
  , pricer = require(rootPrefix + '/lib/contract_interact/pricer')
  , pricerOstUsd = new pricer(constants.pricerOstUsdAddress)
  , pricerOstEur = new pricer(constants.pricerOstEurAddress)
  , pricerOstUsd10Decimal = new pricer(constants.pricerOstUsd10DecimalAddress)
;

describe('Get price oracles', function() {

  it('should fail when currency is blank', async function() {
    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    const poResult = await pricerOstUsd.priceOracles(constants.currencyBlank);
    assert.equal(poResult.isFailure(), true);

  });

  it('should return 0x0 when currency is not set', async function() {
    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    const poResult = await pricerOstUsd.priceOracles("ABC");
    assert.equal(poResult.isSuccess(), true);
    assert.equal(poResult.data.priceOracles, 0x0);

  });

  it('should return correct price oracles (after set)', async function() {
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


    const setResponse1 = await pricerOstUsd.setPriceOracle(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyEUR,
      constants.priceOracles.OST.EUR,
      0xBA43B7400);

    assert.equal(setResponse1.isSuccess(), true);
    assert.exists(setResponse1.data.transactionHash);
    await pricerUtils.verifyReceipt(pricerOstUsd, setResponse1.data.transactionHash);

    const poResult1 = await pricerOstUsd.priceOracles(constants.currencyUSD);
    assert.equal(poResult1.isSuccess(), true);
    assert.equal(poResult1.data.priceOracles, constants.priceOracles.OST.USD);

    const poResult2 = await pricerOstUsd.priceOracles(constants.currencyEUR);
    assert.equal(poResult2.isSuccess(), true);
    assert.equal(poResult2.data.priceOracles, constants.priceOracles.OST.EUR);

  });

  it('should return 0x0 (after unset)', async function() {
    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    const unsetResponse = await pricerOstUsd.unsetPriceOracle(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyUSD,
      0xBA43B7400);

    assert.equal(unsetResponse.isSuccess(), true);
    assert.exists(unsetResponse.data.transactionHash);
    await pricerUtils.verifyReceipt(pricerOstUsd, unsetResponse.data.transactionHash);


    const unsetResponse1 = await pricerOstUsd.unsetPriceOracle(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyEUR,
      0xBA43B7400);

    assert.equal(unsetResponse1.isSuccess(), true);
    assert.exists(unsetResponse1.data.transactionHash);
    await pricerUtils.verifyReceipt(pricerOstUsd, unsetResponse1.data.transactionHash);

    const poResult1 = await pricerOstUsd.priceOracles(constants.currencyUSD);
    assert.equal(poResult1.isSuccess(), true);
    assert.equal(poResult1.data.priceOracles, 0x0);

    const poResult2 = await pricerOstUsd.priceOracles(constants.currencyEUR);
    assert.equal(poResult2.isSuccess(), true);
    assert.equal(poResult2.data.priceOracles, 0x0);

  });

});

