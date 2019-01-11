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

const web3 = require('../test_lib/web3.js');
const Utils = require('../test_lib/utils');
const PricerRuleUtils = require('./utils.js');
const { AccountProvider } = require('../test_lib/utils');
const { Event } = require('../test_lib/event_decoder');

const PriceOracleFake = artifacts.require('PriceOracleFake');

contract('PricerRule::add_price_oracle', async () => {
    contract('Negative Tests', async (accounts) => {
        const accountProvider = new AccountProvider(accounts);

        it('Reverts as a non-organization worker is calling.', async () => {
            const {
                pricerRule,
                priceOracle,
            } = await PricerRuleUtils.createTokenEconomy(accountProvider);

            await Utils.expectRevert(
                pricerRule.addPriceOracle(
                    priceOracle.address,
                    {
                        from: accountProvider.get(),
                    },
                ),
                'Should revert as a non-organization worker is calling.',
                'Only whitelisted workers are allowed to call this method.',
            );
        });

        it('Reverts as the proposed price oracle address is null.', async () => {
            const {
                organizationWorker,
                pricerRule,
            } = await PricerRuleUtils.createTokenEconomy(accountProvider);

            await Utils.expectRevert(
                pricerRule.addPriceOracle(
                    Utils.NULL_ADDRESS,
                    { from: organizationWorker },
                ),
                'Should revert as the proposed price oracle address is null.',
                'Price oracle address is null.',
            );
        });

        it('Reverts as the proposed price oracle base currency code does not '
        + 'match with pricer base currency.', async () => {
            const {
                organizationWorker,
                baseCurrencyCode,
                pricerRule,
                quoteCurrencyCode,
            } = await PricerRuleUtils.createTokenEconomy(accountProvider);

            const anotherBaseCurrencyCode = 'BTC';
            assert.notEqual(
                baseCurrencyCode,
                anotherBaseCurrencyCode,
                'Ensuring that registered base currency code in '
                + 'pricer is different from new one.',
            );

            const priceOracle = await PriceOracleFake.new(
                web3.utils.stringToHex(anotherBaseCurrencyCode),
                web3.utils.stringToHex(quoteCurrencyCode),
                100, // initial price
            );

            await Utils.expectRevert(
                pricerRule.addPriceOracle(
                    priceOracle.address,
                    { from: organizationWorker },
                ),
                'Should revert as the base currency code in pricer is different '
                + 'than in the proposed price oracle.',
                'Price oracle\'s base currency code does not match.',
            );
        });

        it('Reverts as a price oracle with the same pay-currency code exists.', async () => {
            const {
                organizationWorker,
                baseCurrencyCode,
                pricerRule,
                priceOracle,
                quoteCurrencyCode,
            } = await PricerRuleUtils.createTokenEconomy(accountProvider);

            await pricerRule.addPriceOracle(
                priceOracle.address,
                { from: organizationWorker },
            );

            const priceOracle2 = await PriceOracleFake.new(
                web3.utils.stringToHex(baseCurrencyCode),
                web3.utils.stringToHex(quoteCurrencyCode),
                100, // initial price
            );

            await Utils.expectRevert(
                pricerRule.addPriceOracle(
                    priceOracle2.address,
                    { from: organizationWorker },
                ),
                'Reverts as a price oracle already exists.',
                'Price oracle already exists.',
            );
        });
    });

    contract('Events', async (accounts) => {
        const accountProvider = new AccountProvider(accounts);

        it('Emits PriceOracleAdded.', async () => {
            const {
                organizationWorker,
                pricerRule,
                priceOracle,
            } = await PricerRuleUtils.createTokenEconomy(accountProvider);

            const response = await pricerRule.addPriceOracle(
                priceOracle.address,
                { from: organizationWorker },
            );


            const events = Event.decodeTransactionResponse(
                response,
            );

            assert.strictEqual(
                events.length,
                1,
            );

            Event.assertEqual(events[0], {
                name: 'PriceOracleAdded',
                args: {
                    _priceOracle: priceOracle.address,
                },
            });
        });
    });

    contract('Storage', async (accounts) => {
        const accountProvider = new AccountProvider(accounts);
        it('Checks that price oracle is added.', async () => {
            const {
                organizationWorker,
                pricerRule,
                quoteCurrencyCode,
                priceOracle,
            } = await PricerRuleUtils.createTokenEconomy(accountProvider);

            let actualPriceOracle = await pricerRule.baseCurrencyPriceOracles.call(
                web3.utils.stringToHex(quoteCurrencyCode),
            );

            assert.strictEqual(
                actualPriceOracle,
                Utils.NULL_ADDRESS,
            );

            await pricerRule.addPriceOracle(
                priceOracle.address,
                { from: organizationWorker },
            );

            actualPriceOracle = await pricerRule.baseCurrencyPriceOracles.call(
                web3.utils.stringToHex(quoteCurrencyCode),
            );

            assert.strictEqual(
                priceOracle.address,
                actualPriceOracle,
            );
        });
    });
});
