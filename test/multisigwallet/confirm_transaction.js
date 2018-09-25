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

const MultiSigWallet = artifacts.require('MultiSigWallet');

contract('MultiSigWallet::confirmTransaction', async () => {
    contract('Negative testing for input parameters.', async (accounts) => {
        it('Non registered wallet confirms transaction.', async () => {
            const required = 2;

            const registeredWallet0 = accounts[0];
            const registeredWallet1 = accounts[1];
            const newWalletToAdd = accounts[2];
            const nonRegisteredWallet = accounts[3];

            const wallets = [registeredWallet0, registeredWallet1];

            const multisig = await MultiSigWallet.new(wallets, required);

            await multisig.submitAddWallet(
                newWalletToAdd,
                {
                    from: registeredWallet0,
                },
            );

            const transactionID = 0;

            await utils.expectRevert(
                multisig.confirmTransaction(
                    transactionID,
                    {
                        from: nonRegisteredWallet,
                    },
                ),
                'Non registered wallet cannot confirm transaction.',
            );
        });

        it('Confirmation of non existing transaction.', async () => {
            const required = 1;

            const registeredWallet0 = accounts[0];

            const wallets = [registeredWallet0];

            const multisig = await MultiSigWallet.new(wallets, required);

            const nonExistingTransactionID = 11;

            await utils.expectRevert(
                multisig.confirmTransaction(
                    nonExistingTransactionID,
                    {
                        from: registeredWallet0,
                    },
                ),
                'Confirmation of non existing transaction is not possible.',
            );
        });

        it('Double confirmation.', async () => {
            const required = 2;

            const registeredWallet0 = accounts[0];
            const registeredWallet1 = accounts[1];
            const newWalletToAdd = accounts[2];

            const wallets = [registeredWallet0, registeredWallet1];

            const multisig = await MultiSigWallet.new(wallets, required);

            await multisig.submitAddWallet(
                newWalletToAdd,
                {
                    from: registeredWallet0,
                },
            );

            const transactionID = 0;

            await utils.expectRevert(
                multisig.confirmTransaction(
                    transactionID,
                    {
                        from: registeredWallet0,
                    },
                ),
                'Double confirmation by wallet is not allowed.',
            );
        });
    });

    contract('Events', async (accounts) => {
        it('Transaction confirmed is emitted.', async () => {
            const required = 3;

            const registeredWallet0 = accounts[0];
            const registeredWallet1 = accounts[1];
            const registeredWallet2 = accounts[2];
            const newWalletToAdd = accounts[3];

            const wallets = [
                registeredWallet0, registeredWallet1, registeredWallet2,
            ];

            const multisig = await MultiSigWallet.new(wallets, required);

            await multisig.submitAddWallet(
                newWalletToAdd,
                {
                    from: registeredWallet0,
                },
            );

            const transactionID = 0;

            const transactionResponse = await multisig.confirmTransaction(
                transactionID,
                {
                    from: registeredWallet1,
                },
            );

            const events = Event.decodeTransactionResponse(
                transactionResponse,
            );

            assert.strictEqual(
                events.length,
                1,
            );

            // The first emitted event should be
            // 'TransactionConfirmed'.
            Event.assertEqual(events[0], {
                name: 'TransactionConfirmed',
                args: {
                    _transactionID: new BN(transactionID),
                    _wallet: registeredWallet1,
                },
                logIndex: 0,
            });
        });
    });

    contract('Storage', async (accounts) => {
        it('Transaction execution.', async () => {
            const required = 2;

            const registeredWallet0 = accounts[0];
            const registeredWallet1 = accounts[1];
            const newWalletToAdd = accounts[2];

            const wallets = [registeredWallet0, registeredWallet1];

            const multisig = await MultiSigWallet.new(wallets, required);

            await multisig.submitAddWallet(
                newWalletToAdd,
                {
                    from: registeredWallet0,
                },
            );

            const transactionID = 0;

            assert.isNotOk(
                (await multisig.transactions.call(transactionID)).executed,
                'Transaction should not be confirmed because of '
                + '2-wallets-2-required setup.',
            );

            await multisig.confirmTransaction(
                transactionID,
                {
                    from: registeredWallet1,
                },
            );

            assert.isOk(
                (await multisig.transactions.call(transactionID)).executed,
                'Transaction should be confirmed because two wallets '
                + 'has confirmed it.',
            );
        });
    });
});
