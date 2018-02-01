// Load external packages
const assert = require('assert');

// Load cache service
const rootPrefix = "../../.."
  , pricer = require(rootPrefix + '/lib/contract_interact/pricer')
  , deployer = ""
  , deployerPassphrase = ""
  , ops = ""
  , opsPassphrase = ""
  , account1 =""
  , accountPassphrase1 = ""
  , account2 =""
  , accountPassphrase2 = ""
  , account3 =""
  , accountPassphrase2 = ""
  , priceOracleOstUsdAddress = ""
  , priceOracleOstUsdZeroPricePointAddress = ""
;

describe('Pay', function() {

  it('should pass the initial address checks', async function() {
    assert.notEqual(deployer, ops);
    assert.notEqual(deployer, user);
    assert.notEqual(ops, user);
  });

  it('should fail when currency is 0', async function() {
   
  });

  it('should fail when price point is 0', async function() {
   
  });

  it('should pass when all parameters are valid and conversion rate is 5', async function() {
   
  });

  it('should pass when all parameters are valid and conversion rate is 0.2', async function() {
   
  });

  
});