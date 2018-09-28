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
const { MultiSigWalletHelper } = require('../test_lib/multisigwallet_helper.js');

const MultiSigWallet = artifacts.require('MultiSigWallet');

contract('MultiSigWallet::revokeConfirmation', async () => {
    contract('Negative testing for input parameters.', async (accounts) => {
        it('Non registered wallet submits a revocation request.', async () => {
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
                multisig.revokeConfirmation(
                    transactionID,
                    {
                        from: nonRegisteredWallet,
                    },
                ),
                'Non registered wallet cannot request revocation.',
            );
        });

        it('Revocation requested for non existing transaction.', async () => {
            const required = 1;
            const registeredWallet0 = accounts[0];
            const wallets = [registeredWallet0];

            const multisig = await MultiSigWallet.new(wallets, required);

            const nonExistingTransactionID = 11;

            await utils.expectRevert(
                multisig.revokeConfirmation(
                    nonExistingTransactionID,
                    {
                        from: registeredWallet0,
                    },
                ),
            );
        });

        it('Revocation request for non confirmed transaction. ', async () => {
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
                multisig.revokeConfirmation(
                    transactionID,
                    {
                        from: registeredWallet1,
                    },
                ),
            );
        });

        it('Revocation request for an executed transaction. ', async () => {
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
                multisig.revokeConfirmation(
                    transactionID,
                    {
                        from: registeredWallet0,
                    },
                ),
            );
        });
    });

    contract('Events', async (accounts) => {
        it('Check the revocation is fired.', async () => {
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

            const transactionResponse = await multisig.revokeConfirmation(
                transactionID,
                {
                    from: registeredWallet0,
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
            // 'TransactionConfirmationRevoked'.
            Event.assertEqual(events[0], {
                name: 'TransactionConfirmationRevoked',
                args: {
                    _transactionID: new BN(0),
                    _wallet: registeredWallet0,
                },
                logIndex: 0,
            });
        });
    });

    contract('Storage', async (accounts) => {
        it('Check revocation is cleared for submitter wallet.', async () => {
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

            assert.isOk(
                await multisig.confirmations(transactionID, registeredWallet0),
            );

            await multisig.revokeConfirmation(
                transactionID,
                {
                    from: registeredWallet0,
                },
            );

            assert.isNotOk(
                await multisig.confirmations(transactionID, registeredWallet0),
            );
        });
    });
});
