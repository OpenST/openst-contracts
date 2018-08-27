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
// Test: remove.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const web3 = require('../../lib/web3'),
  BigNumber = require('bignumber.js'),
  Hasher = artifacts.require('./Hasher.sol'),
  brandedToken = artifacts.require('./BrandedToken.sol');

module.exports.perform = (accounts) => {
  /// mock OpenST protocol contract address with an external account
  const openSTProtocol = accounts[0],
    conversionRateDecimals = 5,
    conversionRate = new BigNumber(10 * 10 ** conversionRateDecimals),
    chainIDValue = 3,
    chainIDUtility = 1410,
    symbol = 'symbol',
    name = 'name',
    organizationAddress = accounts[1];

  beforeEach(async () => {
    const hasher = await Hasher.new();
    const tokenRules = hasher.address;
    const UUID = await hasher.hashUuid.call(
      symbol,
      name,
      chainIDValue,
      chainIDUtility,
      openSTProtocol,
      conversionRate,
      conversionRateDecimals
    );
    console.log('UUID:', UUID);
    //token = await brandedToken.new(UUID, symbol, name, 18, chainIDValue, chainIDUtility, conversionRate, conversionRateDecimals, tokenRules, organizationAddress,{ from: openSTProtocol });
    token = await brandedToken.new(UUID, symbol, name, 18, chainIDValue, chainIDUtility, { from: openSTProtocol });
    console.log('token:', token.address);
  });

  it('register internal actors', async () => {
    //   let a = {};
    //   a.push(accounts[5]);
    // token.registerInternalActor(a);
  });
};
