// Load external packages
const assert = require('assert');

// Load cache service
const rootPrefix = "../../.."
  , Utils = require(rootPrefix + './test/lib/utils.js');
  , constants = require(rootPrefix + '/test/services/pricer/constants')
  , pricer = require(rootPrefix + '/lib/contract_interact/pricer')
  , pricerOstUsd = new pricer(pricerOstAddress)
  , pricerOstEur = new pricer(priceOracleOstEurAddress)
  , pricerOstUsdZeroPricePoint = new pricer(pricerOstZeroPricePointAddress)
;

describe('Get price point and calculated amounts', function() {

  it('should pass the initial address checks', async function() {
    assert.notEqual(constants.deployer, constants.ops);
    assert.notEqual(constants.deployer, constants.user);
    assert.notEqual(constants.ops, constants.user);
  });

  it('should fail when currency is 0', async function() {
    await Utils.expectThrow(
      pricerOstUsd.getPricePointAndCalculatedAmounts(
        constants.account1, 
        constants.accountPassphrase1, 
        toWei(1),
        toWei(0.5),
        currencyBlank)
    );
  });

  it('should fail when price point is 0', async function() {
    await Utils.expectThrow(
      pricerOstUsdZeroPricePoint.getPricePointAndCalculatedAmounts(
        constants.account1, 
        constants.accountPassphrase1, 
        toWei(1),
        toWei(0.5),
        constants.currencyUSD)
    );
  });

  it('should pass when all parameters are valid and conversion rate is 5', async function() {
    const amount = toWei(1)
      , commissionAmount = toWei(0.5)
      ;
    var {pricePoint, tokenAmount, commissionTokenAmount } = await pricerOstUsd.getPricePointAndCalculatedAmounts(
        constants.account1, 
        constants.accountPassphrase1, 
        amount,
        commissionAmount,
        constants.currencyUSD)
    assert.equal(pricePoint > 0, true);
  });

  it('should pass when all parameters are valid and conversion rate is 2', async function() {
   
  });

  
});