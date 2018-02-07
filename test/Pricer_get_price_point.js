// Copyright 2017 OST.com Ltd.
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
// Test: Pricer_get_price_point.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const Pricer_utils = require('./Pricer_utils.js');

///
/// Test stories
/// 
/// fails if priceOracle is not set
/// successfully returns price from priceOracle

module.exports.perform = (accounts) => {
  const opsAddress = accounts[1];
  const usdPrice   = 20;
  const eurPrice   = 10;

  var response = null;

  before(async () => {
    contracts      = await Pricer_utils.deployPricer(artifacts, accounts);
    pricer         = contracts.pricer;
    usdPriceOracle = contracts.usdPriceOracle;
    eurPriceOracle = contracts.eurPriceOracle;     
    await pricer.setPriceOracle(Pricer_utils.currencies.usd, usdPriceOracle.address, { from: opsAddress });
    await pricer.setPriceOracle(Pricer_utils.currencies.eur, eurPriceOracle.address, { from: opsAddress });
    await usdPriceOracle.setPrice(usdPrice, { from: opsAddress });
    await eurPriceOracle.setPrice(eurPrice, { from: opsAddress });
  });

  it('fails if priceOracle is not set', async () => {
    await Pricer_utils.utils.expectThrow(pricer.getPricePoint.call(Pricer_utils.currencies.ost));
  });

  it('successfully returns price from priceOracle', async () => {
    assert.equal((await pricer.getPricePoint.call(Pricer_utils.currencies.usd)).toNumber(), usdPrice);
    assert.equal((await pricer.getPricePoint.call(Pricer_utils.currencies.eur)).toNumber(), eurPrice);
  });
}
