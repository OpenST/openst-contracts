// Load external packages
const assert = require('assert');

// Load cache service
const rootPrefix = "../../.."
  , pricer = require(rootPrefix + '/lib/contract_interact/pricer')
  , deployer = ""
  , deployerPassphrase = ""
  , ops = ""
  , opsPassphrase = ""
  , user =""
  , userPassphrase = ""

;

describe('Set accepted margins', function() {
  it('should pass the initial address checks', async function() {
    assert.notEqual(deployer, ops);
    assert.notEqual(deployer, user);
    assert.notEqual(ops, user);
  });

  it('should fail when sender is not ops', async function() {
    var currency = "USD"
      , margin = "0.5"
      , response = pricer.setAcceptedMargin(deployer, deployerPassphrase, currency, margin);
    assert.equal(response.isSuccess(), false);
  });

  it('should fail when currency is blank', async function() {
    var currency = ""
      , margin = "0.5"
      , response = pricer.setAcceptedMargin(ops, opsPassphrase, currency, margin);
    assert.equal(response.isSuccess(), false);
  });

  it('should fail when pricer doesnot have price oracle of given currency', async function() {
    var currency = "INR"
      , margin = "0.5"
      , response = pricer.setAcceptedMargin(ops, opsPassphrase, currency, margin);
    assert.equal(response.isSuccess(), false);
  });

  it('should fail when pricer when margin is less than 0', async function() {
    var currency = "USD"
      , margin = "-0.5"
      , response = pricer.setAcceptedMargin(ops, opsPassphrase, currency, margin);
    assert.equal(response.isSuccess(), false);
  });

  it('should pass when pricer when margin is 0', async function() {
    var currency = "USD"
      , margin = "0"
      , response = pricer.setAcceptedMargin(ops, opsPassphrase, currency, margin);
    assert.equal(response.isSuccess(), true);
  });

  it('should pass when pricer when margin is 0.5', async function() {
    var currency = "USD"
      , margin = "0.5"
      , response = pricer.setAcceptedMargin(ops, opsPassphrase, currency, margin);
    assert.equal(response.isSuccess(), true);
  });

  it('should fail when pricer when margin is more than uint64 => 9223372036854775808', async function() {
    var currency = "USD"
      , margin = "9223372036854775808"
      , response = pricer.setAcceptedMargin(ops, opsPassphrase, currency, margin);
    assert.equal(response.isSuccess(), false);
  });

});
