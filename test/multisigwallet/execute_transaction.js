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
// Test: MultiSigWallet::executeTransaction
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const BN = require('bn.js');
const utils = require('../test_lib/utils.js');
const { Event } = require('../test_lib/event_decoder.js');
const { AccountProvider } = require('../test_lib/utils.js');
const { MultiSigWalletUtils } = require('./utils.js');

const MultiSigWalletDouble = artifacts.require('MultiSigWalletDouble');

contract('MultiSigWallet::executeTransaction', async () => {
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
                helper.multisig().executeTransaction(
                    transactionID,
                    { from: accountProvider.get() },
                ),
                'Should revert as non-registered wallet calls.',
                'Only wallet is allowed to call.',
            );
        });

        it('Reverts if transaction ID does not exist.', async () => {
            const helper = await new MultiSigWalletUtils(
                { accountProvider, walletCount: 2, required: 2 },
            );

            const nonExistingTransactionID = 11;

            await utils.expectRevert(
                helper.multisig().executeTransaction(
                    nonExistingTransactionID,
                    { from: helper.wallet(0) },
                ),
                'Should revert as transaction ID does not exist.',
                'Transaction does not exist.',
            );
        });

        it('Reverts if execution requested by wallet that did not confirmed.', async () => {
            const helper = await new MultiSigWalletUtils(
                { accountProvider, walletCount: 2, required: 2 },
            );

            const transactionID = await helper.submitAddWallet(
                accountProvider.get(), 0,
            );

            await utils.expectRevert(
                helper.multisig().executeTransaction(
                    transactionID,
                    { from: helper.wallet(1) },
                ),
            );
        });

        it('Reverts if the transaction was already executed.', async () => {
            const helper = await new MultiSigWalletUtils(
                { accountProvider, walletCount: 1, required: 1 },
            );

            const transactionID = await helper.submitAddWallet(
                accountProvider.get(), 0,
            );

            await utils.expectRevert(
                helper.multisig().executeTransaction(
                    transactionID,
                    { from: helper.wallet(0) },
                ),
            );
        });
    });

    contract('Events', async (accounts) => {
        const accountProvider = new AccountProvider(accounts);

        it('Emits TransactionExecutionSucceeded on successfull execution.', async () => {
            const required = 1;

            const registeredWallet0 = accountProvider.get();

            const wallets = [registeredWallet0];

            const multisigDouble = await MultiSigWalletDouble.new(
                wallets, required,
            );

            await multisigDouble.makeFooThrow();

            const transactionID = await multisigDouble.submitFoo.call(
                { from: registeredWallet0 },
            );

            await multisigDouble.submitFoo(
                { from: registeredWallet0 },
            );

            await multisigDouble.makeFooNotThrow();
            const transactionResponse = await multisigDouble.executeTransaction(transactionID);

            const events = Event.decodeTransactionResponse(
                transactionResponse,
            );

            assert.strictEqual(
                events.length,
                1,
            );

            // The first emitted event should be 'TransactionExecutionSucceeded'.
            Event.assertEqual(events[0], {
                name: 'TransactionExecutionSucceeded',
                args: {
                    _transactionID: new BN(transactionID),
                },
            });
        });

        it('Emits TransactionExecutionFailed on failure.', async () => {
            const required = 1;

            const registeredWallet0 = accountProvider.get();

            const wallets = [registeredWallet0];

            const multisigDouble = await MultiSigWalletDouble.new(
                wallets, required,
            );

            await multisigDouble.makeFooThrow();

            const transactionID = await multisigDouble.submitFoo.call(
                { from: registeredWallet0 },
            );

            await multisigDouble.submitFoo(
                { from: registeredWallet0 },
            );

            const transactionResponse = await multisigDouble.executeTransaction(
                transactionID,
                { from: registeredWallet0 },
            );

            const events = Event.decodeTransactionResponse(
                transactionResponse,
            );

            assert.strictEqual(
                events.length,
                1,
            );

            // The first emitted event should be 'TransactionExecutionFailed'.
            Event.assertEqual(events[0], {
                name: 'TransactionExecutionFailed',
                args: {
                    _transactionID: new BN(transactionID),
                },
            });
        });
    });

    contract('Execution', async (accounts) => {
        const accountProvider = new AccountProvider(accounts);

        it('Checks that request passes successfully.', async () => {
            const required = 1;

            const registeredWallet0 = accountProvider.get();

            const wallets = [registeredWallet0];

            const multisigDouble = await MultiSigWalletDouble.new(
                wallets, required,
            );

            await multisigDouble.makeFooThrow();

            const transactionID = await multisigDouble.submitFoo.call(
                { from: registeredWallet0 },
            );

            await multisigDouble.submitFoo(
                { from: registeredWallet0 },
            );

            await multisigDouble.makeFooNotThrow();

            await multisigDouble.executeTransaction(
                transactionID,
                { from: registeredWallet0 },
            );

            assert.isOk(
                (await multisigDouble.transactions.call(transactionID)).executed,
                'Transaction should pass as foo is set to succeed.',
            );
        });

        it('Checks that request fails.', async () => {
            const required = 1;

            const registeredWallet0 = accountProvider.get();

            const wallets = [registeredWallet0];

            const multisigDouble = await MultiSigWalletDouble.new(
                wallets, required,
            );

            await multisigDouble.makeFooThrow();

            const transactionID = await multisigDouble.submitFoo.call(
                { from: registeredWallet0 },
            );

            await multisigDouble.submitFoo(
                { from: registeredWallet0 },
            );

            await multisigDouble.executeTransaction(
                transactionID,
                { from: registeredWallet0 },
            );

            assert.isNotOk(
                (await multisigDouble.transactions.call(transactionID)).executed,
                'Transaction should not be executed in this stage '
                + 'as foo is set to throw.',
            );
        });
    });
});
