
// Load external packages
const chai = require('chai')
  , assert = chai.assert;

const rootPrefix = "../../.."
  , constants = require(rootPrefix + '/test/services/pricer/constants')
  , pricer = require(rootPrefix + '/lib/contract_interact/pricer')
  , pricerOstUsd = new pricer(constants.pricerOstUsdAddress)
  , pricerOstEur = new pricer(constants.pricerOstEurAddress)
  , pricerOstUsdZeroPricePoint = null;//new pricer(pricerOstZeroPricePointAddress)
;

describe('Set price oracle', function() {

  it('should pass the initial address checks', async function() {
    assert.isDefined(constants.deployer);
    assert.isDefined(constants.ops);
    assert.isDefined(constants.account1);
    assert.notEqual(constants.deployer, constants.ops);
    assert.notEqual(constants.deployer, constants.account1);
    assert.notEqual(constants.ops, constants.account1);
  });

/*  it('should fail when sender is not ops', function(done) {
    this.timeout(100000);
    pricerOstUsd.setPriceOracle(
      constants.deployer,
      constants.deployerPassphrase,
      constants.currencyUSD,
      constants.priceOracles["OST"]["USD"],
      0xBA43B7400).then(function(result){
        console.log("Here in result");
        console.log(result);        
        done();
      });
    
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
*/
  it('should pass when OST/USD price oracle is set', async function(done) {
    this.timeout(100000);
    pricerOstUsd.setPriceOracle(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyUSD,
      constants.priceOracles["OST"]["USD"],
      0xBA43B7400).then(function(result) {
        console.log("Here in result");
        console.log(result);
        done();
      });
      /*.then(function() {
        pricerOstUsd.decimals().then( function(poResult) {
          console.log("Here in po");
          console.log(poResult);
        });
        // console.log("Here in po");
        //  pricerOstUsd.priceOracles(constants.currencyUSD).then( function(poResult) {
        //   console.log("Here in po1");
        //   console.log(poResult);
        //   done();
        // });
      });
      */
  });
/*
  it('should pass when OST/EUR price oracle is set', async function() {
    var currency = "EUR"
      , oracleAddress = priceOracleOstEurAddress
      , response = pricer.setPriceOracle(ops, opsPassphrase, currency, oracleAddress);
    assert.equal(response.isSuccess(), false);
    var addressFromPricer = pricer.priceOracles(currency);
    assert.equal(addressFromPricer, oracleAddress);
  });
*/
  

});
