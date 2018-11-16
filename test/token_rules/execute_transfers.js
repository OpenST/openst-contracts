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

const BN = require('bn.js');
const utils = require('../test_lib/utils.js');
const { AccountProvider } = require('../test_lib/utils');
const TokenRulesUtils = require('./utils.js');

const PassingConstraint = artifacts.require('TokenRulesPassingGlobalConstraint.sol');
const FailingConstraint = artifacts.require('TokenRulesFailingGlobalConstraint.sol');

async function happyPath(accountProvider) {
    const {
        tokenRules,
        organizationAddress,
        token,
        worker,
    } = await TokenRulesUtils.createTokenEconomy(accountProvider);

    const passingConstraint1 = await PassingConstraint.new();

    await tokenRules.addGlobalConstraint(
        passingConstraint1.address,
        { from: worker },
    );

    const ruleAddress0 = accountProvider.get();
    await tokenRules.registerRule(
        'ruleName0',
        ruleAddress0,
        'ruleAbi0',
        { from: worker },
    );
    await token.setBalance(ruleAddress0, 100);

    const tokenHolder = accountProvider.get();
    const spendingLimit = 100;
    await token.setBalance(tokenHolder, 100);
    await token.approve(
        tokenRules.address,
        spendingLimit,
        { from: tokenHolder },
    );

    await tokenRules.allowTransfers(
        { from: tokenHolder },
    );

    const transferTo0 = accountProvider.get();
    const transferAmount0 = 1;

    const transfersTo = [transferTo0];
    const transfersAmount = [transferAmount0];

    return {
        tokenRules,
        organizationAddress,
        token,
        passingConstraint1,
        tokenHolder,
        ruleAddress0,
        transfersTo,
        transfersAmount,
        worker,
    };
}

contract('TokenRules::executeTransfers', async () => {
    contract('Negative Tests', async (accounts) => {
        const accountProvider = new AccountProvider(accounts);
        it('Reverts if non-registered rule calls.', async () => {
            const {
                tokenRules,
                tokenHolder,
                transfersTo,
                transfersAmount,
            } = await happyPath(accountProvider);

            const nonRegisteredRuleAddress = accountProvider.get();

            await utils.expectRevert(
                tokenRules.executeTransfers(
                    tokenHolder,
                    transfersTo,
                    transfersAmount,
                    {
                        from: nonRegisteredRuleAddress,
                    },
                ),
                'Should revert as non registered rule is calling.',
                'Only registered rule is allowed to call.',
            );
        });

        it('Reverts if "from" account has not allowed transfers.', async () => {
            const {
                tokenRules,
                tokenHolder,
                ruleAddress0,
                transfersTo,
                transfersAmount,
            } = await happyPath(accountProvider);

            await tokenRules.disallowTransfers(
                { from: tokenHolder },
            );

            await utils.expectRevert(
                tokenRules.executeTransfers(
                    tokenHolder,
                    transfersTo,
                    transfersAmount,
                    { from: ruleAddress0 },
                ),
                'Should revert as "from" account has not allowed transfers.',
                'Transfers from the address are not allowed.',
            );
        });

        it('Reverts if transfersTo and transferAmount array lengths are not equal.', async () => {
            const {
                tokenRules,
                tokenHolder,
                ruleAddress0,
            } = await happyPath(accountProvider);

            const transferTo0 = accountProvider.get();
            const transfersTo = [transferTo0];
            const transfersAmount = [];

            await utils.expectRevert(
                tokenRules.executeTransfers(
                    tokenHolder,
                    transfersTo,
                    transfersAmount,
                    { from: ruleAddress0 },
                ),
                'Should revert as transfers "to" and "amount" arrays length '
                + 'are not equal.',
                '\'to\' and \'amount\' transfer arrays\' lengths are not equal.',
            );
        });

        it('Reverts if constraints do not fulfill.', async () => {
            const {
                tokenRules,
                organizationAddress,
                tokenHolder,
                ruleAddress0,
                transfersTo,
                transfersAmount,
                worker,
            } = await happyPath(accountProvider);

            const failingConstraint1 = await FailingConstraint.new();

            await tokenRules.addGlobalConstraint(
                failingConstraint1.address,
                { from: worker },
            );

            await utils.expectRevert(
                tokenRules.executeTransfers(
                    tokenHolder,
                    transfersTo,
                    transfersAmount,
                    { from: ruleAddress0 },
                ),
                'Should revert as one of the constraints will fail.',
                'Constraints not fullfilled.',
            );
        });
    });

    contract('Execution Validity', async (accounts) => {
        const accountProvider = new AccountProvider(accounts);

        it('Checks that token transferFrom function is called.', async () => {
            const {
                tokenRules,
                token,
                tokenHolder,
                ruleAddress0,
                transfersTo,
                transfersAmount,
            } = await happyPath(accountProvider);

            // For test validity perspective array should not be empty.
            assert(transfersTo.length !== 0);

            const tokenHolderInitialBalance = await token.balanceOf(tokenHolder);
            const transfersToInitialBalances = [];
            let transfersAmountSum = new BN(0);
            for (let i = 0; i < transfersTo.length; i += 1) {
                // eslint-disable-next-line no-await-in-loop
                const initialBalance = await token.balanceOf.call(transfersTo[i]);
                transfersToInitialBalances.push(initialBalance);

                transfersAmountSum = transfersAmountSum.add(new BN(transfersAmount[i]));
            }

            // For test validity perspective, we should not fail in this case.
            assert(tokenHolderInitialBalance.gte(transfersAmountSum));

            await tokenRules.executeTransfers(
                tokenHolder,
                transfersTo,
                transfersAmount,
                { from: ruleAddress0 },
            );

            assert.strictEqual(
                (await token.balanceOf(tokenHolder)).cmp(
                    tokenHolderInitialBalance.sub(transfersAmountSum),
                ),
                0,
            );

            for (let i = 0; i < transfersTo.length; i += 1) {
                // eslint-disable-next-line no-await-in-loop
                const balance = await token.balanceOf.call(transfersTo[i]);

                assert.strictEqual(
                    balance.cmp(
                        transfersToInitialBalances[i].add(
                            new BN(transfersAmount[i]),
                        ),
                    ),
                    0,
                );
            }
        });

        it('Checks that at the end TokenRules disallow transfers.', async () => {
            const {
                tokenRules,
                tokenHolder,
                ruleAddress0,
                transfersTo,
                transfersAmount,
            } = await happyPath(accountProvider);

            await tokenRules.allowTransfers(
                { from: tokenHolder },
            );

            await tokenRules.executeTransfers(
                tokenHolder,
                transfersTo,
                transfersAmount,
                { from: ruleAddress0 },
            );

            assert.isNotOk(
                await tokenRules.allowedTransfers.call(tokenHolder),
            );
        });
    });
});
