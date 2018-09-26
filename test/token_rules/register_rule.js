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

const TokenRules = artifacts.require('TokenRules');


contract('TokenRules::registerRule', async () => {
    contract('Negative testing for input parameters:', async (accounts) => {
        it('Only organization can call.', async () => {
            const organization = accounts[0];
            const token = accounts[1];

            const ruleName = 'A';
            const ruleAddress = accounts[2];
            const ruleAbi = `Rule abi of ${ruleName}`;

            const tokenRules = await TokenRules.new(organization, token);

            const nonOrganization = accounts[3];

            await utils.expectRevert(
                tokenRules.registerRule(
                    ruleName,
                    ruleAddress,
                    ruleAbi,
                    {
                        from: nonOrganization,
                    },
                ),
                'Only organization can register rules.',
            );
        });
        it('Empty rule name.', async () => {
            const organization = accounts[0];
            const token = accounts[1];

            const ruleName = '';
            const ruleAddress = accounts[2];
            const ruleAbi = `Rule abi of ${ruleName}`;

            const tokenRules = await TokenRules.new(organization, token);

            await utils.expectRevert(
                tokenRules.registerRule(
                    ruleName,
                    ruleAddress,
                    ruleAbi,
                    {
                        from: organization,
                    },
                ),
                'Rule name can not be empty.',
            );
        });
        it('Rule with the same name.', async () => {
            const organization = accounts[0];
            const token = accounts[1];

            const aRuleName = 'A';
            const aRuleAddress = accounts[2];
            const aRuleAbi = `Rule abi of ${aRuleName}`;

            const bRuleName = aRuleName;
            const bRuleAddress = accounts[3];
            const bRuleAbi = 'Rule abi of B';

            const tokenRules = await TokenRules.new(organization, token);

            await tokenRules.registerRule(
                aRuleName,
                aRuleAddress,
                aRuleAbi,
                {
                    from: organization,
                },
            );

            await utils.expectRevert(
                tokenRules.registerRule(
                    bRuleName,
                    bRuleAddress,
                    bRuleAbi,
                    {
                        from: organization,
                    },
                ),
                'Rule with the same name can not be registered.',
            );
        });
        it('Rule address is null.', async () => {
            const organization = accounts[0];
            const token = accounts[1];

            const ruleName = 'A';
            const ruleAddress = utils.NULL_ADDRESS;
            const ruleAbi = `Rule abi of ${ruleName}`;

            const tokenRules = await TokenRules.new(organization, token);

            await utils.expectRevert(
                tokenRules.registerRule(
                    ruleName,
                    ruleAddress,
                    ruleAbi,
                    {
                        from: organization,
                    },
                ),
                'Rule address can not be null.',
            );
        });
        it('Rule with the same address.', async () => {
            const organization = accounts[0];
            const token = accounts[1];

            const aRuleName = 'A';
            const aRuleAddress = accounts[2];
            const aRuleAbi = `Rule abi of ${aRuleName}`;

            const bRuleName = 'B';
            const bRuleAddress = aRuleAddress;
            const bRuleAbi = `Rule abi of ${bRuleName}`;

            const tokenRules = await TokenRules.new(organization, token);

            await tokenRules.registerRule(
                aRuleName,
                aRuleAddress,
                aRuleAbi,
                {
                    from: organization,
                },
            );

            await utils.expectRevert(
                tokenRules.registerRule(
                    bRuleName,
                    bRuleAddress,
                    bRuleAbi,
                    {
                        from: organization,
                    },
                ),
                'Rule with the same address can not be registered.',
            );
        });
        it('Empty rule ABI.', async () => {
            const organization = accounts[0];
            const token = accounts[1];

            const ruleName = 'A';
            const ruleAddress = accounts[2];
            const ruleAbi = '';

            const tokenRules = await TokenRules.new(organization, token);

            await utils.expectRevert(
                tokenRules.registerRule(
                    ruleName,
                    ruleAddress,
                    ruleAbi,
                    {
                        from: organization,
                    },
                ),
                'Rule with an empty ABI can not be registered.',
            );
        });
    });

    contract('Events', async (accounts) => {
        it('RuleRegistered is emitted.', async () => {
            const organization = accounts[0];
            const token = accounts[1];

            const aRuleName = 'A';
            const aRuleAddress = accounts[2];
            const aRuleAbi = `Rule abi of ${aRuleName}`;

            const tokenRules = await TokenRules.new(organization, token);

            const transactionResponse = await tokenRules.registerRule(
                aRuleName,
                aRuleAddress,
                aRuleAbi,
                {
                    from: organization,
                },
            );

            const events = Event.decodeTransactionResponse(
                transactionResponse,
            );

            assert.strictEqual(
                events.length,
                1,
            );

            Event.assertEqual(events[0], {
                name: 'RuleRegistered',
                args: {
                    _ruleName: aRuleName,
                    _ruleAddress: aRuleAddress,
                },
                logIndex: 0,
            });
        });
    });

    contract('Storage', async (accounts) => {
        it('Registered rule exists in storage.', async () => {
            const organization = accounts[0];
            const token = accounts[1];

            const aRuleName = 'A';
            const aRuleAddress = accounts[2];
            const aRuleAbi = `Rule abi of ${aRuleName}`;

            const tokenRules = await TokenRules.new(organization, token);

            await tokenRules.registerRule(
                aRuleName,
                aRuleAddress,
                aRuleAbi,
                {
                    from: organization,
                },
            );

            const aRuleIndex = 0;

            const rule = await tokenRules.rules.call(aRuleIndex);

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

            assert.isOk(
                await tokenRules.rulesByNameHash.call(
                    web3.utils.keccak256(aRuleName),
                ),
            );

            assert.isOk(
                await tokenRules.rulesByAddress.call(aRuleAddress),
            );
        });
    });
});
