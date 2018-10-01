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
const { AccountProvider } = require('../test_lib/utils');
const TokenRulesUtils = require('./utils.js');

const PassingConstraint = artifacts.require('TokenRulesPassingGlobalConstraint.sol');
const FailingConstraint = artifacts.require('TokenRulesFailingGlobalConstraint.sol');


contract('TokenRules::checkGlobalConstraints', async () => {
    contract('Negative Tests', async (accounts) => {
        const accountProvider = new AccountProvider(accounts);

        it('Reverts if transfersTo and transfersAmount array lengths are not equal.', async () => {
            const {
                tokenRules,
                organizationAddress,
            } = await TokenRulesUtils.createTokenRules(accountProvider);

            const transferTo0 = accountProvider.get();
            const transfersTo = [transferTo0];
            const transfersAmount = [];

            await utils.expectRevert(
                tokenRules.checkGlobalConstraints.call(
                    accountProvider.get(),
                    transfersTo,
                    transfersAmount,
                    { from: organizationAddress },
                ),
                'Should revert as transfers "to" and "amount" arrays length '
                + 'are not equal.',
                '\'to\' and \'amount\' transfer arrays\' lengths are not equal',
            );
        });
    });
    contract('Checking Constraints', async (accounts) => {
        const accountProvider = new AccountProvider(accounts);

        it('Passes if 2 registered constraints are passing.', async () => {
            const {
                tokenRules,
                organizationAddress,
            } = await TokenRulesUtils.createTokenRules(accountProvider);

            const transferTo0 = accountProvider.get();
            const transfersTo = [transferTo0];
            const transfersAmount = [10];

            const passingConstraint1 = await PassingConstraint.new();
            const passingConstraint2 = await PassingConstraint.new();

            await tokenRules.addGlobalConstraint(
                passingConstraint1.address,
                { from: organizationAddress },
            );

            await tokenRules.addGlobalConstraint(
                passingConstraint2.address,
                { from: organizationAddress },
            );

            const status = await tokenRules.checkGlobalConstraints.call(
                accountProvider.get(),
                transfersTo,
                transfersAmount,
                { from: organizationAddress },
            );

            assert.isOk(
                status,
                'Should pass, as two registered constraints are passing.',
            );
        });

        it('Fails if there is 1 passing and 1 failing constraint.', async () => {
            const {
                tokenRules,
                organizationAddress,
            } = await TokenRulesUtils.createTokenRules(accountProvider);

            const transferTo0 = accountProvider.get();
            const transfersTo = [transferTo0];
            const transfersAmount = [10];

            const passingConstraint1 = await PassingConstraint.new();
            const failingConstraint1 = await FailingConstraint.new();

            await tokenRules.addGlobalConstraint(
                passingConstraint1.address,
                { from: organizationAddress },
            );

            await tokenRules.addGlobalConstraint(
                failingConstraint1.address,
                { from: organizationAddress },
            );

            const status = await tokenRules.checkGlobalConstraints.call(
                accountProvider.get(),
                transfersTo,
                transfersAmount,
                { from: organizationAddress },
            );

            assert.isNotOk(
                status,
                'Should fail, as there is 1 failing constraint and 1 passing.',
            );
        });
    });
});
