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

const BN = require('bn.js');
const web3 = require('../test_lib/web3.js');
const utils = require('../test_lib/utils.js');
const { Event } = require('../test_lib/event_decoder');
const { AccountProvider } = require('../test_lib/utils.js');
const { MultiSigWalletUtils } = require('./utils.js');

function generateAddWalletData(wallet) {
    return web3.eth.abi.encodeFunctionCall(
        {
            name: 'addWallet',
            type: 'function',
            inputs: [{
                type: 'address',
                name: '',
            }],
        },
        [wallet],
    );
}

contract('MultiSigWallet::submitAddWallet', async () => {
    contract('Negative Tests', async (accounts) => {
        const accountProvider = new AccountProvider(accounts);

        it('Reverts if non-registered wallet calls.', async () => {
            const helper = await new MultiSigWalletUtils(
                { accountProvider, walletCount: 1, required: 1 },
            );

            await utils.expectRevert(
                helper.multisig().submitAddWallet(
                    accountProvider.get(),
                    { from: accountProvider.get() },
                ),
                'Should revert as non-registered wallet calls.',
                'Only wallet is allowed to call.',
            );
        });

        it('Reverts if a null wallet is submitted for addition.', async () => {
            const helper = await new MultiSigWalletUtils(
                { accountProvider, walletCount: 1, required: 1 },
            );

            await utils.expectRevert(
                helper.multisig().submitAddWallet(
                    utils.NULL_ADDRESS,
                    { from: helper.wallet(0) },
                ),
                'Should revert as the submitted wallet is null.',
                'Wallet address is null.',
            );
        });

        it('Reverts if the submitted wallet already exists.', async () => {
            const helper = await new MultiSigWalletUtils(
                { accountProvider, walletCount: 2, required: 2 },
            );

            await utils.expectRevert(
                helper.multisig().submitAddWallet(
                    helper.wallet(1),
                    { from: helper.wallet(0) },
                ),
                'Should revert as the submitted wallet already exists.',
                'Wallet exists.',
            );
        });
    });

    contract('Events', async (accounts) => {
        const accountProvider = new AccountProvider(accounts);

        it('Emits WalletAdditionSubmitted, TransactionConfirmed '
        + 'TransactionExecutionSucceeded events.', async () => {
            const helper = await new MultiSigWalletUtils(
                { accountProvider, walletCount: 1, required: 1 },
            );

            const walletToAdd = accountProvider.get();
            const transactionResponse = await helper.multisig().submitAddWallet(
                walletToAdd,
                { from: helper.wallet(0) },
            );

            const events = Event.decodeTransactionResponse(
                transactionResponse,
            );

            assert.strictEqual(
                events.length,
                3,
                'As the requirement is 1, transaction would be executed '
            + 'afterwards, hence WalletAdditionSubmitted, '
            + 'TransactionConfirmed and TransactionExecutionSucceeded '
            + 'would be emitted.',
            );


            // The first emitted event should be 'WalletAdditionSubmitted'.
            Event.assertEqual(events[0], {
                name: 'WalletAdditionSubmitted',
                args: {
                    _transactionID: new BN(0),
                    _wallet: walletToAdd,
                },
            });

            // The second emitted event should be 'TransactionConfirmed',
            // because the wallet that submitted a new wallet addition request
            // should confirm it afterwards in the same call.
            Event.assertEqual(events[1], {
                name: 'TransactionConfirmed',
                args: {
                    _transactionID: new BN(0),
                    _wallet: helper.wallet(0),
                },
            });

            // The third emitted event should be
            // 'TransactionExecutionSucceeded', because of the setup
            // 1-wallet-1-requirement.
            Event.assertEqual(events[2], {
                name: 'TransactionExecutionSucceeded',
                args: {
                    _transactionID: new BN(0),
                },
            });
        });

        it('Emits WalletAdditionSubmitted and TransactionConfirmed.', async () => {
            const helper = await new MultiSigWalletUtils(
                { accountProvider, walletCount: 2, required: 2 },
            );

            const walletToAdd = accountProvider.get();
            const transactionResponse = await helper.multisig().submitAddWallet(
                walletToAdd,
                { from: helper.wallet(0) },
            );

            const events = Event.decodeTransactionResponse(
                transactionResponse,
            );

            assert.strictEqual(
                events.length,
                2,
                'As the requirement is 2, transaction would not be executed '
            + 'afterwards, hence WalletAdditionSubmitted and '
            + 'TransactionConfirmed would be only emitted.',
            );


            // The first emitted event should be 'WalletAdditionSubmitted'.
            Event.assertEqual(events[0], {
                name: 'WalletAdditionSubmitted',
                args: {
                    _transactionID: new BN(0),
                    _wallet: walletToAdd,
                },
            });

            // The second emitted event should be 'TransactionConfirmed',
            // because the wallet that submitted a new wallet addition request
            // should confirm it afterwards in the same call.
            Event.assertEqual(events[1], {
                name: 'TransactionConfirmed',
                args: {
                    _transactionID: new BN(0),
                    _wallet: helper.wallet(0),
                },
            });
        });
    });

    contract('Storage', async (accounts) => {
        const accountProvider = new AccountProvider(accounts);

        it('Checks state in case of 1-wallet-1-required.', async () => {
            const helper = await new MultiSigWalletUtils(
                { accountProvider, walletCount: 1, required: 1 },
            );

            const walletToAdd = accountProvider.get();
            const transactionID = await helper.submitAddWallet(
                walletToAdd, 0,
            );

            assert.isOk(
                await helper.multisig().isWallet.call(walletToAdd),
                'Newly submitted wallet would be added because of '
                + '1-wallet-1-required condition.',
            );

            assert.strictEqual(
                await helper.multisig().wallets.call(0),
                helper.wallet(0),
            );

            assert.strictEqual(
                await helper.multisig().wallets.call(1),
                walletToAdd,
            );

            assert.isOk(
                (await helper.multisig().transactionCount.call()).eqn(1),
                'Transaction count should be increased by one.',
            );

            assert.isOk(
                await helper.multisig().confirmations.call(
                    transactionID, helper.wallet(0),
                ),
            );

            const transaction = await helper.multisig().transactions.call(transactionID);

            assert.strictEqual(
                transaction.destination,
                helper.multisig().address,
            );

            assert.strictEqual(
                transaction.data,
                generateAddWalletData(walletToAdd),
            );

            assert.isOk(
                transaction.executed,
            );
        });

        it('Checks state in case of 2-wallets-2-required.', async () => {
            const helper = await new MultiSigWalletUtils(
                { accountProvider, walletCount: 2, required: 2 },
            );

            const walletToAdd = accountProvider.get();
            const transactionID = await helper.submitAddWallet(
                walletToAdd, 0,
            );

            assert.isNotOk(
                await helper.multisig().isWallet.call(walletToAdd),
                'Newly submitted wallet would *not* be added because of '
                + '2-wallet-1-required condition.',
            );

            assert.strictEqual(
                await helper.multisig().wallets.call(0),
                helper.wallet(0),
            );

            assert.strictEqual(
                await helper.multisig().wallets.call(1),
                helper.wallet(1),
            );

            assert.isOk(
                (await helper.multisig().transactionCount.call()).eqn(1),
                'Transaction count should be increased by one.',
            );

            assert.isOk(
                await helper.multisig().confirmations.call(
                    transactionID, helper.wallet(0),
                ),
            );

            const transaction = await helper.multisig().transactions.call(transactionID);

            assert.strictEqual(
                transaction.destination,
                helper.multisig().address,
            );

            assert.strictEqual(
                transaction.data,
                generateAddWalletData(walletToAdd),
            );

            assert.isNotOk(
                transaction.executed,
            );
        });
    });
});
