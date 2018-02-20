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
// Test: pricerUtils.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const Utils          = require('../../lib/utils.js'),
      BigNumber      = require('bignumber.js'),
      Pricer         = artifacts.require('./Pricer.sol'),
      EIP20TokenMock = artifacts.require('./EIP20TokenMock.sol'),
    	PriceOracle    = artifacts.require('./PriceOracleMock.sol')
      ;

const ost = 'OST',
      abc = 'ABC',
      xyz = 'XYZ'
      ;

/// @dev Export common requires
module.exports.utils     = Utils;
module.exports.bigNumber = BigNumber;

/// @dev Export constants
module.exports.currencies = {
  ost : ost,
  abc : abc,
  xyz : xyz
}

/// @dev Deploy
module.exports.deployPricer = async (artifacts, accounts) => {
  const token          = await EIP20TokenMock.new(10, ost, 'name', 18),
        TOKEN_DECIMALS = 18,
        opsAddress     = accounts[1],
        pricer         = await Pricer.new(token.address, ost),
        abcPrice       = new BigNumber(20 * 10**18),
        xyzPrice       = new BigNumber(10 * 10**18),
        abcPriceOracle = await PriceOracle.new(ost, abc, abcPrice),
        xyzPriceOracle = await PriceOracle.new(ost, xyz, xyzPrice)
        ;

  assert.ok(await pricer.setOpsAddress(opsAddress));

	return {
    token          : token,
    pricer         : pricer,
    abcPriceOracle : abcPriceOracle,
    xyzPriceOracle : xyzPriceOracle
	};
};
