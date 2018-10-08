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
    contract('Negative Tests', async (accounts) => {
        const accountProvider = new AccountProvider(accounts);

        it('Reverts if non-registered wallet calls.', async () => {
            const helper = await new MultiSigWalletUtils(
                { accountProvider, walletCount: 1, required: 1 },
            );

            await utils.expectRevert(
                helper.multisig().submitRemoveWallet(
                    accountProvider.get(),
                    { from: accountProvider.get() },
                ),
                'Should revert as non-registered wallet calls.',
                'Only wallet is allowed to call.',
            );
        });

        it('Reverts if wallet to remove does not exist.', async () => {
            const helper = await new MultiSigWalletUtils(
                { accountProvider, walletCount: 1, required: 1 },
            );

            await utils.expectRevert(
                helper.multisig().submitRemoveWallet(
                    accountProvider.get(),
                    { from: helper.wallet(0) },
                ),
                'Should revert as wallet to remove does not exist.',
                'Wallet does not exist.',
            );
        });

        it('Reverts if last wallet is going to be removed.', async () => {
            const helper = await new MultiSigWalletUtils(
                { accountProvider, walletCount: 1, required: 1 },
            );

            await utils.expectRevert(
                helper.multisig().submitRemoveWallet(
                    helper.wallet(0),
                    {
                        from: helper.wallet(0),
                    },
                ),
                'Should revert as last wallet is submitted for removal',
                'Last wallet cannot be submitted for removal.',
            );
        });
    });

    contract('Events', async (accounts) => {
        const accountProvider = new AccountProvider(accounts);

        it('Emits WalletRemovalSubmitted, TransactionConfirmed '
        + 'TransactionExecutionSucceeded events.', async () => {
            const helper = await new MultiSigWalletUtils(
                { accountProvider, walletCount: 2, required: 1 },
            );

            const transactionResponse = await helper.multisig().submitRemoveWallet(
                helper.wallet(1),
                { from: helper.wallet(0) },
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
                    _wallet: helper.wallet(1),
                },
            });

            // The second emitted event should be 'TransactionConfirmed',
            // because the wallet that submitted a wallet removal request
            // should confirm it afterwards.
            Event.assertEqual(events[1], {
                name: 'TransactionConfirmed',
                args: {
                    _transactionID: new BN(0),
                    _wallet: helper.wallet(0),
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

        it('Emits WalletRemovalSubmitted and TransactionConfirmed.', async () => {
            const helper = await new MultiSigWalletUtils(
                { accountProvider, walletCount: 3, required: 2 },
            );

            const transactionResponse = await helper.multisig().submitRemoveWallet(
                helper.wallet(1),
                { from: helper.wallet(0) },
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
                    _wallet: helper.wallet(1),
                },
            });

            // The second emitted event should be 'TransactionConfirmed',
            // because the wallet that submitted a wallet removal request
            // should confirm it afterwards.
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

            const transactionID = await helper.submitRemoveWallet(1, 0);

            assert.isNotOk(
                await helper.multisig().isWallet.call(helper.wallet(1)),
                'Wallet will be removed because of 2-wallets-1-required '
                + 'setup.',
            );

            assert.isOk(
                (await helper.multisig().walletCount.call()).eqn(1),
            );

            assert.strictEqual(
                await helper.multisig().wallets.call(0),
                helper.wallet(0),
            );

            assert.isOk(
                (await helper.multisig().required.call()).eqn(1),
            );

            assert.isOk(
                await helper.multisig().confirmations(
                    transactionID, helper.wallet(0),
                ),
            );

            assert.isOk(
                (await helper.multisig().transactionCount.call()).eqn(1),
            );

            const transaction = await helper.multisig().transactions.call(transactionID);

            assert.strictEqual(
                transaction.destination,
                helper.multisig().address,
            );

            assert.strictEqual(
                transaction.data,
                generateRemoveWalletData(helper.wallet(1)),
            );

            assert.strictEqual(
                transaction.executed,
                true,
            );
        });

        it('Checks state in case of 3-wallets-2-required.', async () => {
            const helper = await new MultiSigWalletUtils(
                { accountProvider, walletCount: 3, required: 2 },
            );

            const transactionID = await helper.submitRemoveWallet(1, 0);

            assert.isOk(
                await helper.multisig().isWallet.call(helper.wallet(1)),
                'Wallet will not be removed because of 3-wallets-2-required '
                + 'setup.',
            );

            assert.isOk(
                (await helper.multisig().walletCount.call()).eqn(3),
            );

            assert.strictEqual(
                await helper.multisig().wallets.call(0),
                helper.wallet(0),
            );

            assert.strictEqual(
                await helper.multisig().wallets.call(1),
                helper.wallet(1),
            );

            assert.strictEqual(
                await helper.multisig().wallets.call(2),
                helper.wallet(2),
            );

            assert.isOk(
                (await helper.multisig().required.call()).eqn(2),
            );

            assert.isOk(
                await helper.multisig().confirmations(
                    transactionID, helper.wallet(0),
                ),
            );

            assert.isOk(
                (await helper.multisig().transactionCount.call()).eqn(1),
            );

            const transaction = await helper.multisig().transactions.call(transactionID);

            assert.strictEqual(
                transaction.destination,
                helper.multisig().address,
            );

            assert.strictEqual(
                transaction.data,
                generateRemoveWalletData(helper.wallet(1)),
            );

            assert.strictEqual(
                transaction.executed,
                false,
            );
        });

        it('Checks that requirement is adjusted after removal.', async () => {
            const helper = await new MultiSigWalletUtils(
                { accountProvider, walletCount: 2, required: 2 },
            );

            const transactionID = await helper.submitRemoveWallet(1, 0);

            assert.isOk(
                (await helper.multisig().required.call()).eqn(2),
            );

            await helper.multisig().confirmTransaction(
                transactionID,
                { from: helper.wallet(1) },
            );

            assert.isOk(
                (await helper.multisig().required.call()).eqn(1),
                'After removing the wallet the required should be updated '
                + 'to max wallet count, in this case 1.',
            );
        });
    });
});
