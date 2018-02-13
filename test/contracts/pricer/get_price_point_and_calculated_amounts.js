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

const pricer_utils = require('./pricer_utils.js');

///
/// Test stories
///
/// fails to get pricePoint and calculated amounts if currency is empty
/// fails to get pricePoint and calculated amounts if priceOracle is not set
/// fails to get pricePoint and calculated amounts if pricePoint is 0
/// successfully gets pricePoints and calculated amounts

module.exports.perform = (accounts) => {
  const opsAddress       = accounts[1],
        usdPrice         = new pricer_utils.bigNumber(20 * 10**18),
        eurPrice         = new pricer_utils.bigNumber(10 * 10**18),
        conversionRate   = 10,
        transferAmount   = new pricer_utils.bigNumber(5 * 10**18),
        commissionAmount = new pricer_utils.bigNumber(1.25 * 10**18);

  before(async () => {
    contracts      = await pricer_utils.deployPricer(artifacts, accounts);
    pricer         = contracts.pricer;
    usdPriceOracle = contracts.usdPriceOracle;
    eurPriceOracle = contracts.eurPriceOracle;     
    await pricer.setPriceOracle(pricer_utils.currencies.usd, usdPriceOracle.address, { from: opsAddress });
    await pricer.setPriceOracle(pricer_utils.currencies.eur, eurPriceOracle.address, { from: opsAddress });
    await eurPriceOracle.setPrice(eurPrice, { from: opsAddress });
  });

  it('fails to get pricePoint and calculated amounts if currency is empty', async () => {
    await pricer_utils.utils.expectThrow(pricer.getPricePointAndCalculatedAmounts.call(
      transferAmount, commissionAmount, ''));
  });

  it('fails to get pricePoint and calculated amounts if priceOracle is not set', async () => {
    await pricer_utils.utils.expectThrow(pricer.getPricePointAndCalculatedAmounts.call(
      transferAmount, commissionAmount, pricer_utils.currencies.ost));
  });

  it('fails to get pricePoint and calculated amounts if pricePoint is 0', async () => {
    // usdPriceOracle price is not yet set, so will return 0 for pricePoint
    await pricer_utils.utils.expectThrow(pricer.getPricePointAndCalculatedAmounts.call(
      transferAmount, commissionAmount, pricer_utils.currencies.usd));
  });

  it('successfully gets pricePoints and calculated amounts', async () => {
    // set usdPriceOracle price
    await usdPriceOracle.setPrice(usdPrice, { from: opsAddress });

    var returns = await pricer.getPricePointAndCalculatedAmounts.call(
      transferAmount, commissionAmount, pricer_utils.currencies.usd);
    assert.equal(returns[0].toNumber(), usdPrice.toNumber());
    assert.equal(returns[1].toNumber(), new pricer_utils.bigNumber(2.5 * 10**18));
    assert.equal(returns[2].toNumber(), new pricer_utils.bigNumber(0.625 * 10**18));

    var returns = await pricer.getPricePointAndCalculatedAmounts.call(
      transferAmount, commissionAmount, pricer_utils.currencies.eur);
    assert.equal(returns[0].toNumber(), eurPrice.toNumber());
    assert.equal(returns[1].toNumber(), new pricer_utils.bigNumber(5 * 10**18));
    assert.equal(returns[2].toNumber(), new pricer_utils.bigNumber(1.25 * 10**18));
  });

}