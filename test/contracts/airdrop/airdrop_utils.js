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
// Test: airdrop_utils.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const Utils          = require('../../lib/utils.js'),
      BigNumber      = require('bignumber.js'),
      Workers        = artifacts.require('./Workers.sol'),
      Airdrop        = artifacts.require('./Airdrop.sol'),
      EIP20TokenMock = artifacts.require('./EIP20TokenMock.sol'),
      PriceOracle    = artifacts.require('./PriceOracleMock.sol'),
      Web3 = require('web3'),
      web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

const ost = 'OST',
      abc = 'ABC'
      ;

/// @dev Export common requires
module.exports.utils     = Utils;
module.exports.bigNumber = BigNumber;

/// @dev Export constants
module.exports.currencies = {
  ost : ost,
  abc : abc
}

/// @dev Deploy
module.exports.deployAirdrop = async (artifacts, accounts) => {

  const conversionRate         = 101,
        conversionRateDecimals = 1,
        token                  = await EIP20TokenMock.new(conversionRate, conversionRateDecimals, ost, 'name', 18),
        TOKEN_DECIMALS         = 18,
        opsAddress             = accounts[1],
        worker                 = accounts[2],
        airdropBudgetHolder    = accounts[3],
        workers                = await Workers.new(),
        airdrop                = await Airdrop.new(token.address, ost, workers.address, airdropBudgetHolder),
        abcPrice               = new BigNumber(20 * 10**18),
        abcPriceOracle         = await PriceOracle.new(ost, abc, abcPrice)
        ;

  assert.ok(await workers.setOpsAddress(opsAddress));
  assert.ok(await airdrop.setOpsAddress(opsAddress));
  let blockNumber = await web3.eth.getBlockNumber();
  assert.ok(await workers.setWorker(worker, blockNumber + 1000, { from: opsAddress }));
  assert.ok(await airdrop.setPriceOracle(abc, abcPriceOracle.address, { from: opsAddress }));

  return {
    token          : token,
    airdrop        : airdrop
  };
};
