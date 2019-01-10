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
const utils = require('../test_lib/utils.js');
const { Event } = require('../test_lib/event_decoder');
const { AccountProvider } = require('../test_lib/utils');
const TokenRulesUtils = require('./utils.js');


contract('TokenRules::registerRule', async () => {
    contract('Negative Tests', async (accounts) => {
        const accountProvider = new AccountProvider(accounts);

        it('Reverts if non organizationWorker address calls.', async () => {
            const {
                tokenRules,
            } = await TokenRulesUtils.createTokenEconomy(accountProvider);

            const ruleName = 'A';
            const ruleAddress = accountProvider.get();
            const ruleAbi = `Rule abi of ${ruleName}`;

            const nonWorkerAddress = accountProvider.get();

            await utils.expectRevert(
                tokenRules.registerRule(
                    ruleName,
                    ruleAddress,
                    ruleAbi,
                    { from: nonWorkerAddress },
                ),
                'Should revert as non worker address calls.',
                'Only whitelisted workers are allowed to call this method.',
            );
        });
        it('Reverts if rule name is empty.', async () => {
            const {
                tokenRules,
                organizationWorker,
            } = await TokenRulesUtils.createTokenEconomy(accountProvider);

            const ruleName = '';
            const ruleAddress = accountProvider.get();
            const ruleAbi = `Rule abi of ${ruleName}`;

            await utils.expectRevert(
                tokenRules.registerRule(
                    ruleName,
                    ruleAddress,
                    ruleAbi,
                    { from: organizationWorker },
                ),
                'Should revert as rule name is empty.',
                'Rule name is empty.',
            );
        });
        it('Reverts if a rule with the same name already registered.', async () => {
            const {
                tokenRules,
                organizationWorker,
            } = await TokenRulesUtils.createTokenEconomy(accountProvider);

            const aRuleName = 'A';
            const aRuleAddress = accountProvider.get();
            const aRuleAbi = `Rule abi of ${aRuleName}`;

            const bRuleName = aRuleName;
            const bRuleAddress = accountProvider.get();
            const bRuleAbi = 'Rule abi of B';

            await tokenRules.registerRule(
                aRuleName,
                aRuleAddress,
                aRuleAbi,
                { from: organizationWorker },
            );

            await utils.expectRevert(
                tokenRules.registerRule(
                    bRuleName,
                    bRuleAddress,
                    bRuleAbi,
                    { from: organizationWorker },
                ),
                'Should revert as a rule with the same name already registered.',
                'Rule with the specified name already exists.',
            );
        });
        it('Reverts if rule address is null.', async () => {
            const {
                tokenRules,
                organizationWorker,
            } = await TokenRulesUtils.createTokenEconomy(accountProvider);

            const ruleName = 'A';
            const ruleAddress = utils.NULL_ADDRESS;
            const ruleAbi = `Rule abi of ${ruleName}`;

            await utils.expectRevert(
                tokenRules.registerRule(
                    ruleName,
                    ruleAddress,
                    ruleAbi,
                    { from: organizationWorker },
                ),
                'Should revert as rule address is null.',
                'Rule address is null.',
            );
        });

        it('Reverts if rule with the same address already registered.', async () => {
            const {
                tokenRules,
                organizationWorker,
            } = await TokenRulesUtils.createTokenEconomy(accountProvider);

            const aRuleName = 'A';
            const aRuleAddress = accountProvider.get();
            const aRuleAbi = `Rule abi of ${aRuleName}`;

            const bRuleName = 'B';
            const bRuleAddress = aRuleAddress;
            const bRuleAbi = `Rule abi of ${bRuleName}`;

            await tokenRules.registerRule(
                aRuleName,
                aRuleAddress,
                aRuleAbi,
                { from: organizationWorker },
            );

            await utils.expectRevert(
                tokenRules.registerRule(
                    bRuleName,
                    bRuleAddress,
                    bRuleAbi,
                    { from: organizationWorker },
                ),
                'Should revert as rule with the specified address already registered.',
                'Rule with the specified address already exists.',
            );
        });

        it('Reverts if rule ABI is empty.', async () => {
            const {
                tokenRules,
                organizationWorker,
            } = await TokenRulesUtils.createTokenEconomy(accountProvider);

            const ruleName = 'A';
            const ruleAddress = accountProvider.get();
            const ruleAbi = '';

            await utils.expectRevert(
                tokenRules.registerRule(
                    ruleName,
                    ruleAddress,
                    ruleAbi,
                    { from: organizationWorker },
                ),
                'Should revert as rule ABI is empty.',
                'Rule ABI is empty.',
            );
        });
    });

    contract('Events', async (accounts) => {
        const accountProvider = new AccountProvider(accounts);

        it('Emits RuleRegistered event on registering rule.', async () => {
            const {
                tokenRules,
                organizationWorker,
            } = await TokenRulesUtils.createTokenEconomy(accountProvider);

            const aRuleName = 'A';
            const aRuleAddress = accountProvider.get();
            const aRuleAbi = `Rule abi of ${aRuleName}`;

            const transactionResponse = await tokenRules.registerRule(
                aRuleName,
                aRuleAddress,
                aRuleAbi,
                { from: organizationWorker },
            );

            const events = Event.decodeTransactionResponse(
                transactionResponse,
            );

            assert.strictEqual(
                events.length,
                1,
                'Only RuleRegistered event should be emitted.',
            );

            Event.assertEqual(events[0], {
                name: 'RuleRegistered',
                args: {
                    _ruleName: aRuleName,
                    _ruleAddress: aRuleAddress,
                },
            });
        });
    });

    contract('Storage', async (accounts) => {
        const accountProvider = new AccountProvider(accounts);

        it('Checks that rule exists after registration.', async () => {
            const {
                tokenRules,
                organizationWorker,
            } = await TokenRulesUtils.createTokenEconomy(accountProvider);

            const aRuleName = 'A';
            const aRuleAddress = accountProvider.get();
            const aRuleAbi = `Rule abi of ${aRuleName}`;

            await tokenRules.registerRule(
                aRuleName,
                aRuleAddress,
                aRuleAbi,
                { from: organizationWorker },
            );

            const ruleIndexByAddress = await tokenRules.rulesByAddress.call(
                aRuleAddress,
            );
            const ruleIndexByNameHash = await tokenRules.rulesByNameHash.call(
                web3.utils.soliditySha3(aRuleName),
            );

            assert.isOk(
                ruleIndexByAddress.exists,
            );

            assert.isOk(
                ruleIndexByNameHash.exists,
            );

            assert.strictEqual(
                ruleIndexByAddress.index.cmp(ruleIndexByNameHash.index),
                0,
            );

            const rule = await tokenRules.rules.call(ruleIndexByAddress.index);

            assert.strictEqual(
                rule.ruleName,
                aRuleName,
            );

            assert.strictEqual(
                rule.ruleAddress,
                aRuleAddress,
            );

            assert.strictEqual(
                rule.ruleAbi,
                aRuleAbi,
            );
        });
    });
});
