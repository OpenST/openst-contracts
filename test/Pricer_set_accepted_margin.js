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
// Test: Pricer_set_accepted_margin.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const Pricer_utils = require('./Pricer_utils.js');

///
/// Test stories
/// 
/// fails to set acceptedMargin by non-ops
/// successfully sets acceptedMargin

module.exports.perform = (accounts) => {
  const opsAddress = accounts[1];

  var response = null;
  var acceptedMargin = null;

  before(async () => {
    contracts      = await Pricer_utils.deployPricer(artifacts, accounts);
    pricer         = contracts.pricer;
    usdPriceOracle = contracts.usdPriceOracle;
    eurPriceOracle = contracts.eurPriceOracle;     
    await pricer.setPriceOracle(Pricer_utils.currencies.usd, usdPriceOracle.address, { from: opsAddress });
  });

  it('fails to set acceptedMargin by non-ops', async () => {
    acceptedMargin = 1;
    await Pricer_utils.utils.expectThrow(pricer.setAcceptedMargin.call(Pricer_utils.currencies.usd, acceptedMargin));
  });

  it('successfully sets acceptedMargin', async () => {
    // Sets accepted margin multiple times to show range of gas usages
    acceptedMargin = new Pricer_utils.bigNumber(0);
    assert.ok(await pricer.setAcceptedMargin.call(Pricer_utils.currencies.usd, acceptedMargin, { from: opsAddress }));
    response = await pricer.setAcceptedMargin(Pricer_utils.currencies.usd, acceptedMargin, { from: opsAddress });
    assert.equal((await pricer.acceptedMargins.call(Pricer_utils.currencies.usd)).toNumber(), acceptedMargin.toNumber());
    checkAcceptedMarginSetEvent(response.logs[0], Pricer_utils.currencies.usd, acceptedMargin);
    Pricer_utils.utils.logResponse(response, 'Pricer.setAcceptedMargin: ' + acceptedMargin);

    acceptedMargin = new Pricer_utils.bigNumber(1);
    assert.ok(await pricer.setAcceptedMargin.call(Pricer_utils.currencies.usd, acceptedMargin, { from: opsAddress }));
    response = await pricer.setAcceptedMargin(Pricer_utils.currencies.usd, acceptedMargin, { from: opsAddress });
    assert.equal((await pricer.acceptedMargins.call(Pricer_utils.currencies.usd)).toNumber(), acceptedMargin.toNumber());
    checkAcceptedMarginSetEvent(response.logs[0], Pricer_utils.currencies.usd, acceptedMargin);
    Pricer_utils.utils.logResponse(response, 'Pricer.setAcceptedMargin: ' + acceptedMargin);

    acceptedMargin = new Pricer_utils.bigNumber(7.778 * 10**18);
    assert.ok(await pricer.setAcceptedMargin.call(Pricer_utils.currencies.usd, acceptedMargin, { from: opsAddress }));
    response = await pricer.setAcceptedMargin(Pricer_utils.currencies.usd, acceptedMargin, { from: opsAddress });
    assert.equal((await pricer.acceptedMargins.call(Pricer_utils.currencies.usd)).toNumber(), acceptedMargin.toNumber());
    checkAcceptedMarginSetEvent(response.logs[0], Pricer_utils.currencies.usd, acceptedMargin);
    Pricer_utils.utils.logResponse(response, 'Pricer.setAcceptedMargin: ' + acceptedMargin);
  });
}

function checkAcceptedMarginSetEvent(event, _currency, _acceptedMargin) {
  assert.equal(event.event, 'AcceptedMarginSet');
  assert.equal(web3.toAscii(event.args._currency), _currency);
  assert.equal(event.args._acceptedMargin.toNumber(), _acceptedMargin);
}
