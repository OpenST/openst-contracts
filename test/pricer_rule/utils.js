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
const TokenRulesSpy = artifacts.require('TokenRulesSpy');
const Organization = artifacts.require('Organization');
const PricerRule = artifacts.require('PricerRule');
const PriceOracleFake = artifacts.require('PriceOracleFake');

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

module.exports.createOrganization = async (accountProvider) => {
    const organizationOwner = accountProvider.get();
    const organizationWorker = accountProvider.get();

    const organization = await Organization.new(
        organizationOwner,
        organizationOwner,
        [organizationWorker],
        (await web3.eth.getBlockNumber()) + 100000,
        { from: accountProvider.get() },
    );

    return {
        organization,
        organizationOwner,
        organizationWorker,
    };
};

/**
 * Creates and returns the tuple:
 *      (tokenRules, organizationAddress, token)
 */
module.exports.createTokenEconomy = async (accountProvider) => {
    const {
        organization,
        organizationOwner,
        organizationWorker,
    } = await this.createOrganization(accountProvider);

    const token = await this.createEIP20Token();

    const tokenRules = await TokenRulesSpy.new();

    const baseCurrencyCode = 'OST';

    const conversionRate = 315;

    const conversionRateDecimals = 2;

    const pricerRule = await PricerRule.new(
        organization.address,
        token.address,
        web3.utils.stringToHex(baseCurrencyCode.toString()),
        conversionRate,
        conversionRateDecimals,
        tokenRules.address,
    );

    const quoteCurrencyCode = 'EUR';
    const priceOracleInitialPrice = 11;
    const initialPriceExpirationHeight = (await web3.eth.getBlockNumber()) + 10000;

    const priceOracle = await PriceOracleFake.new(
        web3.utils.stringToHex(baseCurrencyCode),
        web3.utils.stringToHex(quoteCurrencyCode),
        priceOracleInitialPrice,
        initialPriceExpirationHeight,
    );

    return {
        organization,
        organizationOwner,
        organizationWorker,
        token,
        tokenRules,
        baseCurrencyCode,
        conversionRate,
        conversionRateDecimals,
        pricerRule,
        quoteCurrencyCode,
        priceOracleInitialPrice,
        priceOracle,
    };
};
