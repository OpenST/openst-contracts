// Copyright 2019 OpenST Ltd.
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
const PricerRuleUtils = require('./utils.js');
const { AccountProvider } = require('../test_lib/utils');

const PricerRule = artifacts.require('PricerRule');

contract('PricerRule::constructor', async () => {
  contract('Negative Tests', async (accounts) => {
    const accountProvider = new AccountProvider(accounts);

    it('Reverts if the token economy address is null.', async () => {
      const {
        organization,
      } = await PricerRuleUtils.createOrganization(accountProvider);

      await Utils.expectRevert(
        PricerRule.new(
          organization.address,
          Utils.NULL_ADDRESS, // economy token address
          web3.utils.stringToHex('OST'), // base currency code
          1, // conversion rate
          0, // conversion rate decimals
          0, // price oracles required decimals number
          accountProvider.get(), // token rules
        ),
        'Should revert as the economy token address is null.',
        'Token address is null.',
      );
    });

    it('Reverts if the base currency code is empty.', async () => {
      const {
        organization,
      } = await PricerRuleUtils.createOrganization(accountProvider);

      await Utils.expectRevert(
        PricerRule.new(
          organization.address,
          accountProvider.get(), // economy token address
          web3.utils.stringToHex(''), // base currency code
          1, // conversion rate
          0, // conversion rate decimals
          0, // price oracles required decimals number
          accountProvider.get(), // token rules
        ),
        'Should revert as the base currency code is null.',
        'Base currency code is null.',
      );
    });

    it('Reverts if the conversion rate from the base currency to the token is 0.', async () => {
      const {
        organization,
      } = await PricerRuleUtils.createOrganization(accountProvider);

      await Utils.expectRevert(
        PricerRule.new(
          organization.address,
          accountProvider.get(), // economy token address
          web3.utils.stringToHex('OST'), // base currency code
          0, // conversion rate
          0, // conversion rate decimals
          0, // price oracles required decimals number
          accountProvider.get(), // token rules
        ),
        'Should revert as the conversion rate from the base currency to the token is 0.',
        'Conversion rate from the base currency to the token is 0.',
      );
    });

    it('Reverts if the token rules address is null.', async () => {
      const {
        organization,
      } = await PricerRuleUtils.createOrganization(accountProvider);

      await Utils.expectRevert(
        PricerRule.new(
          organization.address,
          accountProvider.get(), // economy token address
          web3.utils.stringToHex('OST'), // base currency code
          1, // conversion rate
          0, // conversion rate decimals
          0, // price oracles required decimals number
          Utils.NULL_ADDRESS, // token rules
        ),
        'Should revert as token rules is null.',
        'Token rules address is null.',
      );
    });
  });

  contract('Storage', async (accounts) => {
    const accountProvider = new AccountProvider(accounts);
    it('Checks that passed arguments are set correctly.', async () => {
      const {
        organization,
      } = await PricerRuleUtils.createOrganization(accountProvider);

      const eip20TokenDecimals = 10;
      const eip20TokenConfig = {
        symbol: 'OST',
        name:'Open Simple Token',
        decimals: eip20TokenDecimals,
      };
      const token = await PricerRuleUtils.createEIP20Token(eip20TokenConfig);
      const tokenRules = accountProvider.get();
      const pricerRule = await PricerRule.new(
        organization.address,
        token.address, // economy token address
        web3.utils.stringToHex('OST'), // base currency code
        10, // conversion rate
        1, // conversion rate decimals
        2, // price oracles required decimals number
        tokenRules, // token rules
      );

      assert.strictEqual(
        (await pricerRule.organization.call()),
        organization.address,
      );

      assert.strictEqual(
        (await pricerRule.baseCurrencyCode.call()),
        web3.utils.stringToHex('OST'),
      );

      assert.strictEqual(
        (await pricerRule.eip20Token.call()),
        token.address,
      );

      assert.strictEqual(
        web3.utils.hexToString(await pricerRule.baseCurrencyCode.call()),
        'OST',
      );

      assert.isOk(
        (await pricerRule.conversionRateFromBaseCurrencyToToken.call()).eqn(10),
      );

      assert.isOk(
        (await pricerRule.conversionRateDecimalsFromBaseCurrencyToToken.call()).eqn(1),
      );

      assert.isOk(
        (await pricerRule.requiredPriceOracleDecimals.call()).eqn(2),
      );

      assert.isOk(
        (await pricerRule.eip20TokenDecimals.call()).eqn(eip20TokenDecimals),
      );

      assert.strictEqual(
        (await pricerRule.tokenRules.call()),
        tokenRules,
      );
    });
  });
});
