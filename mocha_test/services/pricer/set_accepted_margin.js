/* global describe, it */

const chai = require('chai')
  , assert = chai.assert;

const rootPrefix = "../../.."
  , constants = require(rootPrefix + '/mocha_test/services/pricer/constants')
  , pricer = require(rootPrefix + '/lib/contract_interact/pricer')
  , pricerUtils = require('./pricer_utils')
  , pricerOstUsd = new pricer(constants.pricerOstUsdAddress)
;

describe('Set accepted margins', function() {
  it('should pass the initial address checks', async function() {
    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    assert.isDefined(constants.deployer);
    assert.isDefined(constants.ops);
    assert.isDefined(constants.account1);
    assert.notEqual(constants.deployer, constants.ops);
    assert.notEqual(constants.deployer, constants.account1);
    assert.notEqual(constants.ops, constants.account1);

  /*  const response = await pricerOstUsd.setAcceptedMargin(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyUSD,
      30,
      0xBA43B7400,
      constants.chainId,
      {returnType: 'txReceipt'});

    pricerUtils.verifyTransactionReceipt(response);
    await pricerUtils.verifyIfMined(pricerOstUsd, response.data.transaction_hash);

    // verify if value is changed
    const amResult = await pricerOstUsd.acceptedMargins(constants.currencyUSD);
    assert.equal(amResult.isSuccess(), true);
    assert.equal(30, amResult.data.acceptedMargins);
    */

  });

  it('should fail when currency is blank', async function() {

    const response = await pricerOstUsd.setAcceptedMargin(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyBlank,
      3,
      0xBA43B7400,
      constants.chainId,
      {returnType: 'txReceipt'});
    assert.equal(response.isFailure(), true);

  });


  it('should fail when gas amount is 0', async function() {

    const response = await pricerOstUsd.setAcceptedMargin(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyUSD,
      3,
      0,
      constants.chainId,
      {returnType: 'txReceipt'});
    assert.equal(response.isFailure(), true);

  });

  it('should fail when sender address is 0', async function() {

    const response = await pricerOstUsd.setAcceptedMargin(
      0,
      constants.opsPassphrase,
      constants.currencyUSD,
      3,
      0xBA43B7400,
      constants.chainId,
      {returnType: 'txReceipt'});
    assert.equal(response.isFailure(), true);

  });


  it('should fail when accepted margin is negetive', async function() {

    const response = await pricerOstUsd.setAcceptedMargin(
      0,
      constants.opsPassphrase,
      constants.currencyUSD,
      -30,
      0xBA43B7400,
      constants.chainId,
      {returnType: 'txReceipt'});
    assert.equal(response.isFailure(), true);

  });


  it('should fail when sender is not ops', async function() {
    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    // set the accepted margin to 3
    const response1 = await pricerOstUsd.setAcceptedMargin(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyUSD,
      3,
      0xBA43B7400,
      constants.chainId,
      {returnType: 'txReceipt'});

    // verify if the transaction receipt is valid
    pricerUtils.verifyTransactionReceipt(response1);

    // verify if the transaction has was actually mined
    await pricerUtils.verifyIfMined(pricerOstUsd, response1.data.transaction_hash);

    // verify if the accepted margin is set to 3
    const amResult1 = await pricerOstUsd.acceptedMargins(constants.currencyUSD);
    assert.equal(amResult1.isSuccess(), true);
    assert.equal(3, amResult1.data.acceptedMargins);

    // set the accepted margin to 8
    const response2 = await pricerOstUsd.setAcceptedMargin(
      constants.deployer,
      constants.deployerPassphrase,
      constants.currencyUSD,
      8,
      0xBA43B7400);

    // verify if the transaction receipt is valid
    pricerUtils.verifyTransactionReceipt(response2);

    // verify if the transaction has was actually mined
    await pricerUtils.verifyIfMined(pricerOstUsd, response2.data.transaction_hash);

    // verify if the accepted margin is still set to 3
    const amResult2 = await pricerOstUsd.acceptedMargins(constants.currencyUSD);
    assert.equal(amResult2.isSuccess(), true);
    assert.equal(3, amResult2.data.acceptedMargins);

  });

/*
  it('should pass when margin is 0', async function() {
    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    const response = await pricerOstUsd.setAcceptedMargin(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyUSD,
      0,
      0xBA43B7400);
    assert.equal(response.isSuccess(), true);
    assert.exists(response.data.transactionHash);

    await pricerUtils.verifyReceipt(pricerOstUsd, response.data.transactionHash);

    const amResult = await pricerOstUsd.acceptedMargins(constants.currencyUSD);
    assert.equal(amResult.isSuccess(), true);
    assert.equal(0, amResult.data.acceptedMargins);

  });

  it('should pass when margin is 50', async function() {
    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    const response = await pricerOstUsd.setAcceptedMargin(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyUSD,
      50,
      0xBA43B7400);
    assert.equal(response.isSuccess(), true);
    assert.exists(response.data.transactionHash);

    await pricerUtils.verifyReceipt(pricerOstUsd, response.data.transactionHash);

    const amResult = await pricerOstUsd.acceptedMargins(constants.currencyUSD);
    assert.equal(amResult.isSuccess(), true);
    assert.equal(50, amResult.data.acceptedMargins);

  });
*/
});


