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

const TokenHolder = artifacts.require('TokenHolder');

contract('TokenHolder::constructor', async () => {
    contract('Negative Tests', async (accounts) => {
        const accountProvider = new AccountProvider(accounts);

        it('Reverts if token address is null.', async () => {
            const required = 1;
            const registeredWallet0 = accountProvider.get();

            const wallets = [registeredWallet0];

            const tokenAddress = utils.NULL_ADDRESS;
            const tokenRulesAddress = accountProvider.get();

            await utils.expectRevert(
                TokenHolder.new(
                    tokenAddress,
                    tokenRulesAddress,
                    wallets,
                    required,
                ),
                'Should revert as token address is null.',
                'Token contract address is null.',
            );
        });

        it('Reverts if token rules is null.', async () => {
            const required = 1;
            const registeredWallet0 = accountProvider.get();

            const wallets = [registeredWallet0];

            const tokenAddress = accountProvider.get();
            const tokenRulesAddress = utils.NULL_ADDRESS;

            await utils.expectRevert(
                TokenHolder.new(
                    tokenAddress,
                    tokenRulesAddress,
                    wallets,
                    required,
                ),
                'Should revert as token rules address is null.',
                'TokenRules contract address is null.',
            );
        });
    });

    contract('Storage', async (accounts) => {
        const accountProvider = new AccountProvider(accounts);

        it('Checks that passed arguments are set correctly.', async () => {
            const required = 1;
            const registeredWallet0 = accountProvider.get();

            const wallets = [registeredWallet0];

            const tokenAddress = accountProvider.get();
            const tokenRulesAddress = accountProvider.get();

            const tokenHolder = await TokenHolder.new(
                tokenAddress,
                tokenRulesAddress,
                wallets,
                required,
            );

            assert.strictEqual(
                (await tokenHolder.brandedToken.call()),
                tokenAddress,
            );

            assert.strictEqual(
                (await tokenHolder.tokenRules.call()),
                tokenRulesAddress,
            );
        });
    });
});
