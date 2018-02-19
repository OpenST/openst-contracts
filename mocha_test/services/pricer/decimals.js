
/* global describe, it */

const chai = require('chai')
  , assert = chai.assert;

const rootPrefix = "../../.."
  , constants = require(rootPrefix + '/mocha_test/lib/constants')
  , utils = require(rootPrefix+'/mocha_test/lib/utils')
  , pricer = require(rootPrefix + '/lib/contract_interact/pricer')
  , pricerOstUsd = new pricer(constants.pricerOstUsdAddress, constants.chainId)
  , pricerOstEur = new pricer(constants.pricerOstEurAddress, constants.chainId)
  , pricerOstUsd10Decimal = new pricer(constants.pricerOstUsd10DecimalAddress, constants.chainId)
;

describe('Get decimals', function() {

  it('should return correct decimals', async function() {

    const pricerOstUsdResult = await pricerOstUsd.decimals();
    assert.equal(pricerOstUsdResult.isSuccess(), true);
    assert.equal(pricerOstUsdResult.data.decimals, 18);

    const pricerOstEurResult = await pricerOstEur.decimals();
    assert.equal(pricerOstEurResult.isSuccess(), true);
    assert.equal(pricerOstEurResult.data.decimals, 18);

    const pricerOstUsd10Result = await pricerOstUsd10Decimal.decimals();
    assert.equal(pricerOstUsd10Result.isSuccess(), true);
    assert.equal(pricerOstUsd10Result.data.decimals, 10);

  });

});
