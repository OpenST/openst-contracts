// Copyright 2019 OpenST Ltd.
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


const Utils = require('../test_lib/utils.js');
const web3 = require('../test_lib/web3.js');
const { Event } = require('../test_lib/event_decoder');
const { AccountProvider } = require('../test_lib/utils.js');

const ProxyContract = artifacts.require('Proxy');
const UserWalletFactory = artifacts.require('UserWalletFactory');
const MasterCopySpy = artifacts.require('MasterCopySpy');
const TokenHolder = artifacts.require('TokenHolder');

function generateMasterCopySpySetupFunctionData(balance) {
    return web3.eth.abi.encodeFunctionCall(
        {
            name: 'setup',
            type: 'function',
            inputs: [
                {
                    type: 'uint256',
                    name: 'balance',
                },
            ],
        },
        [balance],
    );
}

contract('UserWalletFactory::createWallet', async (accounts) => {
    const accountProvider = new AccountProvider(accounts);

    contract('Negative Tests', async () => {
        it('Reverts if gnosis safe\'s master copy address is null.', async () => {
            const userWalletFactory = await UserWalletFactory.new();

            await Utils.expectRevert(
                userWalletFactory.createWallet(
                    Utils.NULL_ADDRESS, // gnosis safe's master copy
                    '0x', // gnosis safe's setup data
                    accountProvider.get(), // token holder's master copy
                    accountProvider.get(), // token
                    accountProvider.get(), // token rules
                    [], // session key addresses
                    [], // session keys' spending limits
                    [], // session keys' expiration heights
                ),
                'Should revert as the master copy address is null.',
                'Master copy address is null.',
            );
        });

        it('Reverts if token holder\'s master copy address is null.', async () => {
            const userWalletFactory = await UserWalletFactory.new();

            await Utils.expectRevert(
                userWalletFactory.createWallet(
                    accountProvider.get(), // gnosis safe's master copy
                    '0x', // gnosis safe's setup data
                    Utils.NULL_ADDRESS, // token holder's master copy
                    accountProvider.get(), // token
                    accountProvider.get(), // token rules
                    [], // session key addresses
                    [], // session keys' spending limits
                    [], // session keys' expiration heights
                ),
                'Should revert as the master copy address is null.',
                'Master copy address is null.',
            );
        });
    });

    contract('User Wallet', async () => {
        it('Checks that gnosis safe\'s proxy constructor with the master '
    + 'copy address is called.', async () => {
            const userWalletFactory = await UserWalletFactory.new();

            const gnosisSafeMasterCopy = accountProvider.get();

            const returnData = await userWalletFactory.createWallet.call(
                gnosisSafeMasterCopy,
                '0x', // gnosis safe's setup data
                accountProvider.get(), // token holder's master copy
                accountProvider.get(), // token
                accountProvider.get(), // token rules
                [], // session key addresses
                [], // session keys' spending limits
                [], // session keys' expiration heights
            );
            await userWalletFactory.createWallet(
                gnosisSafeMasterCopy,
                '0x', // gnosis safe's setup data
                accountProvider.get(), // token holder's master copy
                accountProvider.get(), // token
                accountProvider.get(), // token rules
                [], // session key addresses
                [], // session keys' spending limits
                [], // session keys' expiration heights
            );

            const gnosisSafeProxy = await ProxyContract.at(returnData[0]);

            assert.strictEqual(
                await gnosisSafeProxy.masterCopy.call(),
                gnosisSafeMasterCopy,
            );
        });

        it('Checks that gnosis safe\'s "setup" data is called.', async () => {
            const userWalletFactory = await UserWalletFactory.new();

            const initialBalanceInConstructor = 11;
            const gnosisSafeMasterCopy = await MasterCopySpy.new(initialBalanceInConstructor);

            const initialBalanceInSetupCall = 22;
            const gnosisSafeSetupData = generateMasterCopySpySetupFunctionData(
                initialBalanceInSetupCall,
            );

            const returnData = await userWalletFactory.createWallet.call(
                gnosisSafeMasterCopy.address,
                gnosisSafeSetupData, // gnosis safe's setup data
                accountProvider.get(), // token holder's master copy
                accountProvider.get(), // token
                accountProvider.get(), // token rules
                [], // session key addresses
                [], // session keys' spending limits
                [], // session keys' expiration heights
            );
            await userWalletFactory.createWallet(
                gnosisSafeMasterCopy.address,
                gnosisSafeSetupData, // gnosis safe's setup data
                accountProvider.get(), // token holder's master copy
                accountProvider.get(), // token
                accountProvider.get(), // token rules
                [], // session key addresses
                [], // session keys' spending limits
                [], // session keys' expiration heights
            );

            const gnosisSafeProxy = await MasterCopySpy.at(returnData[0]);

            assert.isOk(
                (await gnosisSafeMasterCopy.remainingBalance.call()).eqn(
                    initialBalanceInConstructor,
                ),
            );

            assert.isOk(
                (await gnosisSafeProxy.remainingBalance.call()).eqn(
                    initialBalanceInSetupCall,
                ),
            );
        });

        it('Checks that token holder\'s proxy constructor with the master '
    + 'copy address is called.', async () => {
            const userWalletFactory = await UserWalletFactory.new();

            const tokenHolderMasterCopy = accountProvider.get();

            const returnData = await userWalletFactory.createWallet.call(
                accountProvider.get(), // gnosis safe's master copy
                '0x', // gnosis safe's setup data
                tokenHolderMasterCopy, // token holder's master copy
                accountProvider.get(), // token
                accountProvider.get(), // token rules
                [], // session key addresses
                [], // session keys' spending limits
                [], // session keys' expiration heights
            );
            await userWalletFactory.createWallet(
                accountProvider.get(), // gnosis safe's master copy
                '0x', // gnosis safe's setup data
                tokenHolderMasterCopy, // token holder's master copy
                accountProvider.get(), // token
                accountProvider.get(), // token rules
                [], // session key addresses
                [], // session keys' spending limits
                [], // session keys' expiration heights
            );

            const tokenHolderProxy = await ProxyContract.at(returnData[1]);

            assert.strictEqual(
                await tokenHolderProxy.masterCopy.call(),
                tokenHolderMasterCopy,
            );
        });

        it('Checks that token holder\'s "setup" data is called.', async () => {
            const userWalletFactory = await UserWalletFactory.new();

            const gnosisSafeMasterCopy = accountProvider.get();

            const tokenHolderMasterCopy = await TokenHolder.new();
            const token = accountProvider.get();
            const tokenRules = accountProvider.get();

            const blockNumber = await web3.eth.getBlockNumber();

            const sessionKeyAddress = accountProvider.get();
            const sessionKeySpendingLimit = 11;
            const sessionKeyExpirationHeight = blockNumber + 11;

            const sessionKeys = [sessionKeyAddress];
            const sessionKeysSpendingLimits = [sessionKeySpendingLimit];
            const sessionKeysExpirationHeights = [sessionKeyExpirationHeight];

            const returnData = await userWalletFactory.createWallet.call(
                gnosisSafeMasterCopy,
                '0x', // gnosis safe's setup data
                tokenHolderMasterCopy.address, // token holder's master copy
                token, // token
                tokenRules, // token rules
                sessionKeys, // session key addresses
                sessionKeysSpendingLimits, // session keys' spending limits
                sessionKeysExpirationHeights, // session keys' expiration heights
            );
            await userWalletFactory.createWallet(
                gnosisSafeMasterCopy,
                '0x', // gnosis safe's setup data
                tokenHolderMasterCopy.address, // token holder's master copy
                token, // token
                tokenRules, // token rules
                sessionKeys, // session key addresses
                sessionKeysSpendingLimits, // session keys' spending limits
                sessionKeysExpirationHeights, // session keys' expiration heights
            );

            const gnosisSafeProxy = returnData[0];
            const tokenHolderProxy = await TokenHolder.at(returnData[1]);

            assert.strictEqual(
                await tokenHolderProxy.token.call(),
                token,
            );

            assert.strictEqual(
                await tokenHolderProxy.tokenRules.call(),
                tokenRules,
            );

            assert.strictEqual(
                await tokenHolderProxy.owner.call(),
                gnosisSafeProxy,
            );

            const sessionKeyData = await tokenHolderProxy.sessionKeys.call(
                sessionKeyAddress,
            );

            assert.isOk(
                sessionKeyData.spendingLimit.eqn(sessionKeySpendingLimit),
            );

            assert.isOk(
                sessionKeyData.expirationHeight.eqn(sessionKeyExpirationHeight),
            );

            assert.isOk(
                sessionKeyData.nonce.eqn(0),
            );

            assert.isOk(
                sessionKeyData.status.eqn(1), // AUTHORIZED == 1
            );
        });
    });

    contract('Events', async () => {
        it('Checks that UserWalletCreated event is emitted on success.', async () => {
            const userWalletFactory = await UserWalletFactory.new();

            const gnosisSafeMasterCopy = accountProvider.get();
            const tokenHolderMasterCopy = accountProvider.get();

            const returnData = await userWalletFactory.createWallet.call(
                gnosisSafeMasterCopy, // gnosis safe's master copy
                '0x', // gnosis safe's setup data
                tokenHolderMasterCopy, // token holder's master copy
                accountProvider.get(), // token
                accountProvider.get(), // token rules
                [], // session key addresses
                [], // session keys' spending limits
                [], // session keys' expiration heights
            );
            const transactionResponse = await userWalletFactory.createWallet(
                gnosisSafeMasterCopy, // gnosis safe's master copy
                '0x', // gnosis safe's setup data
                tokenHolderMasterCopy, // token holder's master copy
                accountProvider.get(), // token
                accountProvider.get(), // token rules
                [], // session key addresses
                [], // session keys' spending limits
                [], // session keys' expiration heights
            );

            const gnosisSafeProxy = returnData[0];
            const tokenHolderProxy = returnData[1];

            const events = Event.decodeTransactionResponse(
                transactionResponse,
            );

            assert.strictEqual(
                events.length,
                1,
            );

            Event.assertEqual(events[0], {
                name: 'UserWalletCreated',
                args: {
                    _gnosisSafeProxy: gnosisSafeProxy,
                    _tokenHolderProxy: tokenHolderProxy,
                },
            });
        });
    });
});
