/* global describe, it */

/*eslint-disable */
const chai = require('chai')
  , assert = chai.assert;

const rootPrefix = "../../.."
  , constants = require(rootPrefix + '/mocha_test/services/pricer/constants')
  , pricer = require(rootPrefix + '/lib/contract_interact/pricer')
  , pricerUtils = require('./pricer_utils')
  , pricerOstUsd = new pricer(constants.pricerOstUsdAddress)
;
/*eslint-enable */

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

    // set the accepted margin to 30
    const response = await pricerOstUsd.setAcceptedMargin(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyUSD,
      30,
      0xBA43B7400,
      constants.chainId,
      {returnType: constants.returnTypeReceipt});

    // verify if the transaction receipt is valid
    pricerUtils.verifyTransactionReceipt(response);

    // verify if the transaction has was actually mined
    await pricerUtils.verifyIfMined(pricerOstUsd, response.data.transaction_hash);

    // verify if value is changed
    const amResult = await pricerOstUsd.acceptedMargins(constants.currencyUSD);
    assert.equal(amResult.isSuccess(), true);
    assert.equal(30, amResult.data.acceptedMargins);

  });

  it('should pass for interaction layer test when return type is uuid', async function() {

    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    // set the accepted margin to 50
    const response = await pricerOstUsd.setAcceptedMargin(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyUSD,
      50,
      0xBA43B7400,
      constants.chainId,
      {returnType: constants.returnTypeUUID});

    // verify if the transaction receipt is valid
    // we will not verify if it got mined as its just interaction layer testing
    pricerUtils.verifyTransactionUUID(response);

  });

  it('should pass for interaction layer test when return type is txHash', async function() {

    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    // set the accepted margin to 150
    const response = await pricerOstUsd.setAcceptedMargin(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyUSD,
      150,
      0xBA43B7400,
      constants.chainId,
      {returnType: constants.returnTypeHash});

    // verify if the transaction hash is valid
    // we will not verify if it got mined as its just interaction layer testing
    pricerUtils.verifyTransactionHash(response);

  });

  it('should pass for interaction layer test when return type is txReceipt', async function() {

    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    // set the accepted margin to 70
    const response = await pricerOstUsd.setAcceptedMargin(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyUSD,
      70,
      0xBA43B7400,
      constants.chainId,
      {returnType: constants.returnTypeReceipt});

    // verify if the transaction receipt is valid.
    // We will not check here if the value is really set as its just interaction layer testing.
    pricerUtils.verifyTransactionReceipt(response);

  });


  it('should fail when currency is blank', async function() {

    // set the accepted margin to 3
    const response = await pricerOstUsd.setAcceptedMargin(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyBlank,
      3,
      0xBA43B7400,
      constants.chainId,
      {returnType: constants.returnTypeReceipt});

    // verify if the response is failure
    assert.equal(response.isFailure(), true);

  });


  it('should fail when gas amount is 0', async function() {

    // set the accepted margin to 3
    const response = await pricerOstUsd.setAcceptedMargin(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyUSD,
      3,
      0,
      constants.chainId,
      {returnType: constants.returnTypeReceipt});

    // verify if the response is failure
    assert.equal(response.isFailure(), true);

  });

  it('should fail when sender address is 0', async function() {

    // set the accepted margin to 3
    const response = await pricerOstUsd.setAcceptedMargin(
      0,
      constants.opsPassphrase,
      constants.currencyUSD,
      3,
      0xBA43B7400,
      constants.chainId,
      {returnType: constants.returnTypeReceipt});

    // verify if the response is failure
    assert.equal(response.isFailure(), true);

  });


  it('should fail when accepted margin is negetive', async function() {

    // set the accepted margin to -30
    const response = await pricerOstUsd.setAcceptedMargin(
      0,
      constants.opsPassphrase,
      constants.currencyUSD,
      -30,
      0xBA43B7400,
      constants.chainId,
      {returnType: constants.returnTypeReceipt});

    // verify if the response is failure
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
      {returnType: constants.returnTypeReceipt});

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
      0xBA43B7400,
      constants.chainId,
      {returnType: constants.returnTypeReceipt});

    // verify if the transaction receipt is valid
    pricerUtils.verifyTransactionReceipt(response2);

    // verify if the transaction has was actually mined
    await pricerUtils.verifyIfMined(pricerOstUsd, response2.data.transaction_hash);

    // verify if the accepted margin is still set to 3
    const amResult2 = await pricerOstUsd.acceptedMargins(constants.currencyUSD);
    assert.equal(amResult2.isSuccess(), true);
    assert.equal(3, amResult2.data.acceptedMargins);

  });


  it('should pass when margin is 0', async function() {

    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    // set the accepted margin to 0
    const response = await pricerOstUsd.setAcceptedMargin(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyUSD,
      0,
      0xBA43B7400,
      constants.chainId,
      {returnType: constants.returnTypeReceipt});

    // verify if the transaction receipt is valid
    pricerUtils.verifyTransactionReceipt(response);

    // verify if the transaction has was actually mined
    await pricerUtils.verifyIfMined(pricerOstUsd, response.data.transaction_hash);

    // verify if the accepted margin is set to 0
    const amResult = await pricerOstUsd.acceptedMargins(constants.currencyUSD);
    assert.equal(amResult.isSuccess(), true);
    assert.equal(0, amResult.data.acceptedMargins);

  });


  it('should pass when margin is 50', async function() {

    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    // set the accepted margin to 50
    const response = await pricerOstUsd.setAcceptedMargin(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyUSD,
      50,
      0xBA43B7400,
      constants.chainId,
      {returnType: constants.returnTypeReceipt});

    // verify if the transaction receipt is valid
    pricerUtils.verifyTransactionReceipt(response);

    // verify if the transaction has was actually mined
    await pricerUtils.verifyIfMined(pricerOstUsd, response.data.transaction_hash);

    // verify if the accepted margin is set to 50
    const amResult = await pricerOstUsd.acceptedMargins(constants.currencyUSD);
    assert.equal(amResult.isSuccess(), true);
    assert.equal(50, amResult.data.acceptedMargins);

  });

});


