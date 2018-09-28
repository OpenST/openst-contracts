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
const { MultiSigWalletHelper } = require('../test_lib/multisigwallet_helper.js');

const MultiSigWallet = artifacts.require('MultiSigWallet');

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
    contract('Negative testing for input parameters:', async (accounts) => {
        it('Non registered wallet submits.', async () => {
            const required = 1;

            const registeredWallet0 = accounts[0];
            const nonRegisteredWallet = accounts[1];
            const walletToAdd = accounts[2];

            const wallets = [registeredWallet0];

            const multisig = await MultiSigWallet.new(wallets, required);

            await utils.expectRevert(
                multisig.submitAddWallet(
                    walletToAdd,
                    {
                        from: nonRegisteredWallet,
                    },
                ),
                'Non registered wallet cannot submit a wallet addition.',
            );
        });

        it('Null wallet submits.', async () => {
            const required = 1;

            const registeredWallet0 = accounts[0];
            const nullWallet = utils.NULL_ADDRESS;

            const wallets = [registeredWallet0];

            const multisig = await MultiSigWallet.new(wallets, required);

            await utils.expectRevert(
                multisig.submitAddWallet(
                    nullWallet,
                    {
                        from: registeredWallet0,
                    },
                ),
                'Null wallet cannot be submitted for addition.',
            );
        });

        it('Submits already registered wallet.', async () => {
            const required = 1;

            const registeredWallet0 = accounts[0];

            const wallets = [registeredWallet0];

            const multisig = await MultiSigWallet.new(wallets, required);

            await utils.expectRevert(
                multisig.submitAddWallet(
                    registeredWallet0,
                    {
                        from: registeredWallet0,
                    },
                ),
                'Already registered wallet cannot be submitted for addition.',
            );
        });
    });

    contract('Events', async (accounts) => {
        it('Submit => Confirm => Execute', async () => {
            const required = 1;

            const registeredWallet0 = accounts[0];
            const walletToAdd = accounts[1];

            const wallets = [registeredWallet0];

            const multisig = await MultiSigWallet.new(wallets, required);

            const transactionResponse = await multisig.submitAddWallet(
                walletToAdd,
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
                logIndex: 0,
            });

            // The second emitted event should be 'TransactionConfirmed',
            // because the wallet that submitted a new wallet addition request
            // should confirm it afterwards in the same call.
            Event.assertEqual(events[1], {
                name: 'TransactionConfirmed',
                args: {
                    _transactionID: new BN(0),
                    _wallet: registeredWallet0,
                },
                logIndex: 1,
            });

            // The third emitted event should be
            // 'TransactionExecutionSucceeded', because of the setup
            // 1-wallet-1-requirement.
            Event.assertEqual(events[2], {
                name: 'TransactionExecutionSucceeded',
                args: {
                    _transactionID: new BN(0),
                },
                logIndex: 2,
            });
        });

        it('Submit => Confirm', async () => {
            const required = 2;

            const registeredWallet0 = accounts[0];
            const registeredWallet1 = accounts[1];
            const walletToAdd = accounts[2];

            const wallets = [registeredWallet0, registeredWallet1];

            const multisig = await MultiSigWallet.new(wallets, required);

            const transactionResponse = await multisig.submitAddWallet(
                walletToAdd,
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
                logIndex: 0,
            });

            // The second emitted event should be 'TransactionConfirmed',
            // because the wallet that submitted a new wallet addition request
            // should confirm it afterwards in the same call.
            Event.assertEqual(events[1], {
                name: 'TransactionConfirmed',
                args: {
                    _transactionID: new BN(0),
                    _wallet: registeredWallet0,
                },
                logIndex: 1,
            });
        });
    });

    contract('Storage', async (accounts) => {
        it('Submit => Confirm => Execute', async () => {
            const required = 1;

            const registeredWallet0 = accounts[0];
            const walletToAdd = accounts[1];

            const wallets = [registeredWallet0];

            const multisig = await MultiSigWallet.new(wallets, required);

            const transactionID = await MultiSigWalletHelper.submitAddWallet(
                multisig,
                walletToAdd,
                {
                    from: registeredWallet0,
                },
            );

            assert.isOk(
                await multisig.isWallet.call(walletToAdd),
                'Newly submitted wallet would be added because of '
                + '1-wallet-1-required condition.',
            );

            assert.strictEqual(
                await multisig.wallets.call(0),
                registeredWallet0,
            );

            assert.strictEqual(
                await multisig.wallets.call(1),
                walletToAdd,
            );

            assert.isOk(
                (await multisig.transactionCount.call()).eqn(1),
                'Transaction count should be increased by one.',
            );

            assert.isOk(
                await multisig.confirmations.call(
                    transactionID, registeredWallet0,
                ),
            );

            const transaction = await multisig.transactions.call(transactionID);

            assert.strictEqual(
                transaction.destination,
                multisig.address,
            );

            assert.strictEqual(
                transaction.data,
                generateAddWalletData(walletToAdd),
            );

            assert.isOk(
                transaction.executed,
            );
        });

        it('Submit => Confirm', async () => {
            const required = 2;

            const registeredWallet0 = accounts[0];
            const registeredWallet1 = accounts[1];
            const walletToAdd = accounts[2];

            const wallets = [registeredWallet0, registeredWallet1];

            const multisig = await MultiSigWallet.new(wallets, required);

            const transactionID = await MultiSigWalletHelper.submitAddWallet(
                multisig,
                walletToAdd,
                {
                    from: registeredWallet0,
                },
            );

            assert.isNotOk(
                await multisig.isWallet.call(walletToAdd),
                'Newly submitted wallet would *not* be added because of '
                + '2-wallet-1-required condition.',
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
                (await multisig.transactionCount.call()).eqn(1),
                'Transaction count should be increased by one.',
            );

            assert.isOk(
                await multisig.confirmations.call(
                    transactionID, registeredWallet0,
                ),
            );

            const transaction = await multisig.transactions.call(transactionID);

            assert.strictEqual(
                transaction.destination,
                multisig.address,
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
