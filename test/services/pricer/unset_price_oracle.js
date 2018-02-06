/*
// Load external packages
const assert = require('assert');

const rootPrefix = "../../.."
  , pricer = require(rootPrefix + '/lib/contract_interact/pricer')
  , deployer = ""
  , deployerPassphrase = ""
  , ops = ""
  , opsPassphrase = ""
  , user =""
  , userPassphrase = ""
  , priceOracleOstUsdAddress = ""
  , priceOracleOstEurAddress = ""
  , priceOracleEthUsdAddress = ""
  , priceOracleOstUsdAddressDEC10 = ""
;

describe('Unset price oracle', function() {

  it('should pass the initial address checks', async function() {
    assert.notEqual(deployer, ops);
    assert.notEqual(deployer, user);
    assert.notEqual(ops, user);
  });

  it('should fail when sender is not ops', async function() {
    var currency = "USD"
      , oracleAddress = priceOracleOstUsdAddress
      , response = pricer.unsetPriceOracle(deployer, deployerPassphrase, currency, oracleAddress);
    assert.equal(response.isSuccess(), false);
  });

  it('should fail when sender is not ops', async function() {
    var currency = "USD"
      , oracleAddress = priceOracleOstUsdAddress
      , response = pricer.unsetPriceOracle(ops, opsPassphrase, currency, oracleAddress);
    assert.equal(response.isSuccess(), false);
  });

  it('should fail when price oracle was not set prior', async function() {
    var currency = "INR"
        response = pricer.unsetPriceOracle(ops, opsPassphrase, currency, oracleAddress);
    assert.equal(response.isSuccess(), false);
  });

  it('should pass when price oracle was set prior', async function() {
    //set
    var currency = "USD"
      , oracleAddress = priceOracleOstUsdAddress
      , response = pricer.setPriceOracle(ops, opsPassphrase, currency, oracleAddress);
    assert.equal(response.isSuccess(), false);
    var addressFromPricer = pricer.priceOracles(currency);
    assert.equal(addressFromPricer, oracleAddress);

    // unset
    response = pricer.unsetPriceOracle(ops, opsPassphrase, currency, oracleAddress);
    assert.equal(response.isSuccess(), true);
    addressFromPricer = pricer.priceOracles(currency);
    assert.equal(addressFromPricer, 0);

    // unset again
    response = pricer.unsetPriceOracle(ops, opsPassphrase, currency, oracleAddress);
    assert.equal(response.isSuccess(), false);
  });

});
*/