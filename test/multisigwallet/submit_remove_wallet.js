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
// Test: MultiSigWallet::submitRemoveWallet
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const BN = require('bn.js');
const web3 = require('../test_lib/web3.js');
const utils = require('../test_lib/utils.js');
const { Event } = require('../test_lib/event_decoder');

const MultiSigWallet = artifacts.require('MultiSigWallet');

function generateRemoveWalletData(wallet) {
    return web3.eth.abi.encodeFunctionCall(
        {
            name: 'removeWallet',
            type: 'function',
            inputs: [{
                type: 'address',
                name: '',
            }],
        },
        [wallet],
    );
}

contract('MultiSigWallet::submitReplaceWallet', async () => {
    contract('Negative testing for input parameters.', async (accounts) => {
        it('Non registered wallet submits a wallet removal.', async () => {
            const required = 1;

            const registeredWallet0 = accounts[0];
            const nonRegisteredWallet = accounts[1];
            const walletToRemove = accounts[2];

            const wallets = [registeredWallet0];

            const multisig = await MultiSigWallet.new(wallets, required);

            await utils.expectRevert(
                multisig.submitRemoveWallet(
                    walletToRemove,
                    {
                        from: nonRegisteredWallet,
                    },
                ),
                'Non registered wallet cannot submit a wallet removal.',
            );
        });

        it('Null wallets submits a wallet removal.', async () => {
            const required = 1;

            const registeredWallet0 = accounts[0];
            const nullWallet = utils.NULL_ADDRESS;

            const wallets = [registeredWallet0];

            const multisig = await MultiSigWallet.new(wallets, required);

            await utils.expectRevert(
                multisig.submitRemoveWallet(
                    nullWallet,
                    {
                        from: registeredWallet0,
                    },
                ),
                'Null wallet cannot be submitted for removal.',
            );
        });

        it('Last wallet removal attempt.', async () => {
            const required = 1;

            const registeredWallet0 = accounts[0];

            const wallets = [registeredWallet0];

            const multisig = await MultiSigWallet.new(wallets, required);

            await utils.expectRevert(
                multisig.submitRemoveWallet(
                    registeredWallet0,
                    {
                        from: registeredWallet0,
                    },
                ),
                'Last wallet cannot be removed from multisig.',
            );
        });
    });

    contract('Events', async (accounts) => {
        it('Submit => Confirm => Execute', async () => {
            const required = 1;

            const registeredWallet0 = accounts[0];
            const registeredWallet1 = accounts[1];

            const wallets = [registeredWallet0, registeredWallet1];

            const multisig = await MultiSigWallet.new(wallets, required);

            const transactionResponse = await multisig.submitRemoveWallet(
                registeredWallet1,
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
                + 'afterwards, hence WalletRemovalSubmitted, '
                + 'TransactionConfirmed and TransactionExecutionSucceeded '
                + 'would be emitted.',
            );


            // The first emitted event should be 'WalletRemovalSubmitted'.
            Event.assertEqual(events[0], {
                name: 'WalletRemovalSubmitted',
                args: {
                    _transactionID: new BN(0),
                    _wallet: registeredWallet1,
                },
            });

            // The second emitted event should be 'TransactionConfirmed',
            // because the wallet that submitted a wallet removal request
            // should confirm it afterwards.
            Event.assertEqual(events[1], {
                name: 'TransactionConfirmed',
                args: {
                    _transactionID: new BN(0),
                    _wallet: registeredWallet0,
                },
            });

            // The third emitted event should be
            // 'TransactionExecutionSucceeded', because of the setup
            // 2-wallet-1-requirement.
            Event.assertEqual(events[2], {
                name: 'TransactionExecutionSucceeded',
                args: {
                    _transactionID: new BN(0),
                },
            });
        });

        it('Submit => Confirm', async () => {
            const required = 2;

            const registeredWallet0 = accounts[0];
            const registeredWallet1 = accounts[1];
            const registeredWallet2 = accounts[2];

            const wallets = [
                registeredWallet0, registeredWallet1, registeredWallet2,
            ];

            const multisig = await MultiSigWallet.new(wallets, required);

            const transactionResponse = await multisig.submitRemoveWallet(
                registeredWallet1,
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
                + 'afterwards, hence only WalletRemovalSubmitted and '
                + 'TransactionConfirmed would be emitted.',
            );

            // The first emitted event should be 'WalletRemovalSubmitted'.
            Event.assertEqual(events[0], {
                name: 'WalletRemovalSubmitted',
                args: {
                    _transactionID: new BN(0),
                    _wallet: registeredWallet1,
                },
            });

            // The second emitted event should be 'TransactionConfirmed',
            // because the wallet that submitted a wallet removal request
            // should confirm it afterwards.
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
            const required = 1;

            const registeredWallet0 = accounts[0];
            const registeredWallet1 = accounts[1];

            const wallets = [registeredWallet0, registeredWallet1];

            const multisig = await MultiSigWallet.new(wallets, required);

            await multisig.submitRemoveWallet(
                registeredWallet1,
                {
                    from: registeredWallet0,
                },
            );

            const transactionID = 0;

            assert.isNotOk(
                await multisig.isWallet.call(registeredWallet1),
                'Wallet will be removed because of 2-wallets-1-required '
                + 'setup.',
            );

            assert.isOk(
                (await multisig.walletCount.call()).eqn(1),
            );

            assert.strictEqual(
                await multisig.wallets.call(0),
                registeredWallet0,
            );

            assert.isOk(
                (await multisig.required.call()).eqn(1),
            );

            assert.isOk(
                await multisig.confirmations(transactionID, registeredWallet0),
            );

            assert.isOk(
                (await multisig.transactionCount.call()).eqn(1),
            );

            const transaction = await multisig.transactions.call(transactionID);

            assert.strictEqual(
                transaction.destination,
                multisig.address,
            );

            assert.strictEqual(
                transaction.data,
                generateRemoveWalletData(registeredWallet1),
            );

            assert.strictEqual(
                transaction.executed,
                true,
            );
        });

        it('Submit => Confirm', async () => {
            const required = 2;

            const registeredWallet0 = accounts[0];
            const registeredWallet1 = accounts[1];
            const registeredWallet2 = accounts[2];

            const wallets = [
                registeredWallet0, registeredWallet1, registeredWallet2,
            ];

            const multisig = await MultiSigWallet.new(wallets, required);

            await multisig.submitRemoveWallet(
                registeredWallet1,
                {
                    from: registeredWallet0,
                },
            );

            const transactionID = 0;

            assert.isOk(
                await multisig.isWallet.call(registeredWallet1),
                'Wallet will not be removed because of 3-wallets-2-required '
                + 'setup.',
            );

            assert.isOk(
                (await multisig.walletCount.call()).eqn(3),
            );

            assert.strictEqual(
                await multisig.wallets.call(0),
                registeredWallet0,
            );

            assert.strictEqual(
                await multisig.wallets.call(1),
                registeredWallet1,
            );

            assert.strictEqual(
                await multisig.wallets.call(2),
                registeredWallet2,
            );

            assert.isOk(
                (await multisig.required.call()).eqn(2),
            );

            assert.isOk(
                await multisig.confirmations(transactionID, registeredWallet0),
            );

            assert.isOk(
                (await multisig.transactionCount.call()).eqn(1),
            );

            const transaction = await multisig.transactions.call(transactionID);

            assert.strictEqual(
                transaction.destination,
                multisig.address,
            );

            assert.strictEqual(
                transaction.data,
                generateRemoveWalletData(registeredWallet1),
            );

            assert.strictEqual(
                transaction.executed,
                false,
            );
        });
    });
});
