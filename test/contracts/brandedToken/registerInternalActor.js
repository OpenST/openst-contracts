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
  brandedToken = artifacts.require('./BrandedToken.sol'),
  tokenHolder = artifacts.require('./TokenHolder.sol');

module.exports.perform = (accounts) => {
  const openSTProtocol = accounts[0],
    conversionRateDecimals = 5,
    conversionRate = new BigNumber(10 * 10 ** conversionRateDecimals),
    chainIDValue = 3,
    chainIDUtility = 1410,
    symbol = 'symbol',
    name = 'name',
    organizationAddress = accounts[1],
    token = null;
  let brandedTokenInstance, tokenHolderInstance;
  beforeEach(async () => {});

  it('deploys branded token', async () => {
    const hasher = await Hasher.new();
    const tokenRules = accounts[0];
    const valueToken = accounts[1];
    brandedTokenInstance = await brandedToken.new(
      valueToken,
      symbol,
      name,
      18,
      conversionRate,
      conversionRateDecimals,
      organizationAddress,
      { from: openSTProtocol }
    );
  });

  it('should register internal actor', async () => {
    let internalActor = [];
    internalActor.push(accounts[4]);

    await brandedTokenInstance.registerInternalActor(internalActor, { from: organizationAddress });

    assert.equal(await brandedTokenInstance.isInternalActor(accounts[4]), true);
    assert.equal(await brandedTokenInstance.isInternalActor(accounts[3]), false);
  });
};
