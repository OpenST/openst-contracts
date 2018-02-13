
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

    // unset the price oracle
    const response = await pricerOstUsd.unsetPriceOracle(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyUSD,
      0xBA43B7400,
      constants.chainId,
      {returnType: constants.returnTypeReceipt});

    // verify if the transaction receipt is valid
    pricerUtils.verifyTransactionReceipt(response);

    // verify if the transaction has was actually mined
    await pricerUtils.verifyIfMined(pricerOstUsd, response.data.transaction_hash);

    // verify if value is changed
    const poResult1 = await pricerOstUsd.priceOracles(constants.currencyUSD);
    assert.equal(poResult1.isSuccess(), true);
    assert.equal(0x0, poResult1.data.priceOracles);

    // unset the price oracle
    const response2 = await pricerOstEur.unsetPriceOracle(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyEUR,
      0xBA43B7400,
      constants.chainId,
      {returnType: constants.returnTypeReceipt});

    // verify if the transaction receipt is valid
    pricerUtils.verifyTransactionReceipt(response2);

    // verify if the transaction has was actually mined
    await pricerUtils.verifyIfMined(pricerOstUsd, response2.data.transaction_hash);

    // verify if value is changed
    const poResult2 = await pricerOstEur.priceOracles(constants.currencyEUR);
    assert.equal(poResult2.isSuccess(), true);
    assert.equal(0x0, poResult2.data.priceOracles);

  });

/*
  it('should fail when sender is not ops', async function() {
    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    const setResponse = await pricerOstUsd.setPriceOracle(
      constants.deployer,
      constants.deployerPassphrase,
      constants.currencyUSD,
      constants.priceOracles.OST.USD,
      0xBA43B7400);

    assert.equal(setResponse.isSuccess(), true);
    assert.exists(setResponse.data.transactionHash);
    await pricerUtils.verifyReceipt(pricerOstUsd, setResponse.data.transactionHash);

    const poResult2 = await pricerOstUsd.priceOracles(constants.currencyUSD);
    assert.equal(poResult2.isSuccess(), true);
    assert.equal(0x0, poResult2.data.priceOracles);

  });


  it('should fail when currency is blank', async function() {

    const response = await pricerOstUsd.setPriceOracle(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyBlank,
      constants.priceOracles.OST.USD,
      0xBA43B7400);
    assert.equal(response.isFailure(), true);

  });


  it('should fail when oracleAddress is 0', async function() {

    const response = await pricerOstUsd.setPriceOracle(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyUSD,
      0,
      0xBA43B7400);
    assert.equal(response.isFailure(), true);

  });


  it('should fail when gas amount is 0', async function() {

    const response = await pricerOstUsd.setPriceOracle(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyUSD,
      constants.priceOracles.OST.USD,
      0);
    assert.equal(response.isFailure(), true);

  });


  it('should fail when sender address is 0', async function() {

    const response = await pricerOstUsd.setPriceOracle(
      0,
      constants.opsPassphrase,
      constants.currencyUSD,
      constants.priceOracles.OST.USD,
      0xBA43B7400);
    assert.equal(response.isFailure(), true);

  });


  it('should fail when price oracle has different quote currency', async function() {
    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    const response = await pricerOstUsd.setPriceOracle(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyUSD,
      constants.priceOracles.ETH.USD,
      0xBA43B7400);

    assert.equal(response.isSuccess(), true);
    assert.exists(response.data.transactionHash);
    await pricerUtils.verifyReceipt(pricerOstUsd, response.data.transactionHash);

    const poResult = await pricerOstUsd.priceOracles(constants.currencyUSD);
    assert.equal(poResult.isSuccess(), true);
    assert.notEqual(poResult.data.priceOracles, constants.priceOracles.ETH.USD);

  });


  it('should fail when price oracle has different decimal', async function() {
    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    const response = await pricerOstUsd10Decimal.setPriceOracle(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyUSD,
      constants.priceOracles.OST.USD,
      0xBA43B7400);

    assert.equal(response.isSuccess(), true);
    assert.exists(response.data.transactionHash);
    await pricerUtils.verifyReceipt(pricerOstUsd10Decimal, response.data.transactionHash);

    const poResult = await pricerOstUsd.priceOracles(constants.currencyUSD);
    assert.equal(poResult.isSuccess(), true);
    assert.equal(poResult.data.priceOracles, 0x0);

  });


  it('should pass when OST/USD price oracle is set', async function() {
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

    const poResult = await pricerOstUsd.priceOracles(constants.currencyUSD);
    assert.equal(poResult.isSuccess(), true);
    assert.equal(poResult.data.priceOracles, constants.priceOracles.OST.USD);

  });


  it('should pass when OST/EUR price oracle is set', async function() {
    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

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

  });
*/
});

