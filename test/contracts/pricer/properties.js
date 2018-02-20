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
// Test: properties.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const pricerUtils = require('./pricer_utils.js');

///
/// Test stories
///
/// has brandedToken
/// has baseCurrency
/// has decimals
/// has conversionRate

module.exports.perform = (accounts) => {
  const TOKEN_DECIMALS = 18,
        conversionRate = 10
        ;

  before(async () => {
    contracts   = await pricerUtils.deployPricer(artifacts, accounts);
    token       = contracts.token;
    pricer      = contracts.pricer;
  });

  it('has brandedToken', async () => {
    assert.equal(await pricer.brandedToken.call(), token.address);
  });

  it('has baseCurrency', async () => {
    assert.equal(web3.toAscii(await pricer.baseCurrency.call()), pricerUtils.currencies.ost);
  });

  it('has decimals', async () => {
    assert.equal((await pricer.decimals.call()).toNumber(), TOKEN_DECIMALS);
  });

  it('has conversionRate', async () => {
    assert.equal((await pricer.conversionRate.call()).toNumber(), conversionRate);
  });
}
