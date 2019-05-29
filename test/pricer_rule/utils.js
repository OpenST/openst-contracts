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

const web3 = require('../test_lib/web3.js');
const Utils = require('../test_lib/utils');

const EIP20TokenFake = artifacts.require('EIP20TokenFake');
const TokenRulesSpy = artifacts.require('TokenRulesSpy');
const PricerRule = artifacts.require('PricerRule');
const PriceOracleFake = artifacts.require('PriceOracleFake');

/**
 * Creates an EIP20 instance to be used during TokenRules::executeTransfers
 * function's testing with the following defaults:
 *      - symbol: 'OST'
 *      - name: 'Open Simple Token'
 *      - decimals: 1
 * @param config {Object}
 *        config.decimals Configurable token decimals value.
 */
module.exports.createEIP20Token = async (config) => {
  const token = await EIP20TokenFake.new(
    'OST',
    'Open Simple Token',
    config.decimals || 1,
  );

  return token;
};

/**
 * Creates and returns the tuple:
 *      (tokenRules, organizationAddress, token)
 * @param config {Object}
 *        config.requiredPriceOracleDecimals Configurable required price oracle decimals.
 * @param eip20TokenConfig {Object}
 *        config.decimals Configurable token decimals value.
 */
module.exports.createTokenEconomy = async (accountProvider, config = {}, eip20TokenConfig = {}) => {
  const {
    organization,
    organizationOwner,
    organizationWorker,
  } = await Utils.createOrganization(accountProvider);

  const tokenDecimals = eip20TokenConfig.decimals;
  const token = await this.createEIP20Token(eip20TokenConfig);

  const tokenRules = await TokenRulesSpy.new();

  const baseCurrencyCode = 'OST';

  // To derive 1 OST = 1 BT, if conversionRateDecimals = 5, then conversionRate needs to be 10^5.
  const conversionRate = 100000;
  const conversionRateDecimals = 5;

  const requiredPriceOracleDecimals = config.requiredPriceOracleDecimals || 18;

  const pricerRule = await PricerRule.new(
    organization.address,
    token.address,
    web3.utils.stringToHex(baseCurrencyCode.toString()),
    conversionRate,
    conversionRateDecimals,
    requiredPriceOracleDecimals,
    tokenRules.address,
  );

  const quoteCurrencyCode = 'USD';
  const priceOracleInitialPrice = (0.02 * (10 ** requiredPriceOracleDecimals))
    .toString();
  const initialPriceExpirationHeight = (await web3.eth.getBlockNumber()) + 10000;

  const priceOracle = await PriceOracleFake.new(
    web3.utils.stringToHex(baseCurrencyCode),
    web3.utils.stringToHex(quoteCurrencyCode),
    requiredPriceOracleDecimals,
    priceOracleInitialPrice,
    initialPriceExpirationHeight,
  );

  return {
    organization,
    organizationOwner,
    organizationWorker,
    token,
    tokenDecimals,
    tokenRules,
    baseCurrencyCode,
    conversionRate,
    conversionRateDecimals,
    requiredPriceOracleDecimals,
    pricerRule,
    quoteCurrencyCode,
    priceOracleInitialPrice,
    priceOracle,
  };
};
