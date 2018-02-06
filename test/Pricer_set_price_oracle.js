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
// Test: Pricer_properties.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const Pricer_utils = require('./Pricer_utils.js');

///
/// Test stories
/// 
/// successfully sets priceOracles

module.exports.perform = (accounts) => {
  const opsAddress = accounts[1];

  var response = null;

  before(async () => {
    contracts      = await Pricer_utils.deployPricer(artifacts, accounts);
    pricer         = contracts.pricer;
    usdPriceOracle = contracts.usdPriceOracle;
    eurPriceOracle = contracts.eurPriceOracle;     
  });

  it('successfully sets priceOracles', async () => {
    assert.ok(await pricer.setPriceOracle.call(Pricer_utils.currencies.usd, usdPriceOracle.address, { from: opsAddress }));
    response = await pricer.setPriceOracle(Pricer_utils.currencies.usd, usdPriceOracle.address, { from: opsAddress });
    assert.equal(await pricer.priceOracles.call(Pricer_utils.currencies.usd), usdPriceOracle.address);
    Pricer_utils.utils.logResponse(response, 'Pricer.setPriceOracle: ' + Pricer_utils.currencies.usd);

    assert.ok(await pricer.setPriceOracle.call(Pricer_utils.currencies.eur, eurPriceOracle.address, { from: opsAddress }));
    response = await pricer.setPriceOracle(Pricer_utils.currencies.eur, eurPriceOracle.address, { from: opsAddress });
    assert.equal(await pricer.priceOracles.call(Pricer_utils.currencies.eur), eurPriceOracle.address);
    Pricer_utils.utils.logResponse(response, 'Pricer.setPriceOracle: ' + Pricer_utils.currencies.eur);
  });
}