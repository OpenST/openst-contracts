/* global describe, it */

const chai = require('chai'),
  assert = chai.assert;

const rootPrefix = '../../..',
  constants = require(rootPrefix + '/mocha_test/lib/constants'),
  pricer = require(rootPrefix + '/lib/contract_interact/pricer'),
  pricerOstUsd = new pricer(constants.pricerOstUsdAddress, constants.chainId),
  pricerOstEur = new pricer(constants.pricerOstEurAddress, constants.chainId),
  pricerOstUsd10Decimal = new pricer(constants.pricerOstUsd10DecimalAddress, constants.chainId);

describe('Get branded token', function() {
  it('should return correct branded token', async function() {
    const pricerOstUsdResult = await pricerOstUsd.brandedToken();
    assert.equal(pricerOstUsdResult.isSuccess(), true);
    assert.equal(pricerOstUsdResult.data.brandedToken, constants.TC5Address);

    const pricerOstEurResult = await pricerOstEur.brandedToken();
    assert.equal(pricerOstEurResult.isSuccess(), true);
    assert.equal(pricerOstEurResult.data.brandedToken, constants.TC2Address);

    const pricerOstUsd10Result = await pricerOstUsd10Decimal.brandedToken();
    assert.equal(pricerOstUsd10Result.isSuccess(), true);
    assert.equal(pricerOstUsd10Result.data.brandedToken, constants.TC3Address);
  });
});
