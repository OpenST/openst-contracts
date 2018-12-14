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
const { AccountProvider } = require('../test_lib/utils.js');

const TransferRule = artifacts.require('TransferRule');


contract('TransferRule::constructor', async () => {
    contract('Negative Tests', async () => {
        it('Reverts if TokenRules address is null.', async () => {
            await utils.expectRevert(
                TransferRule.new(utils.NULL_ADDRESS),
                'Should revert as TokenRules address is null.',
                'Token rules address is null.',
            );
        });
    });

    contract('Storage', async (accounts) => {
        const accountProvider = new AccountProvider(accounts);
        it('Checks that passed arguments are set correctly.', async () => {
            const tokenRules = accountProvider.get();

            const rule = await TransferRule.new(tokenRules);

            assert.strictEqual(
                await rule.tokenRules.call(),
                tokenRules,
            );
        });
    });
});
