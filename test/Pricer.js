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
// Test: Pricer.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const Utils = require('./lib/utils.js');
const Pricer_utils = require('./Pricer_utils.js');
const Pricer = artifacts.require('./Pricer.sol');
const BigNumber = require('bignumber.js');

///
/// Test stories
/// 
/// Construction
///   fails to deploy if baseCurrency matches quoteCurrency
///
/// Properties
///   has decimals
///   has priceValidityDuration
///   has baseCurrency
///   has quoteCurrency


contract('Pricer', function(accounts) {
  const baseCurrency   = 'OST',
        usdCurrency    = 'USD',
        eurCurrency    = 'EUR',
        TOKEN_DECIMALS = 18,
        opsAddress     = accounts[1];

  var result = null;

  describe ('Construction', async () => {
    it('fails to deploy if UUID is bad', async () => {
      assert.ok(false);
    });

  });

  describe('Properties', async () => {

    before(async () => {
      contracts   = await Pricer_utils.deployPricer(artifacts, accounts);
      pricer      = contracts.pricer;
    });

    it('has decimals', async () => {
      assert.equal((await pricer.decimals.call()).toNumber(), TOKEN_DECIMALS);
    });

    it('has baseCurrency', async () => {
      assert.equal(web3.toAscii(await pricer.baseCurrency.call()), baseCurrency);
    });

  });

  describe('setPriceOracle', async () => {
    before(async () => {
      contracts      = await Pricer_utils.deployPricer(artifacts, accounts);
      pricer         = contracts.pricer;
      usdPriceOracle = contracts.usdPriceOracle;
      eurPriceOracle = contracts.eurPriceOracle;     
    });

    it('successfully sets priceOracles', async () => {
      assert.ok(await pricer.setPriceOracle.call(usdCurrency, usdPriceOracle.address, { from: opsAddress }));
      result = await pricer.setPriceOracle(usdCurrency, usdPriceOracle.address, { from: opsAddress });
      assert.equal(await pricer.priceOracles.call(usdCurrency), usdPriceOracle.address);
    });

  });

});
