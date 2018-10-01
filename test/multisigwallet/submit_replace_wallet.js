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

const MultiSigWallet = artifacts.require('MultiSigWallet');

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
    contract('Negative testing for input parameters:', async (accounts) => {
        it('Non registered wallet submits a wallet replacement', async () => {
            const required = 1;
            const registeredWallet0 = accounts[0];
            const registeredWallet1 = accounts[1];
            const newWalletForReplacement = accounts[2];
            const nonRegisteredWallet = accounts[3];

            const wallets = [registeredWallet0, registeredWallet1];

            const multisig = await MultiSigWallet.new(wallets, required);

            await utils.expectRevert(
                multisig.submitReplaceWallet(
                    registeredWallet1,
                    newWalletForReplacement,
                    {
                        from: nonRegisteredWallet,
                    },
                ),
                'Non registered wallet cannot submit a wallet replacement.',
            );
        });

        it('Old wallet to replace should be registered.', async () => {
            const required = 1;
            const registeredWallet0 = accounts[0];
            const registeredWallet1 = accounts[1];
            const newWalletForReplacement = accounts[2];
            const nonRegisteredWallet = accounts[3];

            const wallets = [registeredWallet0, registeredWallet1];

            const multisig = await MultiSigWallet.new(wallets, required);

            await utils.expectRevert(
                multisig.submitReplaceWallet(
                    nonRegisteredWallet,
                    newWalletForReplacement,
                    {
                        from: registeredWallet0,
                    },
                ),
                'Old wallet to replace should be registered.',
            );
        });

        it('New wallet to replace should not be null.', async () => {
            const required = 1;
            const registeredWallet0 = accounts[0];
            const registeredWallet1 = accounts[1];
            const nullWallet = utils.NULL_ADDRESS;

            const wallets = [registeredWallet0, registeredWallet1];

            const multisig = await MultiSigWallet.new(wallets, required);

            await utils.expectRevert(
                multisig.submitReplaceWallet(
                    registeredWallet1,
                    nullWallet,
                    {
                        from: registeredWallet0,
                    },
                ),
                'Null wallet to replace should not be null.',
            );
        });

        it('New wallet to replace should not be registered.', async () => {
            const required = 1;
            const registeredWallet0 = accounts[0];
            const registeredWallet1 = accounts[1];

            const wallets = [registeredWallet0, registeredWallet1];

            const multisig = await MultiSigWallet.new(wallets, required);

            await utils.expectRevert(
                multisig.submitReplaceWallet(
                    registeredWallet1,
                    registeredWallet1,
                    {
                        from: registeredWallet0,
                    },
                ),
                'New wallet to replace should not be registered.',
            );
        });
    });

    contract('Events', async (accounts) => {
        it('Submit => Confirm => Execute', async () => {
            const registeredWallet0 = accounts[0];
            const registeredWallet1 = accounts[1];
            const newWalletForReplacement = accounts[2];

            const wallets = [registeredWallet0, registeredWallet1];

            const multisig = await MultiSigWallet.new(wallets, 1);

            const transactionResponse = await multisig.submitReplaceWallet(
                registeredWallet1,
                newWalletForReplacement,
                {
                    from: registeredWallet0,
                },
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
                    _oldWallet: registeredWallet1,
                    _newWallet: newWalletForReplacement,
                },
            });

            // The second emitted event should be 'TransactionConfirmed', as
            // the wallet that submits transaction confirms afterwards.
            Event.assertEqual(events[1], {
                name: 'TransactionConfirmed',
                args: {
                    _transactionID: new BN(0),
                    _wallet: registeredWallet0,
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

        it('Submit => Confirm', async () => {
            const registeredWallet0 = accounts[0];
            const registeredWallet1 = accounts[1];
            const newWalletToReplace = accounts[2];

            const wallets = [registeredWallet0, registeredWallet1];

            const multisig = await MultiSigWallet.new(wallets, 2);

            const transactionResponse = await multisig.submitReplaceWallet(
                registeredWallet1,
                newWalletToReplace,
                {
                    from: registeredWallet0,
                },
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
                    _oldWallet: registeredWallet1,
                    _newWallet: newWalletToReplace,
                },
            });

            // The second emitted event should be 'TransactionConfirmed', as
            // the wallet that submits transaction confirms afterwards.
            Event.assertEqual(events[1], {
                name: 'TransactionConfirmed',
                args: {
                    _transactionID: new BN(0),
                    _wallet: registeredWallet0,
                },
            });
        });
    });

    contract('Storage', async (accounts) => {
        it('Submit => Confirm => Execute', async () => {
            const registeredWallet0 = accounts[0];
            const registeredWallet1 = accounts[1];
            const newWalletForReplacement = accounts[2];

            const wallets = [registeredWallet0, registeredWallet1];

            const multisig = await MultiSigWallet.new(wallets, 1);

            await multisig.submitReplaceWallet(
                registeredWallet1,
                newWalletForReplacement,
            );

            const transactionID = 0;

            assert.isOk(
                await multisig.isWallet.call(newWalletForReplacement),
                'Wallet replacement should happen immediately, because of '
                + '2-wallets-1-required setup.',
            );

            assert.isNotOk(
                await multisig.isWallet.call(registeredWallet1),
                'Wallet replacement should happen immediately, because of '
                + '2-wallets-1-required setup.',
            );

            assert.isOk(
                (await multisig.walletCount.call()).eqn(2),
                'Wallet count should not change during replace.',
            );

            assert.strictEqual(
                await multisig.wallets.call(0),
                registeredWallet0,
            );

            assert.strictEqual(
                await multisig.wallets.call(1),
                newWalletForReplacement,
            );

            assert.isOk(
                (await multisig.required.call()).eqn(1),
                'Required number of confirmation should stay unchanged.',
            );

            assert.isOk(
                (await multisig.transactionCount.call()).eqn(1),
                'Transaction count should be increased by one.',
            );

            assert.strictEqual(
                await multisig.confirmations.call(
                    transactionID, registeredWallet0,
                ),
                true,
            );

            const transaction = await multisig.transactions.call(transactionID);

            assert.strictEqual(
                transaction.destination,
                multisig.address,
            );

            assert.strictEqual(
                transaction.data,
                generateReplaceWalletData(
                    registeredWallet1, newWalletForReplacement,
                ),
            );

            assert.strictEqual(
                transaction.executed,
                true,
            );
        });

        it('Submit => Confirm', async () => {
            const registeredWallet0 = accounts[0];
            const registeredWallet1 = accounts[1];
            const newWalletForReplacement = accounts[2];

            const wallets = [registeredWallet0, registeredWallet1];

            const multisig = await MultiSigWallet.new(wallets, 2);

            await multisig.submitReplaceWallet(
                registeredWallet1,
                newWalletForReplacement,
            );

            const transactionID = 0;

            assert.isOk(
                await multisig.isWallet.call(registeredWallet1),
                'Wallet replacement should not happen immediately, because of '
                + '2-wallets-2-required setup.',
            );

            assert.isNotOk(
                await multisig.isWallet.call(newWalletForReplacement),
                'Wallet replacement should not happen immediately, because of '
                + '2-wallets-2-required setup.',
            );

            assert.isOk(
                (await multisig.walletCount.call()).eqn(2),
                'Wallet count should not change during replace.',
            );

            assert.strictEqual(
                await multisig.wallets.call(0),
                registeredWallet0,
            );

            assert.strictEqual(
                await multisig.wallets.call(1),
                registeredWallet1,
            );

            assert.isOk(
                (await multisig.required.call()).eqn(2),
                'Required number of confirmation should stay unchanged.',
            );

            assert.isOk(
                (await multisig.transactionCount.call()).eqn(1),
                'Transaction count should be increased by one.',
            );

            assert.strictEqual(
                await multisig.confirmations.call(
                    transactionID, registeredWallet0,
                ),
                true,
            );

            const transaction = await multisig.transactions.call(transactionID);

            assert.strictEqual(
                transaction.destination,
                multisig.address,
            );

            assert.strictEqual(
                transaction.data,
                generateReplaceWalletData(
                    registeredWallet1, newWalletForReplacement,
                ),
            );

            assert.strictEqual(
                transaction.executed,
                false,
            );
        });
    });
});
