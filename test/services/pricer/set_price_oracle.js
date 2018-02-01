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
  , priceOracleOstUsdAddress = ""
  , priceOracleOstEurAddress = ""
  , priceOracleEthUsdAddress = ""
  , priceOracleOstUsdAddressDEC10 = ""

;

describe('Set price oracle', function() {

  it('should pass the initial address checks', async function() {
    assert.notEqual(deployer, ops);
    assert.notEqual(deployer, user);
    assert.notEqual(ops, user);
  });

  it('should fail when sender is not ops', async function() {
    var currency = "USD"
      , oracleAddress = priceOracleOstUsdAddress
      , response = pricer.setPriceOracle(deployer, deployerPassphrase, currency, oracleAddress);
    assert.equal(response.isSuccess(), false);
  });

  it('should fail when currency is blank', async function() {
    var currency = ""
      , oracleAddress = priceOracleOstUsdAddress
      , response = pricer.setPriceOracle(ops, opsPassphrase, currency, oracleAddress);
    assert.equal(response.isSuccess(), false);
  });

  it('should fail when oracleAddress is 0', async function() {
    var currency = "USD"
      , oracleAddress = 0
      , response = pricer.setPriceOracle(ops, opsPassphrase, currency, oracleAddress);
    assert.equal(response.isSuccess(), false);
  });

  it('should fail when price oracle has different quote currency', async function() {
    var currency = "USD"
      , oracleAddress = priceOracleOstEurAddress
      , response = pricer.setPriceOracle(ops, opsPassphrase, currency, oracleAddress);
    assert.equal(response.isSuccess(), false);
  });

  it('should fail when price oracle has different decimal', async function() {
    var currency = "USD"
      , oracleAddress = priceOracleOstUsdAddressDEC10
      , response = pricer.setPriceOracle(ops, opsPassphrase, currency, oracleAddress);
    assert.equal(response.isSuccess(), false);
  });

  it('should pass when OST/USD price oracle is set', async function() {
    var currency = "USD"
      , oracleAddress = priceOracleOstUsdAddress
      , response = pricer.setPriceOracle(ops, opsPassphrase, currency, oracleAddress);
    assert.equal(response.isSuccess(), false);
    var addressFromPricer = pricer.priceOracles(currency);
    assert.equal(addressFromPricer, oracleAddress);
  });

  it('should pass when OST/EUR price oracle is set', async function() {
    var currency = "EUR"
      , oracleAddress = priceOracleOstEurAddress
      , response = pricer.setPriceOracle(ops, opsPassphrase, currency, oracleAddress);
    assert.equal(response.isSuccess(), false);
    var addressFromPricer = pricer.priceOracles(currency);
    assert.equal(addressFromPricer, oracleAddress);
  });

  

});