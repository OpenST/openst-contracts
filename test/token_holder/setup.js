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
const { Event } = require('../test_lib/event_decoder');
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
                    [], // session key addresses
                    [], // session keys' spending limits
                    [], // session keys' expiration heights
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
                    [], // session key addresses
                    [], // session keys' spending limits
                    [], // session keys' expiration heights
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
                    [], // session key addresses
                    [], // session keys' spending limits
                    [], // session keys' expiration heights
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
                [], // session key addresses
                [], // session keys' spending limits
                [], // session keys' expiration heights
            );

            await utils.expectRevert(
                tokenHolder.setup(
                    tokenAddress,
                    tokenRulesAddress,
                    ownerAddress,
                    [], // session key addresses
                    [], // session keys' spending limits
                    [], // session keys' expiration heights
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
                    [], // session key addresses
                    [], // session keys' spending limits
                    [], // session keys' expiration heights
                ),
                'Should revert as setup() is called second time.',
                'Contract has been already setup.',
            );
        });

        it('Reverts if session keys arrays have different lengths.', async () => {
            const tokenHolder = await TokenHolder.new();

            const ownerAddress = accountProvider.get();
            const tokenAddress = accountProvider.get();
            const tokenRulesAddress = accountProvider.get();

            const blockNumber = await web3.eth.getBlockNumber();

            await utils.expectRevert(
                tokenHolder.setup(
                    tokenAddress,
                    tokenRulesAddress,
                    ownerAddress,
                    [accountProvider.get()], // session key addresses
                    [1, 2], // session keys' spending limits
                    [blockNumber + 10], // session keys' expiration heights
                ),
                'Should revert as session keys and spending limits arrays lengths are different.',
                'Session keys and spending limits arrays lengths are different.',
            );

            await utils.expectRevert(
                tokenHolder.setup(
                    tokenAddress,
                    tokenRulesAddress,
                    ownerAddress,
                    [accountProvider.get()], // session key addresses
                    [1], // session keys' spending limits
                    [blockNumber + 10, blockNumber + 10], // session keys' expiration heights
                ),
                'Should revert as session keys and expiration heights arrays lengths are different.',
                'Session keys and expiration heights arrays lengths are different.',
            );
        });
    });

    contract('Events', async (accounts) => {
        const accountProvider = new AccountProvider(accounts);

        it('Emits SessionAuthorized event.', async () => {
            const tokenHolder = await TokenHolder.new();

            const blockNumber = await web3.eth.getBlockNumber();

            const ownerAddress = accountProvider.get();
            const tokenAddress = accountProvider.get();
            const tokenRulesAddress = accountProvider.get();

            const sessionKeyAddress1 = accountProvider.get();
            const sessionKeySpendingLimit1 = 11;
            const sessionKeyExpirationHeight1 = blockNumber + 11;

            const sessionKeyAddress2 = accountProvider.get();
            const sessionKeySpendingLimit2 = 22;
            const sessionKeyExpirationHeight2 = blockNumber + 22;

            const sessionKeys = [sessionKeyAddress1, sessionKeyAddress2];
            const sessionKeysSpendingLimits = [
                sessionKeySpendingLimit1, sessionKeySpendingLimit2,
            ];
            const sessionKeysExpirationHeights = [
                sessionKeyExpirationHeight1, sessionKeyExpirationHeight2,
            ];

            const transactionResponse = await tokenHolder.setup(
                tokenAddress,
                tokenRulesAddress,
                ownerAddress,
                sessionKeys,
                sessionKeysSpendingLimits,
                sessionKeysExpirationHeights,
            );

            const events = Event.decodeTransactionResponse(
                transactionResponse,
            );

            assert.strictEqual(
                events.length,
                2,
            );

            Event.assertEqual(events[0], {
                name: 'SessionAuthorized',
                args: {
                    _sessionKey: sessionKeyAddress1,
                },
            });

            Event.assertEqual(events[1], {
                name: 'SessionAuthorized',
                args: {
                    _sessionKey: sessionKeyAddress2,
                },
            });
        });
    });

    contract('Storage', async (accounts) => {
        const accountProvider = new AccountProvider(accounts);

        it('Checks that passed arguments are set correctly.', async () => {
            const tokenHolder = await TokenHolder.new();

            const blockNumber = await web3.eth.getBlockNumber();

            const ownerAddress = accountProvider.get();
            const tokenAddress = accountProvider.get();
            const tokenRulesAddress = accountProvider.get();

            const sessionKeyAddress1 = accountProvider.get();
            const sessionKeySpendingLimit1 = 11;
            const sessionKeyExpirationHeight1 = blockNumber + 11;

            const sessionKeyAddress2 = accountProvider.get();
            const sessionKeySpendingLimit2 = 22;
            const sessionKeyExpirationHeight2 = blockNumber + 22;

            const sessionKeys = [sessionKeyAddress1, sessionKeyAddress2];
            const sessionKeysSpendingLimits = [
                sessionKeySpendingLimit1, sessionKeySpendingLimit2,
            ];
            const sessionKeysExpirationHeights = [
                sessionKeyExpirationHeight1, sessionKeyExpirationHeight2,
            ];

            await tokenHolder.setup(
                tokenAddress,
                tokenRulesAddress,
                ownerAddress,
                sessionKeys,
                sessionKeysSpendingLimits,
                sessionKeysExpirationHeights,
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

            const sessionKeyData1 = await tokenHolder.sessionKeys.call(
                sessionKeyAddress1,
            );

            assert.isOk(
                sessionKeyData1.spendingLimit.eqn(sessionKeySpendingLimit1),
            );

            assert.isOk(
                sessionKeyData1.expirationHeight.eqn(sessionKeyExpirationHeight1),
            );

            assert.isOk(
                sessionKeyData1.nonce.eqn(0),
            );

            assert.isOk(
                sessionKeyData1.status.eqn(1), // AUTHORIZED == 1
            );

            const sessionKeyData2 = await tokenHolder.sessionKeys.call(
                sessionKeyAddress2,
            );

            assert.isOk(
                sessionKeyData2.spendingLimit.eqn(sessionKeySpendingLimit2),
            );

            assert.isOk(
                sessionKeyData2.expirationHeight.eqn(sessionKeyExpirationHeight2),
            );

            assert.isOk(
                sessionKeyData2.nonce.eqn(0),
            );

            assert.isOk(
                sessionKeyData2.status.eqn(1), // AUTHORIZED == 1
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
                [], // session key addresses
                [], // session keys' spending limits
                [], // session keys' expiration heights
            );

            assert.strictEqual(
                (await web3.eth.getStorageAt(tokenHolder.address, 0)),
                '0x00',
            );
        });
    });
});
