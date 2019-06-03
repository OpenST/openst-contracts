// Copyright 2018 OST.com Ltd.
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

'use strict';

const testConfig = require('../test_lib/config');
const web3 = require('../test_lib/web3.js');

const EIP20TokenFake = artifacts.require('EIP20TokenFake');
const TokenRules = artifacts.require('TokenRules');
const Organization = artifacts.require('Organization');

/**
 * Creates an EIP20 instance to be used during TokenRules::executeTransfers
 * function's testing with the following defaults:
 *      - symbol: 'OST'
 *      - name: 'Open Simple Token'
 */
module.exports.createEIP20Token = async () => {
  const token = await EIP20TokenFake.new(
    'OST', 'Open Simple Token', testConfig.decimals,
  );

  return token;
};

/**
 * Creates and returns the tuple:
 *      (tokenRules, organizationAddress, token)
 */
module.exports.createTokenEconomy = async (accountProvider) => {
  const organizationOwner = accountProvider.get();
  const organizationWorker = accountProvider.get();
  const organization = await Organization.new(
    organizationOwner,
    organizationOwner,
    [organizationWorker],
    (await web3.eth.getBlockNumber()) + 100000,
    { from: accountProvider.get() },
  );

  const token = await this.createEIP20Token();

  const tokenRules = await TokenRules.new(
    organization.address, token.address,
  );

  await tokenRules.enableDirectTransfers({ from: organizationWorker });

  const organizationAddress = organization.address;

  return {
    tokenRules,
    token,
    organizationAddress,
    organizationOwner,
    organizationWorker,
  };
};
