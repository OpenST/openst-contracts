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

const TokenRules = artifacts.require('TokenRules');

contract('TokenRules::constructor', async () => {
    contract('Negative Tests', async (accounts) => {
        const accountProvider = new AccountProvider(accounts);

        it('Reverts if organization address is null.', async () => {
            const organization = utils.NULL_ADDRESS;
            const token = accountProvider.get();

            await utils.expectRevert(
                TokenRules.new(organization, token),
                'Should revert as organization address is null.',
            );
        });
        it('Reverts if token is null.', async () => {
            const organization = accountProvider.get();
            const token = utils.NULL_ADDRESS;

            await utils.expectRevert(
                TokenRules.new(organization, token),
                'Should revert as token is null.',
            );
        });
    });

    contract('Storage', async (accounts) => {
        const accountProvider = new AccountProvider(accounts);

        it('Checks that passed arguments are set correctly.', async () => {
            const organization = accountProvider.get();
            const token = accountProvider.get();

            const tokenRules = await TokenRules.new(organization, token);

            assert.strictEqual(
                (await tokenRules.organization.call()),
                organization,
            );

            assert.strictEqual(
                (await tokenRules.token.call()),
                token,
            );
        });
    });
});
