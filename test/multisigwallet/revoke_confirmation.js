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
// Test: MultiSigWallet::revokeConfirmation
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const BN = require('bn.js');
const utils = require('../test_lib/utils.js');
const { Event } = require('../test_lib/event_decoder.js');
const { AccountProvider } = require('../test_lib/utils.js');
const { MultiSigWalletUtils } = require('./utils.js');

contract('MultiSigWallet::revokeConfirmation', async () => {
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
                helper.multisig().revokeConfirmation(
                    transactionID,
                    {
                        from: accountProvider.get(),
                    },
                ),
                'Should revert as non-registered wallet calls.',
                'Only wallet is allowed to call.',
            );
        });

        it('Reverts if transaction ID does not exist.', async () => {
            const helper = await new MultiSigWalletUtils(
                { accountProvider, walletCount: 1, required: 1 },
            );

            const nonExistingTransactionID = 11;

            await utils.expectRevert(
                helper.multisig().revokeConfirmation(
                    nonExistingTransactionID,
                    { from: helper.wallet(0) },
                ),
                'Should revert as transaction ID does not exist.',
                'Transaction does not exist.',
            );
        });

        it('Reverts if revocation request was not confirmed by caller wallet.', async () => {
            const helper = await new MultiSigWalletUtils(
                { accountProvider, walletCount: 2, required: 2 },
            );

            const transactionID = await helper.submitAddWallet(
                accountProvider.get(), 0,
            );

            await utils.expectRevert(
                helper.multisig().revokeConfirmation(
                    transactionID,
                    { from: helper.wallet(1) },
                ),
                'Should revert as caller wallet did not confirm the transaction.',
                'Transaction is not confirmed by the wallet.',
            );
        });

        it('Reverts if revocation is requested for already executed transaction.', async () => {
            const helper = await new MultiSigWalletUtils(
                { accountProvider, walletCount: 1, required: 1 },
            );

            const transactionID = await helper.submitAddWallet(
                accountProvider.get(), 0,
            );

            await utils.expectRevert(
                helper.multisig().revokeConfirmation(
                    transactionID,
                    { from: helper.wallet(0) },
                ),
            );
        });
    });

    contract('Events', async (accounts) => {
        const accountProvider = new AccountProvider(accounts);

        it('Emits TransactionConfirmationRevoked on successfull revocation.', async () => {
            const helper = await new MultiSigWalletUtils(
                { accountProvider, walletCount: 2, required: 2 },
            );

            const transactionID = await helper.submitAddWallet(
                accountProvider.get(), 0,
            );

            const transactionResponse = await helper.multisig().revokeConfirmation(
                transactionID,
                { from: helper.wallet(0) },
            );

            const events = Event.decodeTransactionResponse(
                transactionResponse,
            );

            assert.strictEqual(
                events.length,
                1,
            );

            // The first emitted event should be 'TransactionConfirmationRevoked'.
            Event.assertEqual(events[0], {
                name: 'TransactionConfirmationRevoked',
                args: {
                    _transactionID: new BN(0),
                    _wallet: helper.wallet(0),
                },
            });
        });
    });

    contract('Storage', async (accounts) => {
        const accountProvider = new AccountProvider(accounts);

        it('Checks that wallet confirmation flag is cleared.', async () => {
            const helper = await new MultiSigWalletUtils(
                { accountProvider, walletCount: 2, required: 2 },
            );

            const transactionID = await helper.submitAddWallet(
                accountProvider.get(), 0,
            );

            assert.isOk(
                await helper.multisig().confirmations(
                    transactionID, helper.wallet(0),
                ),
            );

            await helper.multisig().revokeConfirmation(
                transactionID,
                { from: helper.wallet(0) },
            );

            assert.isNotOk(
                await helper.multisig().confirmations(
                    transactionID, helper.wallet(0),
                ),
            );
        });
    });
});
