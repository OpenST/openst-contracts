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

function generateReplaceWalletData(oldWallet, newWallet) {
    return web3.eth.abi.encodeFunctionCall(
        {
            name: 'replaceWallet',
            type: 'function',
            inputs: [
                {
                    type: 'address',
                    name: '',
                },
                {
                    type: 'address',
                    name: '',
                }],
        },
        [oldWallet, newWallet],
    );
}

contract('MultiSigWallet::submitReplaceWallet', async () => {
    contract('Negative Tests', async (accounts) => {
        const accountProvider = new AccountProvider(accounts);

        it('Reverts if non-registered wallet calls.', async () => {
            const helper = await new MultiSigWalletUtils(
                { accountProvider, walletCount: 2, required: 1 },
            );

            await utils.expectRevert(
                helper.multisig().submitReplaceWallet(
                    helper.wallet(1),
                    accountProvider.get(),
                    { from: accountProvider.get() },
                ),
                'Should revert as non-registered wallet calls.',
                'Only wallet is allowed to call.',
            );
        });

        it('Reverts if old wallet to replace does not exist.', async () => {
            const helper = await new MultiSigWalletUtils(
                { accountProvider, walletCount: 2, required: 1 },
            );

            await utils.expectRevert(
                helper.multisig().submitReplaceWallet(
                    accountProvider.get(),
                    accountProvider.get(),
                    { from: helper.wallet(0) },
                ),
                'Should revert as old wallet to replace does not exist.',
                'Wallet does not exist.',
            );
        });

        it('Reverts if new wallet to add is null.', async () => {
            const helper = await new MultiSigWalletUtils(
                { accountProvider, walletCount: 2, required: 1 },
            );

            await utils.expectRevert(
                helper.multisig().submitReplaceWallet(
                    helper.wallet(1),
                    utils.NULL_ADDRESS,
                    { from: helper.wallet(0) },
                ),
                'Should revert as new wallet to add is null.',
                'Wallet address is null.',
            );
        });

        it('Reverts if new wallet to add already exists.', async () => {
            const helper = await new MultiSigWalletUtils(
                { accountProvider, walletCount: 2, required: 1 },
            );

            await utils.expectRevert(
                helper.multisig().submitReplaceWallet(
                    helper.wallet(1),
                    helper.wallet(1),
                    { from: helper.wallet(0) },
                ),
                'Should revert as new wallet to add already exists.',
                'Wallet exists.',
            );
        });
    });

    contract('Events', async (accounts) => {
        const accountProvider = new AccountProvider(accounts);

        it('Emits WalletReplacementSubmitted, TransactionConfirmed '
        + 'TransactionExecutionSucceeded events.', async () => {
            const helper = await new MultiSigWalletUtils(
                { accountProvider, walletCount: 2, required: 1 },
            );

            const newWalletForReplacement = accountProvider.get();
            const transactionResponse = await helper.multisig().submitReplaceWallet(
                helper.wallet(1),
                newWalletForReplacement,
                { from: helper.wallet(0) },
            );

            const events = Event.decodeTransactionResponse(
                transactionResponse,
            );

            assert.strictEqual(
                events.length,
                3,
                'As requirement is 1, transaction would be executed '
                + 'afterwards, hence WalletReplacementSubmitted, '
                + 'TransactionConfirmed and TransactionExecutionSucceeded '
                + 'would be emitted.',
            );

            // The first emitted event should be 'WalletReplacementSubmitted'.
            Event.assertEqual(events[0], {
                name: 'WalletReplacementSubmitted',
                args: {
                    _transactionID: new BN(0),
                    _oldWallet: helper.wallet(1),
                    _newWallet: newWalletForReplacement,
                },
            });

            // The second emitted event should be 'TransactionConfirmed', as
            // the wallet that submits transaction confirms afterwards.
            Event.assertEqual(events[1], {
                name: 'TransactionConfirmed',
                args: {
                    _transactionID: new BN(0),
                    _wallet: helper.wallet(0),
                },
            });

            // The third emitted event should be 'TransactionExecutionSucceeded'
            // as requirement is 1, hence transaction would be executed
            // afterwards.
            Event.assertEqual(events[2], {
                name: 'TransactionExecutionSucceeded',
                args: {
                    _transactionID: new BN(0),
                },
            });
        });

        it('Emits WalletReplacementSubmitted and TransactionConfirmed.', async () => {
            const helper = await new MultiSigWalletUtils(
                { accountProvider, walletCount: 2, required: 2 },
            );

            const newWalletToReplace = accountProvider.get();
            const transactionResponse = await helper.multisig().submitReplaceWallet(
                helper.wallet(1),
                newWalletToReplace,
                { from: helper.wallet(0) },
            );

            const events = Event.decodeTransactionResponse(
                transactionResponse,
            );

            assert.strictEqual(
                events.length,
                2,
                'As requirement is 2, transaction would not be executed '
                + 'afterwards, hence only WalletReplacementSubmitted and '
                + 'TransactionConfirmed would be emitted.',
            );

            // The first emitted event should be 'WalletReplacementSubmitted'.
            Event.assertEqual(events[0], {
                name: 'WalletReplacementSubmitted',
                args: {
                    _transactionID: new BN(0),
                    _oldWallet: helper.wallet(1),
                    _newWallet: newWalletToReplace,
                },
            });

            // The second emitted event should be 'TransactionConfirmed', as
            // the wallet that submits transaction confirms afterwards.
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

        it('Checks state in case of 2-wallets-1-required.', async () => {
            const helper = await new MultiSigWalletUtils(
                { accountProvider, walletCount: 2, required: 1 },
            );

            const newWalletForReplacement = accountProvider.get();
            const transactionID = await helper.submitReplaceWallet(
                1, newWalletForReplacement, 0,
            );

            assert.isOk(
                await helper.multisig().isWallet.call(newWalletForReplacement),
                'Wallet replacement should happen immediately, because of '
                + '2-wallets-1-required setup.',
            );

            assert.isNotOk(
                await helper.multisig().isWallet.call(helper.wallet(1)),
                'Wallet replacement should happen immediately, because of '
                + '2-wallets-1-required setup.',
            );

            assert.isOk(
                (await helper.multisig().walletCount.call()).eqn(2),
                'Wallet count should not change during replace.',
            );

            assert.strictEqual(
                await helper.multisig().wallets.call(0),
                helper.wallet(0),
            );

            assert.strictEqual(
                await helper.multisig().wallets.call(1),
                newWalletForReplacement,
            );

            assert.isOk(
                (await helper.multisig().required.call()).eqn(1),
                'Required number of confirmation should stay unchanged.',
            );

            assert.isOk(
                (await helper.multisig().transactionCount.call()).eqn(1),
                'Transaction count should be increased by one.',
            );

            assert.strictEqual(
                await helper.multisig().confirmations.call(
                    transactionID, helper.wallet(0),
                ),
                true,
            );

            const transaction = await helper.multisig().transactions.call(transactionID);

            assert.strictEqual(
                transaction.destination,
                helper.multisig().address,
            );

            assert.strictEqual(
                transaction.data,
                generateReplaceWalletData(
                    helper.wallet(1), newWalletForReplacement,
                ),
            );

            assert.strictEqual(
                transaction.executed,
                true,
            );
        });

        it('Checks state in case of 2-wallets-2-required.', async () => {
            const helper = await new MultiSigWalletUtils(
                { accountProvider, walletCount: 2, required: 2 },
            );

            const newWalletForReplacement = accountProvider.get();
            const transactionID = await helper.submitReplaceWallet(
                1, newWalletForReplacement, 0,
            );

            assert.isOk(
                await helper.multisig().isWallet.call(helper.wallet(1)),
                'Wallet replacement should not happen immediately, because of '
                + '2-wallets-2-required setup.',
            );

            assert.isNotOk(
                await helper.multisig().isWallet.call(newWalletForReplacement),
                'Wallet replacement should not happen immediately, because of '
                + '2-wallets-2-required setup.',
            );

            assert.isOk(
                (await helper.multisig().walletCount.call()).eqn(2),
                'Wallet count should not change during replace.',
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
                (await helper.multisig().required.call()).eqn(2),
                'Required number of confirmation should stay unchanged.',
            );

            assert.isOk(
                (await helper.multisig().transactionCount.call()).eqn(1),
                'Transaction count should be increased by one.',
            );

            assert.strictEqual(
                await helper.multisig().confirmations.call(
                    transactionID, helper.wallet(0),
                ),
                true,
            );

            const transaction = await helper.multisig().transactions.call(transactionID);

            assert.strictEqual(
                transaction.destination,
                helper.multisig().address,
            );

            assert.strictEqual(
                transaction.data,
                generateReplaceWalletData(
                    helper.wallet(1), newWalletForReplacement,
                ),
            );

            assert.strictEqual(
                transaction.executed,
                false,
            );
        });
    });
});
