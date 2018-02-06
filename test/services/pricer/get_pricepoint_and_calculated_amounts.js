
/*
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

describe('Get price point and calculated amounts', function() {

  it('should pass the initial address checks', async function() {
    assert.isDefined(constants.deployer);
    assert.isDefined(constants.ops);
    assert.isDefined(constants.account1);
    assert.notEqual(constants.deployer, constants.ops);
    assert.notEqual(constants.deployer, constants.account1);
    assert.notEqual(constants.ops, constants.account1);
  });

  it('should fail when currency is 0', async function() {
    const result = await pricerOstUsd.getPricePointAndCalculatedAmounts(
      pricerOstUsd.toWei('1'),
      pricerOstUsd.toWei('0.5'),
      constants.currencyBlank);
    assert.equal(result.success, false);
  });

  it('should fail when price point is 0', async function() {
    const result = await pricerOstUsd.getPricePointAndCalculatedAmounts(
      pricerOstUsd.toWei('1'),
      pricerOstUsd.toWei('0.5'),
      constants.currencyEUR);
    assert.equal(result.success, false);
  });

  it('should pass when all parameters are valid and conversion rate is 5', async function() {
    const amount = pricerOstUsd.toWei('1')
      , commissionAmount = pricerOstUsd.toWei('0.5')
      ;

    const result = await pricerOstUsd.getPricePointAndCalculatedAmounts(
      amount,
      commissionAmount,
      constants.currencyUSD);
    console.log(result);
    assert.equal(result.success, true);

    // var {pricePoint, tokenAmount, commissionTokenAmount } = await pricerOstUsd.getPricePointAndCalculatedAmounts(
    //     amount,
    //     commissionAmount,
    //     constants.currencyUSD);
    // const poPricePoint = await pricerOstUsd.getPricePoint(constants.currencyUSD);
    // const calculatedTokenAmount = calculate(tokenAmount, poPricePoint, 5);
    // const calculatedCommissionTokenAmount = calculate(commissionAmount, poPricePoint, 5);
    // assert.equal(pricePoint, poPricePoint);
    // assert.equal(tokenAmount, calculatedTokenAmount);
    // assert.equal(commissionTokenAmount, calculatedCommissionTokenAmount);
  });

  it('should pass when all parameters are valid and conversion rate is 2', async function() {
   const amount = pricerOstEur.toWei('1')
      , commissionAmount = pricerOstEur.toWei('0.5')
      ;
    const result = await pricerOstUsd.getPricePointAndCalculatedAmounts(
      amount,
      commissionAmount,
      constants.currencyUSD);
    console.log(result);
    assert.equal(result.success, true);
    // var {pricePoint, tokenAmount, commissionTokenAmount } = await pricerOstEur.getPricePointAndCalculatedAmounts(
    //     constants.account1, 
    //     constants.accountPassphrase1, 
    //     amount,
    //     commissionAmount,
    //     constants.currencyUSD);
    // const poPricePoint = await pricerOstEur.getPricePoint(constants.currencyEur);
    // const calculatedTokenAmount = calculate(tokenAmount, poPricePoint, 2);
    // const calculatedCommissionTokenAmount = calculate(commissionAmount, poPricePoint, 2);
    // assert.equal(pricePoint, poPricePoint);
    // assert.equal(tokenAmount, calculatedTokenAmount);
    // assert.equal(commissionTokenAmount, calculatedCommissionTokenAmount);
  });
  
});
*/
