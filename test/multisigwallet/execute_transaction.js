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
const { MultiSigWalletHelper } = require('../test_lib/multisigwallet_helper.js');

const MultiSigWallet = artifacts.require('MultiSigWallet');

const MultiSigWalletDouble = artifacts.require('MultiSigWalletDouble');

contract('MultiSigWallet::executeTransaction', async () => {
    contract('Negative testing for input parameters.', async (accounts) => {
        it('Non registered wallet requests execution.', async () => {
            const required = 2;

            const registeredWallet0 = accounts[0];
            const registeredWallet1 = accounts[1];
            const newWalletToAdd = accounts[2];
            const nonRegisteredWallet = accounts[3];

            const wallets = [registeredWallet0, registeredWallet1];

            const multisig = await MultiSigWallet.new(wallets, required);

            const transactionID = await MultiSigWalletHelper.submitAddWallet(
                multisig,
                newWalletToAdd,
                {
                    from: registeredWallet0,
                },
            );

            await utils.expectRevert(
                multisig.executeTransaction(
                    transactionID,
                    {
                        from: nonRegisteredWallet,
                    },
                ),
                'Non registered wallet cannot execute transaction.',
            );
        });

        it('Execution request for non-existing transaction.', async () => {
            const required = 1;

            const registeredWallet0 = accounts[0];

            const wallets = [registeredWallet0];

            const multisig = await MultiSigWallet.new(wallets, required);

            const nonExistingTransactionID = 11;

            await utils.expectRevert(
                multisig.executeTransaction(
                    nonExistingTransactionID,
                    {
                        from: registeredWallet0,
                    },
                ),
            );
        });

        it('Wallet did not confirm the transaction.', async () => {
            const required = 2;

            const registeredWallet0 = accounts[0];
            const registeredWallet1 = accounts[1];
            const newWalletToAdd = accounts[2];

            const wallets = [registeredWallet0, registeredWallet1];

            const multisig = await MultiSigWallet.new(wallets, required);

            const transactionID = await MultiSigWalletHelper.submitAddWallet(
                multisig,
                newWalletToAdd,
                {
                    from: registeredWallet0,
                },
            );

            await utils.expectRevert(
                multisig.executeTransaction(
                    transactionID,
                    {
                        from: registeredWallet1,
                    },
                ),
            );
        });

        it('Already executed transaction.', async () => {
            const required = 1;

            const registeredWallet0 = accounts[0];
            const newWalletToAdd = accounts[1];

            const wallets = [registeredWallet0];

            const multisig = await MultiSigWallet.new(wallets, required);

            const transactionID = await MultiSigWalletHelper.submitAddWallet(
                multisig,
                newWalletToAdd,
                {
                    from: registeredWallet0,
                },
            );

            await utils.expectRevert(
                multisig.executeTransaction(
                    transactionID,
                    {
                        from: registeredWallet0,
                    },
                ),
            );
        });
    });

    contract('Events', async (accounts) => {
        it('Successful transaction execution', async () => {
            const required = 1;

            const registeredWallet0 = accounts[0];

            const wallets = [registeredWallet0];

            const multisigDouble = await MultiSigWalletDouble.new(
                wallets, required,
            );

            await multisigDouble.makeFooThrow();

            transactionID = await multisigDouble.submitFoo.call(
                {
                    from: registeredWallet0,
                },
            );

            await multisigDouble.submitFoo(
                {
                    from: registeredWallet0,
                },
            );

            await multisigDouble.makeFooNotThrow();
            const transactionResponse = await multisigDouble
                .executeTransaction(transactionID);

            const events = Event.decodeTransactionResponse(
                transactionResponse,
            );

            assert.strictEqual(
                events.length,
                1,
            );

            // The first emitted event should be
            // 'TransactionExecutionSucceeded'.
            Event.assertEqual(events[0], {
                name: 'TransactionExecutionSucceeded',
                args: {
                    _transactionID: new BN(transactionID),
                },
                logIndex: 0,
            });
        });

        it('Failing transaction execution', async () => {
            const required = 1;

            const registeredWallet0 = accounts[0];

            const wallets = [registeredWallet0];

            const multisigDouble = await MultiSigWalletDouble.new(
                wallets, required,
            );

            await multisigDouble.makeFooThrow();

            const transactionID = await multisigDouble.submitFoo.call(
                {
                    from: registeredWallet0,
                },
            );

            await multisigDouble.submitFoo(
                {
                    from: registeredWallet0,
                },
            );

            const transactionResponse = await multisigDouble
                .executeTransaction(transactionID);

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
                logIndex: 0,
            });
        });
    });

    contract('Storage', async (accounts) => {
        it('Successful transaction execution', async () => {
            const required = 1;

            const registeredWallet0 = accounts[0];

            const wallets = [registeredWallet0];

            const multisigDouble = await MultiSigWalletDouble.new(
                wallets, required,
            );

            await multisigDouble.makeFooThrow();
            const transactionID = await multisigDouble.submitFoo.call(
                {
                    from: registeredWallet0,
                },
            );
            await multisigDouble.submitFoo(
                {
                    from: registeredWallet0,
                },
            );

            assert.isNotOk(
                (await multisigDouble.transactions.call(transactionID)).executed,
                'Transaction should not be executed in this stage '
                + 'as foo is set to throw.',
            );

            await multisigDouble.makeFooNotThrow();
            await multisigDouble.executeTransaction(transactionID);

            assert.isOk(
                (await multisigDouble.transactions.call(transactionID)).executed,
                'Transaction should pass as foo set to succeed.',
            );
        });

        it('Failing transaction execution', async () => {
            const required = 1;

            const registeredWallet0 = accounts[0];

            const wallets = [registeredWallet0];

            const multisigDouble = await MultiSigWalletDouble.new(
                wallets, required,
            );

            await multisigDouble.makeFooThrow();
            const transactionID = await multisigDouble.submitFoo.call(
                {
                    from: registeredWallet0,
                },
            );
            await multisigDouble.submitFoo(
                {
                    from: registeredWallet0,
                },
            );

            assert.isNotOk(
                (await multisigDouble.transactions.call(transactionID)).executed,
                'Transaction should not be executed in this stage '
                + 'as foo is set to throw.',
            );

            await multisigDouble.executeTransaction(transactionID);

            assert.isNotOk(
                (await multisigDouble.transactions.call(transactionID)).executed,
                'Transaction should fail as foo is still set to throw.',
            );
        });
    });
});
