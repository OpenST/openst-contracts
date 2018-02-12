/* global describe, it */

const chai = require('chai')
  , assert = chai.assert;

const rootPrefix = "../../.."
  , constants = require(rootPrefix + '/mocha_test/services/pricer/constants')
  , pricerUtils = require('./pricer_utils')
  , pricer = require(rootPrefix + '/lib/contract_interact/pricer')
  , pricerOstUsd = new pricer(constants.pricerOstUsdAddress)
;


describe('Get accepted margins', function() {

  it('should pass the initial address checks', function() {

    assert.isDefined(constants.deployer);
    assert.isDefined(constants.ops);
    assert.isDefined(constants.account1);
    assert.notEqual(constants.deployer, constants.ops);
    assert.notEqual(constants.deployer, constants.account1);
    assert.notEqual(constants.ops, constants.account1);

  });

  it('should return 0 when margin was not set for given currency', async function() {
    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    const amResult = await pricerOstUsd.acceptedMargins("ABC");
    assert.equal(amResult.isSuccess(), true);
    assert.equal(0, amResult.data.acceptedMargins);

  });

  it('should return error when margin when currency is blank', async function() {
    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    const amResult = await pricerOstUsd.acceptedMargins(constants.currencyBlank);
    assert.equal(amResult.isFailure(), true);

  });

  it('should return the accepted margin as 50, 100 and 300', async function() {
    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    const response1 = await pricerOstUsd.setAcceptedMargin(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyUSD,
      50,
      0xBA43B7400);

    assert.equal(response1.isSuccess(), true);
    assert.exists(response1.data.transactionHash);
    await pricerUtils.verifyReceipt(pricerOstUsd, response1.data.transactionHash);

    const amResult1 = await pricerOstUsd.acceptedMargins(constants.currencyUSD);
    assert.equal(amResult1.isSuccess(), true);
    assert.equal(50, amResult1.data.acceptedMargins);


    const response2 = await pricerOstUsd.setAcceptedMargin(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyUSD,
      300,
      0xBA43B7400);

    assert.equal(response2.isSuccess(), true);
    assert.exists(response2.data.transactionHash);
    await pricerUtils.verifyReceipt(pricerOstUsd, response2.data.transactionHash);

    const amResult2 = await pricerOstUsd.acceptedMargins(constants.currencyUSD);
    assert.equal(amResult2.isSuccess(), true);
    assert.equal(300, amResult2.data.acceptedMargins);


    const response3 = await pricerOstUsd.setAcceptedMargin(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyEUR,
      100,
      0xBA43B7400);

    assert.equal(response3.isSuccess(), true);
    assert.exists(response3.data.transactionHash);
    await pricerUtils.verifyReceipt(pricerOstUsd, response3.data.transactionHash);

    const amResult3 = await pricerOstUsd.acceptedMargins(constants.currencyEUR);
    assert.equal(amResult3.isSuccess(), true);
    assert.equal(100, amResult3.data.acceptedMargins);

  });

});


