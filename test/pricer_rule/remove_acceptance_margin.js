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

const web3 = require('../test_lib/web3.js');
const Utils = require('../test_lib/utils');
const PricerRuleUtils = require('./utils.js');
const { AccountProvider } = require('../test_lib/utils');
const { Event } = require('../test_lib/event_decoder');

contract('PricerRule::remove_acceptance_margin', async () => {
    contract('Negative Tests', async (accounts) => {
        const accountProvider = new AccountProvider(accounts);

        it('Reverts as a non-organization worker is calling.', async () => {
            const {
                organizationWorker,
                pricerRule,
                quoteCurrencyCode,
            } = await PricerRuleUtils.createTokenEconomy(accountProvider);

            await pricerRule.setAcceptanceMargin(
                web3.utils.stringToHex(quoteCurrencyCode),
                11, // acceptance margin
                { from: organizationWorker },
            );

            await Utils.expectRevert(
                pricerRule.removeAcceptanceMargin(
                    web3.utils.stringToHex(quoteCurrencyCode),
                    { from: accountProvider.get() },
                ),
                'Should revert as a non-organization worker is calling.',
                'Only whitelisted workers are allowed to call this method.',
            );
        });

        it('Reverts as the specified currency is null.', async () => {
            const {
                organizationWorker,
                pricerRule,
            } = await PricerRuleUtils.createTokenEconomy(accountProvider);

            await Utils.expectRevert(
                pricerRule.removeAcceptanceMargin(
                    web3.utils.stringToHex(''),
                    { from: organizationWorker },
                ),
                'Should revert as the specified currency is null.',
                'Pay currency code is null.',
            );
        });
    });

    contract('Events', async (accounts) => {
        const accountProvider = new AccountProvider(accounts);

        it('Emits AcceptanceMarginRemoved.', async () => {
            const {
                organizationWorker,
                pricerRule,
                quoteCurrencyCode,
            } = await PricerRuleUtils.createTokenEconomy(accountProvider);

            const acceptanceMargin = 11;

            await pricerRule.setAcceptanceMargin(
                web3.utils.stringToHex(quoteCurrencyCode),
                acceptanceMargin,
                { from: organizationWorker },
            );

            const response = await pricerRule.removeAcceptanceMargin(
                web3.utils.stringToHex(quoteCurrencyCode),
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
                name: 'AcceptanceMarginRemoved',
                args: {
                    _quoteCurrencyCode: web3.utils.stringToHex(quoteCurrencyCode),
                },
            });
        });
    });

    contract('Storage', async (accounts) => {
        const accountProvider = new AccountProvider(accounts);
        it('Checks that acceptance margin is removed.', async () => {
            const {
                organizationWorker,
                pricerRule,
                quoteCurrencyCode,
                priceOracle,
            } = await PricerRuleUtils.createTokenEconomy(accountProvider);

            const acceptanceMargin = 11;

            await pricerRule.setAcceptanceMargin(
                web3.utils.stringToHex(quoteCurrencyCode),
                acceptanceMargin,
                { from: organizationWorker },
            );

            let actualAcceptanceMargin = await pricerRule.baseCurrencyPriceAcceptanceMargins.call(
                web3.utils.stringToHex(quoteCurrencyCode),
            );

            assert.isOk(
                actualAcceptanceMargin.eqn(acceptanceMargin),
            );

            await pricerRule.removeAcceptanceMargin(
                web3.utils.stringToHex(quoteCurrencyCode),
                { from: organizationWorker },
            );

            actualAcceptanceMargin = await pricerRule.baseCurrencyPriceAcceptanceMargins.call(
                web3.utils.stringToHex(quoteCurrencyCode),
            );

            assert.isOk(
                actualAcceptanceMargin.eqn(0),
            );
        });
    });
});
