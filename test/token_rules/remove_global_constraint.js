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

const utils = require('../test_lib/utils.js');
const { Event } = require('../test_lib/event_decoder');
const { AccountProvider } = require('../test_lib/utils');
const TokenRulesUtils = require('./utils.js');

async function prepareTokenRules(accountProvider) {
    const {
        tokenRules,
        organizationAddress,
    } = await TokenRulesUtils.createTokenEconomy(accountProvider);

    const constraintAddress0 = accountProvider.get();

    await tokenRules.addGlobalConstraint(
        constraintAddress0,
        { from: organizationAddress },
    );

    return {
        tokenRules,
        organizationAddress,
        constraintAddress0,
    };
}

contract('TokenRules::removeGlobalConstraint', async () => {
    contract('Negative Tests', async (accounts) => {
        const accountProvider = new AccountProvider(accounts);

        it('Reverts if non-organization address is removing constraint.', async () => {
            const {
                tokenRules,
                constraintAddress0,
            } = await prepareTokenRules(accountProvider);

            const nonOrganizationAddress = accountProvider.get();

            await utils.expectRevert(
                tokenRules.removeGlobalConstraint(
                    constraintAddress0,
                    { from: nonOrganizationAddress },
                ),
                'Should revert as non organization address calls.',
                'Only organization is allowed to call.',
            );
        });

        it('Reverts if constraint to remove does not exist.', async () => {
            const {
                tokenRules,
                organizationAddress,
            } = await prepareTokenRules(accountProvider);

            const nonExistingConstraintAddress = accountProvider.get();

            await utils.expectRevert(
                tokenRules.removeGlobalConstraint(
                    nonExistingConstraintAddress,
                    { from: organizationAddress },
                ),
                'Should revert as constraint to remove does not exist.',
                'Constraint to remove does not exist.',
            );
        });
    });

    contract('Events', async (accounts) => {
        const accountProvider = new AccountProvider(accounts);

        it('Emitts GlobalConstraintRemoved on removing global constraint.', async () => {
            const {
                tokenRules,
                organizationAddress,
                constraintAddress0,
            } = await prepareTokenRules(accountProvider);

            const transactionResponse = await tokenRules.removeGlobalConstraint(
                constraintAddress0,
                { from: organizationAddress },
            );

            const events = Event.decodeTransactionResponse(
                transactionResponse,
            );

            assert.strictEqual(
                events.length,
                1,
            );

            Event.assertEqual(events[0], {
                name: 'GlobalConstraintRemoved',
                args: {
                    _globalConstraintAddress: constraintAddress0,
                },
            });
        });
    });

    contract('Storage', async (accounts) => {
        const accountProvider = new AccountProvider(accounts);

        it('Checks that constraint does not exist after removing.', async () => {
            const {
                tokenRules,
                organizationAddress,
                constraintAddress0,
            } = await prepareTokenRules(accountProvider);

            assert.isOk(
                await TokenRulesUtils.constraintExists(
                    tokenRules, constraintAddress0,
                ),
            );

            await tokenRules.removeGlobalConstraint(
                constraintAddress0,
                { from: organizationAddress },
            );

            assert.isNotOk(
                await TokenRulesUtils.constraintExists(
                    tokenRules, organizationAddress,
                ),
            );
        });
    });
});
