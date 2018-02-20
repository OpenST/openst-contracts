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
// Test: get_price_point.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const pricerUtils = require('./pricer_utils.js');

///
/// Test stories
/// 
/// fails if priceOracle is not set
/// successfully returns price from priceOracle

module.exports.perform = (accounts) => {
  const opsAddress = accounts[1],
        abcPrice   = new pricerUtils.bigNumber(20 * 10**18),
        xyzPrice   = new pricerUtils.bigNumber(10 * 10**18)
        ;

  var response = null;

  before(async () => {
    contracts      = await pricerUtils.deployPricer(artifacts, accounts);
    pricer         = contracts.pricer;
    abcPriceOracle = contracts.abcPriceOracle;
    xyzPriceOracle = contracts.xyzPriceOracle;
    await pricer.setPriceOracle(pricerUtils.currencies.abc, abcPriceOracle.address, { from: opsAddress });
    await pricer.setPriceOracle(pricerUtils.currencies.xyz, xyzPriceOracle.address, { from: opsAddress });
  });

  it('fails if priceOracle is not set', async () => {
    await pricerUtils.utils.expectThrow(pricer.getPricePoint.call(pricerUtils.currencies.ost));
  });

  it('successfully returns price from priceOracle', async () => {
    assert.equal((await pricer.getPricePoint.call(pricerUtils.currencies.abc)).toNumber(), abcPrice);
    assert.equal((await pricer.getPricePoint.call(pricerUtils.currencies.xyz)).toNumber(), xyzPrice);
  });
}
