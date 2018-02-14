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

    // set the price oracle
    const response = await pricerOstUsd.setPriceOracle(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyUSD,
      constants.priceOracles.OST.USD,
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
    assert.equal(poResult1.data.priceOracles, constants.priceOracles.OST.USD);

    // unset the price oracle
    const response2 = await pricerOstUsd.unsetPriceOracle(
      constants.deployer,
      constants.deployerPassphrase,
      constants.currencyUSD,
      0xBA43B7400,
      constants.chainId,
      {returnType: constants.returnTypeReceipt});

    // verify if the transaction receipt is valid
    pricerUtils.verifyTransactionReceipt(response2);

    // verify if the transaction has was actually mined
    await pricerUtils.verifyIfMined(pricerOstUsd, response2.data.transaction_hash);

    // verify if value is changed
    const poResult2 = await pricerOstUsd.priceOracles(constants.currencyUSD);
    assert.equal(poResult2.isSuccess(), true);
    assert.equal(poResult2.data.priceOracles, constants.priceOracles.OST.USD);

  });


  it('should fail when currency is blank', async function() {

    // unset the price oracle
    const response = await pricerOstUsd.unsetPriceOracle(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyBlank,
      0xBA43B7400,
      constants.chainId,
      {returnType: constants.returnTypeReceipt});

    // verify if it failed
    assert.equal(response.isFailure(), true);

  });


  it('should fail when gas amount is 0', async function() {

    // unset the price oracle
    const response = await pricerOstUsd.unsetPriceOracle(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyUSD,
      0,
      constants.chainId,
      {returnType: constants.returnTypeReceipt});

    // verify if it failed
    assert.equal(response.isFailure(), true);

  });

  it('should fail when sender address is 0', async function() {

    // unset the price oracle
    const response = await pricerOstUsd.unsetPriceOracle(
      0,
      constants.opsPassphrase,
      constants.currencyUSD,
      0xBA43B7400,
      constants.chainId,
      {returnType: constants.returnTypeReceipt});

    // verify if it failed
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

    // set the price oracle
    const setResponse = await pricerOstUsd.setPriceOracle(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyUSD,
      constants.priceOracles.OST.USD,
      0xBA43B7400,
      constants.chainId,
      {returnType: constants.returnTypeReceipt});

    // verify if the transaction receipt is valid
    pricerUtils.verifyTransactionReceipt(setResponse);

    // verify if the transaction has was actually mined
    await pricerUtils.verifyIfMined(pricerOstUsd, setResponse.data.transaction_hash);

    // verify if value is changed
    const poResult1 = await pricerOstUsd.priceOracles(constants.currencyUSD);
    assert.equal(poResult1.isSuccess(), true);
    assert.equal(poResult1.data.priceOracles, constants.priceOracles.OST.USD);

    // unset the price oracle
    const unsetResponse = await pricerOstUsd.unsetPriceOracle(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyUSD,
      0xBA43B7400,
      constants.chainId,
      {returnType: constants.returnTypeReceipt});

    // verify if the transaction receipt is valid
    pricerUtils.verifyTransactionReceipt(unsetResponse);

    // verify if the transaction has was actually mined
    await pricerUtils.verifyIfMined(pricerOstUsd, unsetResponse.data.transaction_hash);

    // verify if value is changed
    const poResult2 = await pricerOstUsd.priceOracles(constants.currencyUSD);
    assert.equal(poResult2.isSuccess(), true);
    assert.equal(poResult2.data.priceOracles, 0x0);

  });


  it('should pass for interaction layer test when return type is uuid', async function() {

    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    // unset the price oracle
    const unsetResponse = await pricerOstUsd.unsetPriceOracle(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyUSD,
      0xBA43B7400,
      constants.chainId,
      {returnType: constants.returnTypeUUID});

    // verify if the transaction receipt is valid
    // we will not verify if it got mined as its just interaction layer testing
    pricerUtils.verifyTransactionUUID(unsetResponse);

  });

  it('should pass for interaction layer test when return type is txHash', async function() {

    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    // unset the price oracle
    const unsetResponse = await pricerOstUsd.unsetPriceOracle(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyUSD,
      0xBA43B7400,
      constants.chainId,
      {returnType: constants.returnTypeHash});

    // verify if the transaction hash is valid
    // we will not verify if it got mined as its just interaction layer testing
    pricerUtils.verifyTransactionHash(unsetResponse);

  });

  it('should pass for interaction layer test when return type is txReceipt', async function() {

    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    // unset the price oracle
    const unsetResponse = await pricerOstUsd.unsetPriceOracle(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyUSD,
      0xBA43B7400,
      constants.chainId,
      {returnType: constants.returnTypeReceipt});

    // verify if the transaction receipt is valid.
    // We will not check here if the value is really set as its just interaction layer testing.
    pricerUtils.verifyTransactionReceipt(unsetResponse);

  });

});


