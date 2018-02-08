/* global describe, it */

const chai = require('chai')
  , assert = chai.assert;

const rootPrefix = "../../.."
  , constants = require(rootPrefix + '/mocha_test/services/pricer/constants')
  , pricer = require(rootPrefix + '/lib/contract_interact/pricer')
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

    await pricerOstUsd.setAcceptedMargin(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyUSD,
      30,
      0xBA43B7400);
    const amResult = await pricerOstUsd.acceptedMargins(constants.currencyUSD);
    assert.equal(30, amResult);

  });

  it('should fail when currency is blank', async function() {
    try {
      await pricerOstUsd.setAcceptedMargin(
        constants.ops,
        constants.opsPassphrase,
        constants.currencyBlank,
        3,
        0xBA43B7400);
    }
    catch (err) {
      assert.equal(err, 'Currency is mandatory');
    }
  });

  it('should fail when gas amount is 0', async function() {
    var error = false;
    try {
      await pricerOstUsd.setAcceptedMargin(
        constants.ops,
        constants.opsPassphrase,
        constants.currencyUSD,
        3,
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
      await pricerOstUsd.setAcceptedMargin(
        0,
        constants.opsPassphrase,
        constants.currencyUSD,
        3,
        0xBA43B7400);
    }
    catch (err) {
      error = true;
    }
    assert.isTrue(error);
  });


  it('should fail when accepted margin is negetive', async function() {
    var error = false;
    try {
      await pricerOstUsd.setAcceptedMargin(
        0,
        constants.opsPassphrase,
        constants.currencyUSD,
        -30,
        0xBA43B7400);
    }
    catch (err) {
      error = true;
    }
    assert.isTrue(error);
  });

  it('should fail when sender is not ops', async function() {
    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    await pricerOstUsd.setAcceptedMargin(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyUSD,
      3,
      0xBA43B7400);
    const amResult1 = await pricerOstUsd.acceptedMargins(constants.currencyUSD);
    assert.equal(3, amResult1);

    await pricerOstUsd.setAcceptedMargin(
      constants.deployer,
      constants.deployerPassphrase,
      constants.currencyUSD,
      8,
      0xBA43B7400);
    const amResult2 = await pricerOstUsd.acceptedMargins(constants.currencyUSD);
    assert.equal(3, amResult2);

  });

  it('should pass when margin is 0', async function() {
    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    await pricerOstUsd.setAcceptedMargin(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyUSD,
      0,
      0xBA43B7400);
    const amResult = await pricerOstUsd.acceptedMargins(constants.currencyUSD);
    assert.equal(0, amResult);

  });

  it('should pass when margin is 50', async function() {
    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    await pricerOstUsd.setAcceptedMargin(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyUSD,
      50,
      0xBA43B7400);
    const amResult = await pricerOstUsd.acceptedMargins(constants.currencyUSD);
    assert.equal(50, amResult);

  });

});
