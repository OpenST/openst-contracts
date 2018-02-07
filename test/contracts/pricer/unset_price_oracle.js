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
// Test: unset_price_oracle.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const pricer_utils = require('./pricer_utils.js');

///
/// Test stories
/// 
/// fails to unset priceOracle by non-ops
/// fails to unset priceOracle if not already set
/// successfully unsets priceOracle

module.exports.perform = (accounts) => {
  const opsAddress = accounts[1];

  var response = null;

  before(async () => {
    contracts      = await pricer_utils.deployPricer(artifacts, accounts);
    pricer         = contracts.pricer;
    usdPriceOracle = contracts.usdPriceOracle;
    eurPriceOracle = contracts.eurPriceOracle;     
    await pricer.setPriceOracle(pricer_utils.currencies.usd, usdPriceOracle.address, { from: opsAddress });
    await pricer.setPriceOracle(pricer_utils.currencies.eur, eurPriceOracle.address, { from: opsAddress });
  });

  it('fails to set priceOracle by non-ops', async () => {
    await pricer_utils.utils.expectThrow(pricer.unsetPriceOracle.call(pricer_utils.currencies.usd));
  });

  it('successfully unsets priceOracle', async () => {
    assert.ok(await pricer.unsetPriceOracle.call(pricer_utils.currencies.usd, { from: opsAddress }));
    response = await pricer.unsetPriceOracle(pricer_utils.currencies.usd, { from: opsAddress });
    assert.equal(await pricer.priceOracles.call(pricer_utils.currencies.usd), 0);
    checkPriceOracleUnsetEvent(response.logs[0], pricer_utils.currencies.usd);
    pricer_utils.utils.logResponse(response, 'Pricer.unsetPriceOracle: ' + pricer_utils.currencies.usd);

    // confirm EUR priceOracle unaffected
    assert.equal(await pricer.priceOracles.call(pricer_utils.currencies.eur), eurPriceOracle.address);
  });

  it('fails to unset priceOracle if not already set', async () => {
    await pricer_utils.utils.expectThrow(pricer.unsetPriceOracle.call(pricer_utils.currencies.usd, { from: opsAddress }));
  });
}

function checkPriceOracleUnsetEvent(event, _currency) {
  assert.equal(event.event, 'PriceOracleUnset');
  assert.equal(web3.toAscii(event.args._currency), _currency);
}
