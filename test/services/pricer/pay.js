/*
// Load external packages
const assert = require('assert');

const rootPrefix = "../../.."
  , Utils = require(rootPrefix + './test/lib/utils.js');
  , constants = require(rootPrefix + '/test/services/pricer/constants')
  , pricer = require(rootPrefix + '/lib/contract_interact/pricer')
  , pricerOstUsd = new pricer(pricerOstAddress)
  , pricerOstEur = new pricer(priceOracleOstEurAddress)
  , pricerOstUsdZeroPricePoint = new pricer(pricerOstZeroPricePointAddress)
;


describe('Pay', function() {

  it('should pass the initial address checks', async function() {
    assert.notEqual(deployer, ops);
    assert.notEqual(deployer, user);
    assert.notEqual(ops, user);
  });

  it('should fail when beneficiary address is 0', async function() {
    var beneficiary = 0
      , transferAmount = pricerOstUsd.toWei(5)
      , commissionBeneficiary = constants.account3
      , commissionAmount = pricerOstUsd.toWei(1)
      , currency = constants.currencyUSD
      , intendedPricePoint = pricerOstUsd.getPricePoint(currency)
      ;
    var response = await pricerOstUsd.pay(constants.account1, 
        constants.accountPassphrase1, 
        beneficiary, 
        transferAmount,
        commissionBeneficiary,
        commissionAmount,
        currency,
        intendedPricePoint);
    
    assert.equal(response.isSuccess(), false);
  });

  it('should fail when beneficiary transfer amount is 0', async function() {
    var beneficiary = constants.account2
      , transferAmount = pricerOstUsd
      , commissionBeneficiary = account3
      , commissionAmount = 1
      , currency = "USD"
      , intendedPricePoint = pricerOstUsd.getPricePoint(currency)
      ;
    var response = pricer.pay(account1, 
        accountPassphrase1, 
        beneficiary, 
        transferAmount,
        commissionBeneficiary,
        commissionAmount,
        currency,
        intendedPricePoint);
    
    assert.equal(response.isSuccess(), false);
  });

  it('should fail when currency is not available in pricer', async function() {
    var beneficiary = account2
      , transferAmount = 1
      , commissionBeneficiary = account3
      , commissionAmount = 1
      , currency = "INR"
      , intendedPricePoint = pricer.getPricePoint(currency)
      ;
    var response = pricer.pay(account1, 
        accountPassphrase1, 
        beneficiary, 
        transferAmount,
        commissionBeneficiary,
        commissionAmount,
        currency,
        intendedPricePoint);
    
    assert.equal(response.isSuccess(), false);
  });

  it('should fail when intendedPricePoint is more than the acceptable margin of current price point', async function() {
    var beneficiary = account2
      , transferAmount = 1
      , commissionBeneficiary = account3
      , commissionAmount = 1
      , currency = "USD"
      , margin = "0.5";
      
    var setMarginResponse = pricer.setAcceptedMargin(ops, opsPassphrase, currency, margin);
    assert.equal(response.isSuccess(), true);

    var intendedPricePoint = margin + pricer.getPricePoint(currency);

    var response = pricer.pay(account1, 
        accountPassphrase1, 
        beneficiary, 
        transferAmount,
        commissionBeneficiary,
        commissionAmount,
        currency,
        intendedPricePoint);
    
    assert.equal(response.isSuccess(), false);
  });

  it('should fail when intendedPricePoint is less than the acceptable margin of current price point', async function() {
    var beneficiary = account2
      , transferAmount = 1
      , commissionBeneficiary = account3
      , commissionAmount = 1
      , currency = "USD"
      , margin = "0.5";
      
    var setMarginResponse = pricer.setAcceptedMargin(ops, opsPassphrase, currency, margin);
    assert.equal(response.isSuccess(), true);

    var intendedPricePoint = pricer.getPricePoint(currency) - margin;

    var response = pricer.pay(account1, 
        accountPassphrase1, 
        beneficiary, 
        transferAmount,
        commissionBeneficiary,
        commissionAmount,
        currency,
        intendedPricePoint);
    
    assert.equal(response.isSuccess(), false);
  });

  it('should fail when price point is 0 and currency is not blank', async function() {
    var beneficiary = account2
      , transferAmount = 1
      , commissionBeneficiary = account3
      , commissionAmount = 1
      , currency = "USD";
      
    var intendedPricePoint = pricer.getPricePoint(currency) - margin;

    var response = pricer.pay(account1, 
        accountPassphrase1, 
        beneficiary, 
        transferAmount,
        commissionBeneficiary,
        commissionAmount,
        currency,
        intendedPricePoint);
    
    assert.equal(response.isSuccess(), false);
  });

  it('should fail when price point changes beyond acceptable margins', async function() {

  });

  it('should fail when beneficiary has insufficent balance', async function() {

  });

  it('should fail when commision beneficiary address is 0 and commissionAmount is > 0', async function() {

  });

  it('should pass when all parameters are valid and commision beneficiary address, commissionAmount is 0', async function() {

  });

  it('should pass when all parameters are valid', async function() {

  });

  it('should pass when all parameters are currency is blank', async function() {

  });
});
*/