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
// Test: unset_price_oracle.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const pricerUtils = require('./pricer_utils.js');

///
/// Test stories
///
/// fails to unset priceOracle by non-ops
/// fails to unset priceOracle if not already set
/// successfully unsets priceOracle

module.exports.perform = (accounts) => {
  const opsAddress = accounts[1];

  var contracts = null,
    pricer = null,
    abcPriceOracle = null,
    xyzPriceOracle = null,
    response = null;

  before(async () => {
    contracts = await pricerUtils.deployPricer(artifacts, accounts);
    pricer = contracts.pricer;
    abcPriceOracle = contracts.abcPriceOracle;
    xyzPriceOracle = contracts.xyzPriceOracle;
    await pricer.setPriceOracle(pricerUtils.currencies.abc, abcPriceOracle.address, { from: opsAddress });
    await pricer.setPriceOracle(pricerUtils.currencies.xyz, xyzPriceOracle.address, { from: opsAddress });
  });

  it('fails to set priceOracle by non-ops', async () => {
    await pricerUtils.utils.expectThrow(pricer.unsetPriceOracle.call(pricerUtils.currencies.abc));
  });

  it('successfully unsets priceOracle', async () => {
    assert.ok(await pricer.unsetPriceOracle.call(pricerUtils.currencies.abc, { from: opsAddress }));
    response = await pricer.unsetPriceOracle(pricerUtils.currencies.abc, { from: opsAddress });
    assert.equal(await pricer.priceOracles.call(pricerUtils.currencies.abc), 0);
    checkPriceOracleUnsetEvent(response.logs[0], pricerUtils.currencies.abc);
    pricerUtils.utils.logResponse(response, 'Pricer.unsetPriceOracle: ' + pricerUtils.currencies.abc);

    // confirm EUR priceOracle unaffected
    assert.equal(await pricer.priceOracles.call(pricerUtils.currencies.xyz), xyzPriceOracle.address);
  });

  it('fails to unset priceOracle if not already set', async () => {
    await pricerUtils.utils.expectThrow(pricer.unsetPriceOracle.call(pricerUtils.currencies.abc, { from: opsAddress }));
  });
};

function checkPriceOracleUnsetEvent(event, _currency) {
  assert.equal(event.event, 'PriceOracleUnset');
  assert.equal(web3.toAscii(event.args._currency), _currency);
}
