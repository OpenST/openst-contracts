
/* global describe, it */

const chai = require('chai')
  , assert = chai.assert;

const rootPrefix = "../../.."
  , constants = require(rootPrefix + '/mocha_test/services/pricer/constants')
  , pricerUtils = require('./pricer_utils')
  , pricer = require(rootPrefix + '/lib/contract_interact/pricer')
  , pricerOstUsd = new pricer(constants.pricerOstUsdAddress, constants.chainId)
  , pricerOstEur = new pricer(constants.pricerOstEurAddress, constants.chainId)
  , pricerOstUsd10Decimal = new pricer(constants.pricerOstUsd10DecimalAddress, constants.chainId)
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

    // set price oracle
    const setResponse = await pricerOstUsd.setPriceOracle(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyUSD,
      constants.priceOracles.OST.USD,
      0xBA43B7400,
      constants.optionsReceipt);

    // verify if the transaction receipt is valid
    pricerUtils.verifyTransactionReceipt(setResponse);

    // verify if the transaction has was actually mined
    await pricerUtils.verifyIfMined(pricerOstUsd, setResponse.data.transaction_hash);

    // set price oracle
    const setResponse1 = await pricerOstUsd.setPriceOracle(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyEUR,
      constants.priceOracles.OST.EUR,
      0xBA43B7400,
      constants.optionsReceipt);

    // verify if the transaction receipt is valid
    pricerUtils.verifyTransactionReceipt(setResponse);

    // verify if the transaction has was actually mined
    await pricerUtils.verifyIfMined(pricerOstUsd, setResponse.data.transaction_hash);

    // verify result
    const poResult1 = await pricerOstUsd.priceOracles(constants.currencyUSD);
    assert.equal(poResult1.isSuccess(), true);
    assert.equal(poResult1.data.priceOracles, constants.priceOracles.OST.USD);

    // verify result
    const poResult2 = await pricerOstUsd.priceOracles(constants.currencyEUR);
    assert.equal(poResult2.isSuccess(), true);
    assert.equal(poResult2.data.priceOracles, constants.priceOracles.OST.EUR);

  });

  it('should return 0x0 (after unset)', async function() {
    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    // unset price oracle
    const unsetResponse = await pricerOstUsd.unsetPriceOracle(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyUSD,
      0xBA43B7400,
      constants.optionsReceipt);

    // verify if the transaction receipt is valid
    pricerUtils.verifyTransactionReceipt(unsetResponse);

    // verify if the transaction has was actually mined
    await pricerUtils.verifyIfMined(pricerOstUsd, unsetResponse.data.transaction_hash);

    // unset price oracle
    const unsetResponse1 = await pricerOstUsd.unsetPriceOracle(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyEUR,
      0xBA43B7400,
      constants.optionsReceipt);

    // verify if the transaction receipt is valid
    pricerUtils.verifyTransactionReceipt(unsetResponse1);

    // verify if the transaction has was actually mined
    await pricerUtils.verifyIfMined(pricerOstUsd, unsetResponse1.data.transaction_hash);

    // verify result
    const poResult1 = await pricerOstUsd.priceOracles(constants.currencyUSD);
    assert.equal(poResult1.isSuccess(), true);
    assert.equal(poResult1.data.priceOracles, 0x0);

    // verify result
    const poResult2 = await pricerOstUsd.priceOracles(constants.currencyEUR);
    assert.equal(poResult2.isSuccess(), true);
    assert.equal(poResult2.data.priceOracles, 0x0);

  });

});

