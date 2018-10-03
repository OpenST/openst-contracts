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
//
// ----------------------------------------------------------------------------
// Test: MultiSigWallet::confirmTransaction
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const BN = require('bn.js');
const utils = require('../test_lib/utils.js');
const { Event } = require('../test_lib/event_decoder.js');
const { AccountProvider } = require('../test_lib/utils.js');
const { MultiSigWalletUtils } = require('./utils.js');


contract('MultiSigWallet::confirmTransaction', async () => {
    contract('Negative Tests', async (accounts) => {
        const accountProvider = new AccountProvider(accounts);

        it('Reverts if non-registered wallet calls.', async () => {
            const helper = await new MultiSigWalletUtils(
                { accountProvider, walletCount: 2, required: 2 },
            );

            const transactionID = await helper.submitAddWallet(
                accountProvider.get(), 0,
            );

            await utils.expectRevert(
                helper.multisig().confirmTransaction(
                    transactionID,
                    { from: accountProvider.get() },
                ),
                'Should revert as non-registered wallet calls.',
                'Only wallet is allowed to call.',
            );
        });

        it('Reverts if transaction ID to confirm does not exist.', async () => {
            const helper = await new MultiSigWalletUtils(
                { accountProvider, walletCount: 1, required: 1 },
            );

            const nonExistingTransactionID = 11;

            await utils.expectRevert(
                helper.multisig().confirmTransaction(
                    nonExistingTransactionID,
                    { from: helper.wallet(0) },
                ),
                'Should revert as transaction does not exist.',
                'Transaction does not exist.',
            );
        });

        it('Reverts if the wallet has already confirmed the transaction.', async () => {
            const helper = await new MultiSigWalletUtils(
                { accountProvider, walletCount: 2, required: 2 },
            );

            const transactionID = await helper.submitAddWallet(
                accountProvider.get(), 0,
            );

            await utils.expectRevert(
                helper.multisig().confirmTransaction(
                    transactionID,
                    { from: helper.wallet(0) },
                ),
                'Should revert as wallet has already confirmed the transaction.',
                'Transaction is confirmed by the wallet.',
            );
        });
    });

    contract('Events', async (accounts) => {
        const accountProvider = new AccountProvider(accounts);

        it('Emits TransactionConfirmed once wallet confirms transaction.', async () => {
            const helper = await new MultiSigWalletUtils(
                { accountProvider, walletCount: 3, required: 3 },
            );

            const transactionID = await helper.submitAddWallet(
                accountProvider.get(), 0,
            );

            const transactionResponse = await helper.multisig().confirmTransaction(
                transactionID,
                { from: helper.wallet(1) },
            );

            const events = Event.decodeTransactionResponse(
                transactionResponse,
            );

            assert.strictEqual(
                events.length,
                1,
            );

            // The first emitted event should be 'TransactionConfirmed'.
            Event.assertEqual(events[0], {
                name: 'TransactionConfirmed',
                args: {
                    _transactionID: new BN(transactionID),
                    _wallet: helper.wallet(1),
                },
            });
        });
    });

    contract('Storage', async (accounts) => {
        const accountProvider = new AccountProvider(accounts);

        it('Checks that transaction is confirmed by the wallet after '
            + 'successfull call.', async () => {
            const helper = await new MultiSigWalletUtils(
                { accountProvider, walletCount: 2, required: 2 },
            );

            const transactionID = await helper.submitAddWallet(
                accountProvider.get(), 0,
            );

            assert.isNotOk(
                (await helper.multisig().transactions.call(transactionID)).executed,
                'Transaction should not be confirmed because of '
                    + '2-wallets-2-required setup.',
            );

            await helper.multisig().confirmTransaction(
                transactionID, { from: helper.wallet(1) },
            );

            assert.isOk(
                (await helper.multisig().transactions.call(transactionID)).executed,
                'Transaction should be confirmed because two wallets '
                + 'has confirmed it.',
            );
        });
    });
});
