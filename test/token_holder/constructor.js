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

const TokenHolder = artifacts.require('TokenHolder');

contract('TokenHolder::constructor', async () => {
    contract('Negative testing for input parameters.', async (accounts) => {
        it('Null branded token address.', async () => {
            const required = 1;
            const registeredWallet0 = accounts[0];

            const wallets = [registeredWallet0];

            const brandedTokenAddress = utils.NULL_ADDRESS;
            const tokenRulesAddress = accounts[1];

            await utils.expectRevert(
                TokenHolder.new(
                    brandedTokenAddress,
                    tokenRulesAddress,
                    wallets,
                    required,
                ),
                'Branded token address cannot be null.',
            );
        });

        it('Null token rules address.', async () => {
            const required = 1;
            const registeredWallet0 = accounts[0];

            const wallets = [registeredWallet0];

            const brandedTokenAddress = accounts[1];
            const tokenRulesAddress = utils.NULL_ADDRESS;

            await utils.expectRevert(
                TokenHolder.new(
                    brandedTokenAddress,
                    tokenRulesAddress,
                    wallets,
                    required,
                ),
                'Token rules address cannot be null.',
            );
        });
    });

    contract('Storage', async (accounts) => {
        it('Initializing state variables.', async () => {
            const required = 1;
            const registeredWallet0 = accounts[0];

            const wallets = [registeredWallet0];

            const brandedTokenAddress = accounts[1];
            const tokenRulesAddress = accounts[2];

            const tokenHolder = await TokenHolder.new(
                brandedTokenAddress,
                tokenRulesAddress,
                wallets,
                required,
            );

            assert.strictEqual(
                (await tokenHolder.brandedToken.call()),
                brandedTokenAddress,
            );

            assert.strictEqual(
                (await tokenHolder.tokenRules.call()),
                tokenRulesAddress,
            );
        });
    });
});
