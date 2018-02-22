
/* global describe, it */

const chai = require('chai')
  , assert = chai.assert;

const rootPrefix = "../../.."
  , constants = require(rootPrefix + '/mocha_test/lib/constants')
  , pricer = require(rootPrefix + '/lib/contract_interact/pricer')
  , pricerOstUsd = new pricer(constants.pricerOstUsdAddress, constants.chainId)
  , pricerOstEur = new pricer(constants.pricerOstEurAddress, constants.chainId)
  , pricerOstUsd10Decimal = new pricer(constants.pricerOstUsd10DecimalAddress, constants.chainId)
;

describe('Get conversion rate', function() {

  it('should return correct conversion rate', async function() {

    const pricerOstUsdResult = await pricerOstUsd.conversionRate();
    assert.equal(pricerOstUsdResult.isSuccess(), true);
    assert.equal(pricerOstUsdResult.data.conversionRate, 5);

    const pricerOstEurResult = await pricerOstEur.conversionRate();
    assert.equal(pricerOstEurResult.isSuccess(), true);
    assert.equal(pricerOstEurResult.data.conversionRate, 2);

    const pricerOstUsd10Result = await pricerOstUsd10Decimal.conversionRate();
    assert.equal(pricerOstUsd10Result.isSuccess(), true);
    assert.equal(pricerOstUsd10Result.data.conversionRate, 3);

  });

});
