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

const Utils = require('../test_lib/utils.js');
const { Event } = require('../test_lib/event_decoder');
const { AccountProvider } = require('../test_lib/utils');
const TokenRulesUtils = require('./utils.js');

contract('TokenRules::addGlobalConstraint', async () => {
    contract('Negative Tests', async (accounts) => {
        const accountProvider = new AccountProvider(accounts);

        it('Reverts if non worker address is adding constraint.', async () => {
            const {
                tokenRules,
            } = await TokenRulesUtils.createTokenEconomy(accountProvider);

            const constraintAddress = accountProvider.get();

            const nonWorkerAddress = accountProvider.get();

            await Utils.expectRevert(
                tokenRules.addGlobalConstraint(
                    constraintAddress,
                    { from: nonWorkerAddress },
                ),
                'Should revert as non worker address is adding constraint.',
                'Only whitelisted worker is allowed to call.',
            );
        });

        it('Reverts if null address is added as a constraint.', async () => {
            const {
                tokenRules,
                worker,
            } = await TokenRulesUtils.createTokenEconomy(accountProvider);

            const constraintAddress = Utils.NULL_ADDRESS;

            await Utils.expectRevert(
                tokenRules.addGlobalConstraint(
                    constraintAddress,
                    { from: worker },
                ),
                'Should revert as constraint\'s address to add is null.',
                'Constraint to add is null.',
            );
        });

        it('Reverts if constraint to add already exists.', async () => {
            const {
                tokenRules,
                worker,
            } = await TokenRulesUtils.createTokenEconomy(accountProvider);

            const constraintAddress = accountProvider.get();
            const existingConstraintAddress = constraintAddress;

            await tokenRules.addGlobalConstraint(
                constraintAddress,
                { from: worker },
            );

            await Utils.expectRevert(
                tokenRules.addGlobalConstraint(
                    existingConstraintAddress,
                    { from: worker },
                ),
                'Should revert as constraint to add already exists.',
                'Constraint to add already exists.',
            );
        });
    });

    contract('Events', async (accounts) => {
        const accountProvider = new AccountProvider(accounts);

        it('Emits GlobalConstraintAdded when adding constraint.', async () => {
            const {
                tokenRules,
                worker,
            } = await TokenRulesUtils.createTokenEconomy(accountProvider);

            const constraintAddress = accountProvider.get();

            const transactionResponse = await tokenRules.addGlobalConstraint(
                constraintAddress,
                { from: worker },
            );

            const events = Event.decodeTransactionResponse(
                transactionResponse,
            );

            assert.strictEqual(
                events.length,
                1,
                'Only GlobalConstraintAdded should be emitted.',
            );

            Event.assertEqual(events[0], {
                name: 'GlobalConstraintAdded',
                args: {
                    _globalConstraintAddress: constraintAddress,
                },
            });
        });
    });

    contract('Storage', async (accounts) => {
        const accountProvider = new AccountProvider(accounts);
        it('Checks that constraint exists after adding.', async () => {
            const {
                tokenRules,
                worker,
            } = await TokenRulesUtils.createTokenEconomy(accountProvider);

            const constraintAddress = accountProvider.get();

            await tokenRules.addGlobalConstraint(
                constraintAddress,
                { from: worker },
            );

            assert.isOk(
                await TokenRulesUtils.constraintExists(
                    tokenRules, constraintAddress,
                ),
            );
        });
    });
});
