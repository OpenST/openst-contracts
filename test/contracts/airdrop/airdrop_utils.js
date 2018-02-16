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
// Test: pricer_utils.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const Utils          = require('../../lib/utils.js'),
      BigNumber      = require('bignumber.js'),
      Airdrop         = artifacts.require('./Airdrop.sol'),
      EIP20TokenMock = artifacts.require('./EIP20TokenMock.sol'),
      PriceOracle    = artifacts.require('./ost-price-oracle/PriceOracle.sol');

const ost = 'OST',
      usd = 'USD';

/// @dev Export common requires
module.exports.utils     = Utils;
module.exports.bigNumber = BigNumber;

/// @dev Export constants
module.exports.currencies = {
  ost : ost,
  usd : usd
}

/// @dev Deploy
module.exports.deployPricer = async (artifacts, accounts) => {

  const token               = await EIP20TokenMock.new(10, ost, 'name', 18),
        TOKEN_DECIMALS      = 18,
        opsAddress          = accounts[1],
        workers             = accounts[2],
        airdropBudgetHolder = accounts[3],
        airdrop             = await Airdrop.new(token.address, ost),
        usdPriceOracle      = await PriceOracle.new(ost, usd);

  assert.ok(await airdrop.setOpsAddress(opsAddress));
  assert.ok(await usdPriceOracle.setOpsAddress(opsAddress));

	return {
    token          : token,
    airdrop        : airdrop,
    usdPriceOracle : usdPriceOracle
	};
};
