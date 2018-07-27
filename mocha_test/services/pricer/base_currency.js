/* global describe, it */

const chai = require('chai'),
  assert = chai.assert;

const rootPrefix = '../../..',
  constants = require(rootPrefix + '/mocha_test/lib/constants'),
  InstanceComposer = require(rootPrefix + '/instance_composer'),
  configStrategy = require(rootPrefix + '/mocha_test/scripts/config_strategy'),
  instanceComposer = new InstanceComposer(configStrategy);

require(rootPrefix + '/lib/contract_interact/pricer');

const pricer = instanceComposer.getPricerInteractClass(),
  pricerOstUsd = new pricer(constants.pricerOstUsdAddress, constants.chainId),
  pricerOstEur = new pricer(constants.pricerOstEurAddress, constants.chainId),
  pricerOstUsd10Decimal = new pricer(constants.pricerOstUsd10DecimalAddress, constants.chainId);

describe('Get base currency', function() {
  it('should return correct base currency (OST)', async function() {
    const pricerOstUsdResult = await pricerOstUsd.baseCurrency();
    assert.equal(pricerOstUsdResult.isSuccess(), true);
    assert.equal(pricerOstUsdResult.data.symbol, 'OST');

    const pricerOstEurResult = await pricerOstEur.baseCurrency();
    assert.equal(pricerOstEurResult.isSuccess(), true);
    assert.equal(pricerOstEurResult.data.symbol, 'OST');

    const pricerOstUsd10Result = await pricerOstUsd10Decimal.baseCurrency();
    assert.equal(pricerOstUsd10Result.isSuccess(), true);
    assert.equal(pricerOstUsd10Result.data.symbol, 'OST');
  });
});
