// Copyright 2018 OpenST Ltd.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// ----------------------------------------------------------------------------
// Test: get_price_point_and_calculated_amounts.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const pricerUtils = require('./pricer_utils.js'),
      PriceOracle = artifacts.require('./PriceOracleMock.sol')
      ;

///
/// Test stories
///
/// fails to get pricePoint and calculated amounts if currency is empty
/// fails to get pricePoint and calculated amounts if priceOracle is not set
/// successfully gets pricePoints and calculated amounts
/// when oracle returns 0 for price
///   fails to get pricePoint and calculated amounts

module.exports.perform = (accounts) => {
  const opsAddress       = accounts[1],
        abcPrice         = new pricerUtils.bigNumber(20 * 10**18),
        xyzPrice         = new pricerUtils.bigNumber(10 * 10**18),
        conversionRate   = 10,
        transferAmount   = new pricerUtils.bigNumber(5 * 10**18),
        commissionAmount = new pricerUtils.bigNumber(1.25 * 10**18)
        ;

  before(async () => {
    contracts       = await pricerUtils.deployPricer(artifacts, accounts);
    pricer          = contracts.pricer;
    zeroPriceOracle = contracts.abcPriceOracle;
    xyzPriceOracle  = contracts.xyzPriceOracle;
    await pricer.setPriceOracle(pricerUtils.currencies.abc, abcPriceOracle.address, { from: opsAddress });
    await pricer.setPriceOracle(pricerUtils.currencies.xyz, xyzPriceOracle.address, { from: opsAddress });
  });

  it('fails to get pricePoint and calculated amounts if currency is empty', async () => {
    await pricerUtils.utils.expectThrow(pricer.getPricePointAndCalculatedAmounts.call(
      transferAmount, commissionAmount, ''));
  });

  it('fails to get pricePoint and calculated amounts if priceOracle is not set', async () => {
    await pricerUtils.utils.expectThrow(pricer.getPricePointAndCalculatedAmounts.call(
      transferAmount, commissionAmount, pricerUtils.currencies.ost));
  });

  it('successfully gets pricePoints and calculated amounts', async () => {
    var returns = await pricer.getPricePointAndCalculatedAmounts.call(
      transferAmount, commissionAmount, pricerUtils.currencies.abc);
    assert.equal(returns[0].toNumber(), abcPrice.toNumber());
    assert.equal(returns[1].toNumber(), new pricerUtils.bigNumber(2.5 * 10**18));
    assert.equal(returns[2].toNumber(), new pricerUtils.bigNumber(0.625 * 10**18));

    var returns = await pricer.getPricePointAndCalculatedAmounts.call(
      transferAmount, commissionAmount, pricerUtils.currencies.xyz);
    assert.equal(returns[0].toNumber(), xyzPrice.toNumber());
    assert.equal(returns[1].toNumber(), new pricerUtils.bigNumber(5 * 10**18));
    assert.equal(returns[2].toNumber(), new pricerUtils.bigNumber(1.25 * 10**18));
  });

  context('when oracle returns 0 for price', async () => {
    var zeroPriceOracle = null;

    before(async () => {
      zeroPriceOracle = await PriceOracle.new(pricerUtils.currencies.ost, 'OOO', 0);
      await pricer.setPriceOracle('OOO', zeroPriceOracle.address, { from: opsAddress });
    });

    it('fails to get pricePoint and calculated amounts if pricePoint is 0', async () => {
      await pricerUtils.utils.expectThrow(pricer.getPricePointAndCalculatedAmounts.call(
        transferAmount, commissionAmount, 'OOO'));
    });
  });
}