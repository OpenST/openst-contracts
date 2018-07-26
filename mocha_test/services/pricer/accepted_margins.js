/* global describe, it */

const chai = require('chai'),
  assert = chai.assert;

const rootPrefix = '../../..',
  constants = require(rootPrefix + '/mocha_test/lib/constants'),
  utils = require(rootPrefix + '/mocha_test/lib/utils'),
  pricer = require(rootPrefix + '/lib/contract_interact/pricer'),
  pricerOstUsd = new pricer(constants.pricerOstUsdAddress, constants.chainId);

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

    const amResult = await pricerOstUsd.acceptedMargins('ABC');
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

    // set the accepted margin to 50
    const response1 = await pricerOstUsd.setAcceptedMargin(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyUSD,
      50,
      constants.gasUsed,
      constants.optionsReceipt
    );

    // verify if the transaction receipt is valid
    utils.verifyTransactionReceipt(response1);

    // verify if the transaction has was actually mined
    await utils.verifyIfMined(pricerOstUsd, response1.data.transaction_hash);

    // verify if the accepted margin is set to 50
    const amResult1 = await pricerOstUsd.acceptedMargins(constants.currencyUSD);
    assert.equal(amResult1.isSuccess(), true);
    assert.equal(50, amResult1.data.acceptedMargins);

    // set the accepted margin to 300
    const response2 = await pricerOstUsd.setAcceptedMargin(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyUSD,
      300,
      constants.gasUsed,
      constants.optionsReceipt
    );

    // verify if the transaction receipt is valid
    utils.verifyTransactionReceipt(response2);

    // verify if the transaction has was actually mined
    await utils.verifyIfMined(pricerOstUsd, response2.data.transaction_hash);

    // verify if the accepted margin is set to 300
    const amResult2 = await pricerOstUsd.acceptedMargins(constants.currencyUSD);
    assert.equal(amResult2.isSuccess(), true);
    assert.equal(300, amResult2.data.acceptedMargins);

    // set the accepted margin to 100
    const response3 = await pricerOstUsd.setAcceptedMargin(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyEUR,
      100,
      constants.gasUsed,
      constants.optionsReceipt
    );

    // verify if the transaction receipt is valid
    utils.verifyTransactionReceipt(response3);

    // verify if the transaction has was actually mined
    await utils.verifyIfMined(pricerOstUsd, response3.data.transaction_hash);

    // verify if the accepted margin is set to 100
    const amResult3 = await pricerOstUsd.acceptedMargins(constants.currencyEUR);
    assert.equal(amResult3.isSuccess(), true);
    assert.equal(100, amResult3.data.acceptedMargins);
  });
});
