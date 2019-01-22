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
const web3 = require('../test_lib/web3.js');
const { AccountProvider } = require('../test_lib/utils.js');

const TokenHolder = artifacts.require('TokenHolder');

contract('TokenHolder::setup', async () => {
    contract('Negative Tests', async (accounts) => {
        const accountProvider = new AccountProvider(accounts);

        it('Reverts if token address is null.', async () => {
            const tokenHolder = await TokenHolder.new();

            const ownerAddress = accountProvider.get();
            const tokenAddress = utils.NULL_ADDRESS;
            const tokenRulesAddress = accountProvider.get();

            await utils.expectRevert(
                tokenHolder.setup(
                    tokenAddress,
                    tokenRulesAddress,
                    ownerAddress,
                ),
                'Should revert as token address is null.',
                'Token contract address is null.',
            );
        });

        it('Reverts if token rules is null.', async () => {
            const tokenHolder = await TokenHolder.new();

            const ownerAddress = accountProvider.get();
            const tokenAddress = accountProvider.get();
            const tokenRulesAddress = utils.NULL_ADDRESS;

            await utils.expectRevert(
                tokenHolder.setup(
                    tokenAddress,
                    tokenRulesAddress,
                    ownerAddress,
                ),
                'Should revert as token rules address is null.',
                'TokenRules contract address is null.',
            );
        });

        it('Reverts if owner address is null.', async () => {
            const tokenHolder = await TokenHolder.new();

            const ownerAddress = utils.NULL_ADDRESS;
            const tokenAddress = accountProvider.get();
            const tokenRulesAddress = accountProvider.get();

            await utils.expectRevert(
                tokenHolder.setup(
                    tokenAddress,
                    tokenRulesAddress,
                    ownerAddress,
                ),
                'Should revert as owner address is null.',
                'Owner address is null.',
            );
        });

        it('Reverts if setup is called second time.', async () => {
            const tokenHolder = await TokenHolder.new();

            const ownerAddress = accountProvider.get();
            const tokenAddress = accountProvider.get();
            const tokenRulesAddress = accountProvider.get();

            await tokenHolder.setup(
                tokenAddress,
                tokenRulesAddress,
                ownerAddress,
            );

            await utils.expectRevert(
                tokenHolder.setup(
                    tokenAddress,
                    tokenRulesAddress,
                    ownerAddress,
                ),
                'Should revert as setup() is called second time.',
                'Contract has been already setup.',
            );

            // Testing with different inputs.
            await utils.expectRevert(
                tokenHolder.setup(
                    accountProvider.get(),
                    accountProvider.get(),
                    accountProvider.get(),
                ),
                'Should revert as setup() is called second time.',
                'Contract has been already setup.',
            );
        });
    });

    contract('Storage', async (accounts) => {
        const accountProvider = new AccountProvider(accounts);

        it('Checks that passed arguments are set correctly.', async () => {
            const tokenHolder = await TokenHolder.new();

            const ownerAddress = accountProvider.get();
            const tokenAddress = accountProvider.get();
            const tokenRulesAddress = accountProvider.get();

            await tokenHolder.setup(
                tokenAddress,
                tokenRulesAddress,
                ownerAddress,
            );

            assert.strictEqual(
                (await tokenHolder.token.call()),
                tokenAddress,
            );

            assert.strictEqual(
                (await tokenHolder.tokenRules.call()),
                tokenRulesAddress,
            );

            assert.strictEqual(
                (await tokenHolder.owner.call()),
                ownerAddress,
            );
        });

        it('Checks storage elements order to assure reserved '
        + 'slot for proxy is valid.', async () => {
            const tokenHolder = await TokenHolder.new();

            const tokenAddress = accountProvider.get();
            const tokenRulesAddress = accountProvider.get();
            const ownerAddress = accountProvider.get();

            await tokenHolder.setup(
                tokenAddress,
                tokenRulesAddress,
                ownerAddress,
            );

            assert.strictEqual(
                (await web3.eth.getStorageAt(tokenHolder.address, 0)),
                '0x00',
            );
        });
    });
});
