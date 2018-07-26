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
// Test: set_price_oracle.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const pricerUtils = require('./pricer_utils.js'),
  PriceOracle = artifacts.require('./PriceOracleMock.sol');

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
  });

  it('fails to set priceOracle by non-ops', async () => {
    await pricerUtils.utils.expectThrow(pricer.setPriceOracle.call(pricerUtils.currencies.abc, abcPriceOracle.address));
  });

  it('fails to set priceOracle if oracleAddress is null', async () => {
    await pricerUtils.utils.expectThrow(
      pricer.setPriceOracle.call(pricerUtils.currencies.abc, 0, { from: opsAddress })
    );
  });

  it('fails to set priceOracle if currency is empty', async () => {
    await pricerUtils.utils.expectThrow(pricer.setPriceOracle.call('', abcPriceOracle.address, { from: opsAddress }));
  });

  it('fails to set priceOracle if oracle baseCurrency does not match pricer baseCurrency', async () => {
    var inappositeOracle = await PriceOracle.new(pricerUtils.currencies.abc, pricerUtils.currencies.ost, 1);
    await pricerUtils.utils.expectThrow(
      pricer.setPriceOracle.call(pricerUtils.currencies.abc, inappositeOracle.address, { from: opsAddress })
    );
  });

  it('fails to set priceOracle if oracle quoteCurrency does not match currency', async () => {
    await pricerUtils.utils.expectThrow(pricer.setPriceOracle.call(pricerUtils.currencies.xyz, abcPriceOracle.address));
  });

  it('successfully sets priceOracles', async () => {
    assert.ok(
      await pricer.setPriceOracle.call(pricerUtils.currencies.abc, abcPriceOracle.address, { from: opsAddress })
    );
    response = await pricer.setPriceOracle(pricerUtils.currencies.abc, abcPriceOracle.address, { from: opsAddress });
    assert.equal(await pricer.priceOracles.call(pricerUtils.currencies.abc), abcPriceOracle.address);
    checkPriceOracleSetEvent(response.logs[0], pricerUtils.currencies.abc, abcPriceOracle.address);
    pricerUtils.utils.logResponse(response, 'Pricer.setPriceOracle: ' + pricerUtils.currencies.abc);

    assert.ok(
      await pricer.setPriceOracle.call(pricerUtils.currencies.xyz, xyzPriceOracle.address, { from: opsAddress })
    );
    response = await pricer.setPriceOracle(pricerUtils.currencies.xyz, xyzPriceOracle.address, { from: opsAddress });
    assert.equal(await pricer.priceOracles.call(pricerUtils.currencies.xyz), xyzPriceOracle.address);
    checkPriceOracleSetEvent(response.logs[0], pricerUtils.currencies.xyz, xyzPriceOracle.address);
    pricerUtils.utils.logResponse(response, 'Pricer.setPriceOracle: ' + pricerUtils.currencies.xyz);
  });
};

function checkPriceOracleSetEvent(event, _currency, _address) {
  assert.equal(event.event, 'PriceOracleSet');
  assert.equal(web3.toAscii(event.args._currency), _currency);
  assert.equal(event.args._address, _address);
}
