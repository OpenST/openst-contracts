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
// Test: set_accepted_margin.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const pricerUtils = require('./pricer_utils.js');

///
/// Test stories
/// 
/// fails to set acceptedMargin by non-ops
/// successfully sets acceptedMargin

module.exports.perform = (accounts) => {
  const opsAddress = accounts[1];

  var contracts      = null,
      pricer         = null,
      abcPriceOracle = null,
      acceptedMargin = null,
      response       = null
      ;

  before(async () => {
    contracts      = await pricerUtils.deployPricer(artifacts, accounts);
    pricer         = contracts.pricer;
    abcPriceOracle = contracts.abcPriceOracle;
    await pricer.setPriceOracle(pricerUtils.currencies.abc, abcPriceOracle.address, { from: opsAddress });
  });

  it('fails to set acceptedMargin by non-ops', async () => {
    acceptedMargin = 1;
    await pricerUtils.utils.expectThrow(pricer.setAcceptedMargin.call(pricerUtils.currencies.abc, acceptedMargin));
  });

  it('successfully sets acceptedMargin', async () => {
    // Sets accepted margin multiple times to show range of gas usages
    acceptedMargin = new pricerUtils.bigNumber(0);
    assert.ok(await pricer.setAcceptedMargin.call(pricerUtils.currencies.abc, acceptedMargin, { from: opsAddress }));
    response = await pricer.setAcceptedMargin(pricerUtils.currencies.abc, acceptedMargin, { from: opsAddress });
    assert.equal((await pricer.acceptedMargins.call(pricerUtils.currencies.abc)).toNumber(), acceptedMargin.toNumber());
    checkAcceptedMarginSetEvent(response.logs[0], pricerUtils.currencies.abc, acceptedMargin);
    pricerUtils.utils.logResponse(response, 'Pricer.setAcceptedMargin: ' + acceptedMargin);

    acceptedMargin = new pricerUtils.bigNumber(1);
    assert.ok(await pricer.setAcceptedMargin.call(pricerUtils.currencies.abc, acceptedMargin, { from: opsAddress }));
    response = await pricer.setAcceptedMargin(pricerUtils.currencies.abc, acceptedMargin, { from: opsAddress });
    assert.equal((await pricer.acceptedMargins.call(pricerUtils.currencies.abc)).toNumber(), acceptedMargin.toNumber());
    checkAcceptedMarginSetEvent(response.logs[0], pricerUtils.currencies.abc, acceptedMargin);
    pricerUtils.utils.logResponse(response, 'Pricer.setAcceptedMargin: ' + acceptedMargin);

    acceptedMargin = new pricerUtils.bigNumber(7.778 * 10**17); // 10**17 to ease readability in gas usage output
    assert.ok(await pricer.setAcceptedMargin.call(pricerUtils.currencies.abc, acceptedMargin, { from: opsAddress }));
    response = await pricer.setAcceptedMargin(pricerUtils.currencies.abc, acceptedMargin, { from: opsAddress });
    assert.equal((await pricer.acceptedMargins.call(pricerUtils.currencies.abc)).toNumber(), acceptedMargin.toNumber());
    checkAcceptedMarginSetEvent(response.logs[0], pricerUtils.currencies.abc, acceptedMargin);
    pricerUtils.utils.logResponse(response, 'Pricer.setAcceptedMargin: ' + acceptedMargin);
  });
}

function checkAcceptedMarginSetEvent(event, _currency, _acceptedMargin) {
  assert.equal(event.event, 'AcceptedMarginSet');
  assert.equal(web3.toAscii(event.args._currency), _currency);
  assert.equal(event.args._acceptedMargin.toNumber(), _acceptedMargin);
}
