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
// Test: Pricer_set_price_oracle.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const Pricer_utils = require('./Pricer_utils.js');
const PriceOracle = artifacts.require('./PriceOracle.sol');

///
/// Test stories
/// 
/// fails to set priceOracle by non-ops
/// fails to set priceOracle if oracleAddress is null
/// fails to set priceOracle if currency is empty
/// fails to set priceOracle if oracle baseCurrency does not match pricer baseCurrency
/// fails to set priceOracle if oracle quoteCurrency does not match currency
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

  it('fails to set priceOracle by non-ops', async () => {
    await Pricer_utils.utils.expectThrow(pricer.setPriceOracle.call(Pricer_utils.currencies.usd, usdPriceOracle.address));
  });

  it('fails to set priceOracle if oracleAddress is null', async () => {
    await Pricer_utils.utils.expectThrow(pricer.setPriceOracle.call(Pricer_utils.currencies.usd, 0, { from: opsAddress }));
  });

  it('fails to set priceOracle if currency is empty', async () => {
    await Pricer_utils.utils.expectThrow(pricer.setPriceOracle.call('', usdPriceOracle.address, { from: opsAddress }));
  });

  it('fails to set priceOracle if oracle baseCurrency does not match pricer baseCurrency', async () => {
    var inappositeOracle = await PriceOracle.new(Pricer_utils.currencies.usd, Pricer_utils.currencies.ost);
    await Pricer_utils.utils.expectThrow(pricer.setPriceOracle.call(
      Pricer_utils.currencies.usd, inappositeOracle.address, { from: opsAddress }));
  });

  it('fails to set priceOracle if oracle quoteCurrency does not match currency', async () => {
    await Pricer_utils.utils.expectThrow(pricer.setPriceOracle.call(Pricer_utils.currencies.eur, usdPriceOracle.address));
  });

  it('successfully sets priceOracles', async () => {
    assert.ok(await pricer.setPriceOracle.call(Pricer_utils.currencies.usd, usdPriceOracle.address, { from: opsAddress }));
    response = await pricer.setPriceOracle(Pricer_utils.currencies.usd, usdPriceOracle.address, { from: opsAddress });
    assert.equal(await pricer.priceOracles.call(Pricer_utils.currencies.usd), usdPriceOracle.address);
    checkPriceOracleSetEvent(response.logs[0], Pricer_utils.currencies.usd, usdPriceOracle.address);
    Pricer_utils.utils.logResponse(response, 'Pricer.setPriceOracle: ' + Pricer_utils.currencies.usd);

    assert.ok(await pricer.setPriceOracle.call(Pricer_utils.currencies.eur, eurPriceOracle.address, { from: opsAddress }));
    response = await pricer.setPriceOracle(Pricer_utils.currencies.eur, eurPriceOracle.address, { from: opsAddress });
    assert.equal(await pricer.priceOracles.call(Pricer_utils.currencies.eur), eurPriceOracle.address);
    checkPriceOracleSetEvent(response.logs[0], Pricer_utils.currencies.eur, eurPriceOracle.address);
    Pricer_utils.utils.logResponse(response, 'Pricer.setPriceOracle: ' + Pricer_utils.currencies.eur);
  });
}

function checkPriceOracleSetEvent(event, _currency, _address) {
  assert.equal(event.event, 'PriceOracleSet');
  assert.equal(web3.toAscii(event.args._currency), _currency);
  assert.equal(event.args._address, _address);
}
