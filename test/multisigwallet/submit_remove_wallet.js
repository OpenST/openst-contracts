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
// Test: MultiSigWallet::submitAddWallet
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const BN = require('bn.js');
const web3 = require('../lib/web3.js');
const utils = require('../lib/utils.js');
const { Event } = require('../lib/event_decoder');

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

contract('MultiSigWallet::submitRemoveWallet', async (accounts) => {
    it('negative testing', async () => {
        const required = 1;

        const registeredWallet0 = accounts[0];
        const nonRegisteredWallet = accounts[1];
        const walletToRemove = accounts[2];
        const nullWallet = utils.NULL_ADDRESS;

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

        await utils.expectRevert(
            multisig.submitRemoveWallet(
                nullWallet,
                {
                    from: registeredWallet0,
                },
            ),
            'Null wallet cannot be submitted for removal.',
        );

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

    it('non self removal', async () => {
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

        // The first emitted event should be 'WalletRemovalSubmitted'.
        Event.assertEqual(events[0], {
            name: 'WalletRemovalSubmitted',
            args: {
                _transactionID: new BN(0),
                _wallet: registeredWallet1,
            },
            logIndex: 0,
        });

        // The second emitted event should be 'TransactionConfirmed', because
        // the wallet that submitted a wallet removal request should
        // confirm it afterwards.
        Event.assertEqual(events[1], {
            name: 'TransactionConfirmed',
            args: {
                _transactionID: new BN(0),
                _wallet: registeredWallet0,
            },
            logIndex: 1,
        });

        // The third emitted event should be 'TransactionExecutionSucceeded',
        // because of the setup 2-wallet-1-requirement.
        Event.assertEqual(events[2], {
            name: 'TransactionExecutionSucceeded',
            args: {
                _transactionID: new BN(0),
            },
            logIndex: 2,
        });

        const removeWalletTransactionID = events[0].args._transactionID;

        const transaction = await multisig.transactions.call(
            removeWalletTransactionID,
        );

        assert.isOk(
            (await multisig.transactionCount.call()).eqn(1),
            'After submitting a transaction, the transaction count is '
            + 'incremented by one, hence it should be equal to 1',
        );

        assert.strictEqual(
            transaction.destination,
            multisig.address,
            'Transaction destination address should be multisig wallet which '
            + 'removeWallet function will be called.',
        );

        assert.strictEqual(
            transaction.data,
            generateRemoveWalletData(registeredWallet1),
            'Transaction payload data should be removeWallet with a wallet '
            + 'as argument.',
        );

        assert.strictEqual(
            transaction.executed,
            true,
            'Transaction state should be executed as there is 2 wallet and '
            + '1 required setup.',
        );

        assert.isOk(
            await multisig.confirmations(
                removeWalletTransactionID,
                registeredWallet0,
            ),
            'Wallet that submits a wallet removal transaction, should '
            + 'confirm the transaction afterwards.',
        );

        assert.isOk(
            (await multisig.walletCount.call()).eqn(1),
            'As wallet removal was executed, wallet count should be 1.',
        );

        assert.strictEqual(
            await multisig.wallets.call(0),
            registeredWallet0,
            'As wallet removal was executed, the only wallet should be '
            + 'the submitter wallet',
        );

        assert.isNotOk(
            await multisig.isWallet.call(registeredWallet1),
            'As wallet removal was executed, wallet should not be registered',
        );
    });

    it('self removal', async () => {
        const required = 1;

        const registeredWallet0 = accounts[0];
        const registeredWallet1 = accounts[1];

        const wallets = [registeredWallet0, registeredWallet1];

        const multisig = await MultiSigWallet.new(wallets, required);

        const transactionResponse = await multisig.submitRemoveWallet(
            registeredWallet0,
            {
                from: registeredWallet0,
            },
        );

        const events = Event.decodeTransactionResponse(
            transactionResponse,
        );

        // The first emitted event should be 'WalletRemovalSubmitted'.
        Event.assertEqual(events[0], {
            name: 'WalletRemovalSubmitted',
            args: {
                _transactionID: new BN(0),
                _wallet: registeredWallet0,
            },
            logIndex: 0,
        });

        // The second emitted event should be 'TransactionConfirmed', because
        // the wallet that submitted a wallet removal request should
        // confirm it afterwards.
        Event.assertEqual(events[1], {
            name: 'TransactionConfirmed',
            args: {
                _transactionID: new BN(0),
                _wallet: registeredWallet0,
            },
            logIndex: 1,
        });

        // The third emitted event should be 'TransactionExecutionSucceeded',
        // because of the setup 2-wallet-1-requirement.
        Event.assertEqual(events[2], {
            name: 'TransactionExecutionSucceeded',
            args: {
                _transactionID: new BN(0),
            },
            logIndex: 2,
        });

        const removeWalletTransactionID = events[0].args._transactionID;

        const transaction = await multisig.transactions.call(
            removeWalletTransactionID,
        );

        assert.isOk(
            (await multisig.transactionCount.call()).eqn(1),
            'After submitting a transaction, the transaction count is '
            + 'incremented by one, hence it should be equal to 1',
        );

        assert.strictEqual(
            transaction.destination,
            multisig.address,
            'Transaction destination address should be multisig wallet which '
            + 'removeWallet function will be called.',
        );

        assert.strictEqual(
            transaction.data,
            generateRemoveWalletData(registeredWallet0),
            'Transaction payload data should be removeWallet with a wallet '
            + 'as argument.',
        );

        assert.strictEqual(
            transaction.executed,
            true,
            'Transaction state should be executed as there is 2 wallet and '
            + '1 required setup.',
        );

        assert.isOk(
            await multisig.confirmations(
                removeWalletTransactionID,
                registeredWallet0,
            ),
            'Wallet that submits a wallet removal transaction, should '
            + 'confirm the transaction afterwards.',
        );

        assert.isOk(
            (await multisig.walletCount.call()).eqn(1),
            'As wallet removal was executed, wallet count should be 1.',
        );

        assert.strictEqual(
            await multisig.wallets.call(0),
            registeredWallet1,
            'As wallet removal was executed, the only wallet should be '
            + 'the submitter wallet',
        );

        assert.isNotOk(
            await multisig.isWallet.call(registeredWallet0),
            'As wallet removal was executed, wallet should not be registered',
        );
    });

    it('change requirement', async () => {
        const required = 2;

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

        let events = Event.decodeTransactionResponse(
            transactionResponse,
        );

        const removeWalletTransactionID = events[0].args._transactionID;

        const transaction = await multisig.transactions.call(
            removeWalletTransactionID,
        );

        assert.strictEqual(
            transaction.executed,
            false,
            'Transaction state should not be executed as there is 2 wallet and '
            + '2 required setup.',
        );

        assert.isOk(
            await multisig.confirmations(
                removeWalletTransactionID,
                registeredWallet0,
            ),
            'Wallet that submits a wallet removal transaction, should '
            + 'confirm the transaction afterwards.',
        );

        assert.isNotOk(
            await multisig.confirmations(
                removeWalletTransactionID,
                registeredWallet1,
            ),
            'Wallet that dit not submit a wallet removal transaction, should '
            + 'not confirm the transaction in this stage.',
        );

        const confirmTransactionResponse = await multisig.confirmTransaction(
            removeWalletTransactionID,
            {
                from: registeredWallet1,
            },
        );

        events = Event.decodeTransactionResponse(
            confirmTransactionResponse,
        );

        // The first emitted event should be 'TransactionConfirmed'.
        Event.assertEqual(events[0], {
            name: 'TransactionConfirmed',
            args: {
                _transactionID: removeWalletTransactionID,
                _wallet: registeredWallet1,
            },
            logIndex: 0,
        });

        // The second emitted event should be 'TransactionExecutionSucceeded',
        // because of the setup 2-wallet-2-requirement and both wallets
        // has confirmed the transaction.
        Event.assertEqual(events[1], {
            name: 'TransactionExecutionSucceeded',
            args: {
                _transactionID: removeWalletTransactionID,
            },
            logIndex: 1,
        });

        assert.isOk(
            (await multisig.walletCount.call()).eqn(1),
            'As wallet removal was executed, wallet count should be 1.',
        );

        assert.strictEqual(
            await multisig.wallets.call(0),
            registeredWallet0,
            'As wallet removal was executed, the only wallet should be '
            + 'the submitter wallet',
        );

        assert.isNotOk(
            await multisig.isWallet.call(registeredWallet1),
            'As wallet removal was executed, wallet should not be registered',
        );

        assert.isOk(
            (await multisig.required.call()).eqn(1),
            'A required should be equal to 1, as after removing the '
            + 'wallet, it was adjusted to max wallet count.',
        );
    });
});
