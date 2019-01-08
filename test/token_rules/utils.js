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

const web3 = require('../test_lib/web3.js');

const EIP20TokenFake = artifacts.require('EIP20TokenFake');
const TokenRules = artifacts.require('TokenRules');
const Organization = artifacts.require('Organization');

/**
 * Creates an EIP20 instance to be used during TokenRules::executeTransfers
 * function's testing with the following defaults:
 *      - symbol: 'OST'
 *      - name: 'Open Simple Token'
 *      - decimals: 1
 */
module.exports.createEIP20Token = async () => {
    const token = await EIP20TokenFake.new(
        'OST', 'Open Simple Token', 1,
    );

    return token;
};

/**
 * Creates and returns the tuple:
 *      (tokenRules, organizationAddress, token)
 */
module.exports.createTokenEconomy = async (accountProvider) => {
    const owner = accountProvider.get();
    const worker = accountProvider.get();
    const organization = await Organization.new({ from: owner });
    const expirationHeight = (await web3.eth.getBlockNumber()) + 100;
    await organization.setWorker(worker, expirationHeight, { from: owner });
    const token = await this.createEIP20Token();

    const tokenRules = await TokenRules.new(
        organization.address, token.address,
    );
    const organizationAddress = organization.address;
    return {
        tokenRules,
        organizationAddress,
        token,
        worker,
    };
};
