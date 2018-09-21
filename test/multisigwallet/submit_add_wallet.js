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

contract('MultiSigWallet::submitAddWallet', async (accounts) => {
    it('negative testing: walletCount = 1, required = 1', async () => {
        const required = 1;

        const registeredWallet0 = accounts[0];
        const nonRegisteredWallet = accounts[1];
        const walletToAdd = accounts[2];
        const nullWallet = utils.NULL_ADDRESS;

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

        await utils.expectRevert(
            multisig.submitAddWallet(
                nullWallet,
                {
                    from: registeredWallet0,
                },
            ),
            'Null wallet cannot be submitted for addition.',
        );

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

    it('walletCount = 1, required = 1', async () => {
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

        // The first emitted event should be 'WalletAdditionSubmitted'.
        Event.assertEqual(events[0], {
            name: 'WalletAdditionSubmitted',
            args: {
                _transactionID: new BN(0),
                _wallet: walletToAdd,
            },
            logIndex: 0,
        });

        // The second emitted event should be 'TransactionConfirmed', because
        // the wallet that submitted a new wallet addition request should
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
        // because of the setup 1-wallet-1-requirement.
        Event.assertEqual(events[2], {
            name: 'TransactionExecutionSucceeded',
            args: {
                _transactionID: new BN(0),
            },
            logIndex: 2,
        });

        const addWalletTransactionID = events[0].args._transactionID;

        const transaction = await multisig.transactions.call(
            addWalletTransactionID,
        );

        assert.strictEqual(
            transaction.destination,
            multisig.address,
            'Transaction destination address should be multisig wallet which '
            + 'addWallet function will be called.',
        );

        assert.strictEqual(
            transaction.data,
            generateAddWalletData(walletToAdd),
            'Transaction payload data should be addWallet with a new wallet '
            + 'as argument.',
        );

        assert.strictEqual(
            transaction.executed,
            true,
            'Transaction state should be executed as there is 1 wallet and '
            + '1 required setup.',
        );

        assert.isOk(
            (await multisig.transactionCount.call()).eqn(1),
            'After submitting a transaction, the transaction count is '
            + 'incremented by one, hence it should be equal to 1',
        );

        assert.isOk(
            await multisig.confirmations(
                addWalletTransactionID,
                registeredWallet0,
            ),
            'Wallet that submits a new wallet addition transaction, should '
            + 'confirm the transaction afterwards.',
        );

        assert.isOk(
            (await multisig.required.call()).eqn(1),
            'Adding a wallet should not change the "required"',
        );

        assert.isOk(
            (await multisig.walletCount.call()).eqn(2),
            'As a wallet addition was executed, wallet count should be equal 2',
        );

        assert.isOk(
            await multisig.isWallet.call(walletToAdd),
            'As a wallet addition was executed, a new wallet should be in '
            + 'the registered wallet list.',
        );

        assert.strictEqual(
            await multisig.wallets.call(1),
            walletToAdd,
            'As a wallet addition was executed, a new wallet should be in '
            + 'the second position of wallets array.',
        );
    });

    it('walletCount = 2, required = 1', async () => {
        const required = 1;

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

        // The first emitted event should be 'WalletAdditionSubmitted'.
        Event.assertEqual(events[0], {
            name: 'WalletAdditionSubmitted',
            args: {
                _transactionID: new BN(0),
                _wallet: walletToAdd,
            },
            logIndex: 0,
        });

        // The second emitted event should be 'TransactionConfirmed', because
        // the wallet that submitted a new wallet addition request should
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
        // because of the setup 1-wallet-1-requirement.
        Event.assertEqual(events[2], {
            name: 'TransactionExecutionSucceeded',
            args: {
                _transactionID: new BN(0),
            },
            logIndex: 2,
        });

        const addWalletTransactionID = events[0].args._transactionID;

        const transaction = await multisig.transactions.call(
            addWalletTransactionID,
        );

        assert.strictEqual(
            transaction.destination,
            multisig.address,
            'Transaction destination address should be multisig wallet which '
            + 'addWallet function will be called.',
        );

        assert.strictEqual(
            transaction.data,
            generateAddWalletData(walletToAdd),
            'Transaction payload data should be addWallet with a new wallet '
            + 'as argument.',
        );

        assert.strictEqual(
            transaction.executed,
            true,
            'Transaction state should be executed as there is 2 wallets and '
            + '1 required setup.',
        );

        assert.isOk(
            (await multisig.transactionCount.call()).eqn(1),
            'After submitting a transaction, the transaction count is '
            + 'incremented by one, hence it should be equal to 1',
        );

        assert.isOk(
            await multisig.confirmations(
                addWalletTransactionID,
                registeredWallet0,
            ),
            'Wallet that submits a new wallet addition transaction, should '
            + 'confirm the transaction afterwards.',
        );

        assert.isNotOk(
            await multisig.confirmations(
                addWalletTransactionID,
                registeredWallet1,
            ),
            'Wallet that did not submit a wallet addition transaction, should '
            + 'not confirm the transaction.',
        );

        assert.isOk(
            (await multisig.required.call()).eqn(1),
            'Adding a wallet should not change the "required"',
        );

        assert.isOk(
            (await multisig.walletCount.call()).eqn(3),
            'As a wallet addition was executed, wallet count should be equal 3',
        );

        assert.isOk(
            await multisig.isWallet.call(walletToAdd),
            'As a wallet addition was executed, a new wallet should be in '
            + 'the registered wallet list.',
        );

        assert.strictEqual(
            await multisig.wallets.call(2),
            walletToAdd,
            'As a wallet addition was executed, a new wallet should be in '
            + 'the third position of wallets array.',
        );
    });

    it('walletCount = 2, required = 2', async () => {
        const required = 2;

        const registeredWallet0 = accounts[0];
        const registeredWallet1 = accounts[1];
        const walletToAdd = accounts[2];

        const wallets = [registeredWallet0, registeredWallet1];

        const multisig = await MultiSigWallet.new(wallets, required);

        const addWalletTransactionResponse = await multisig.submitAddWallet(
            walletToAdd,
            {
                from: registeredWallet0,
            },
        );

        const events = Event.decodeTransactionResponse(
            addWalletTransactionResponse,
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

        // The second emitted event should be 'TransactionConfirmed', because
        // the wallet that submitted a new wallet addition request should
        // confirm it afterwards.
        Event.assertEqual(events[1], {
            name: 'TransactionConfirmed',
            args: {
                _transactionID: new BN(0),
                _wallet: registeredWallet0,
            },
            logIndex: 1,
        });

        const addWalletTransactionID = events[0].args._transactionID;

        const transaction = await multisig.transactions.call(
            addWalletTransactionID,
        );

        assert.strictEqual(
            transaction.destination,
            multisig.address,
            'Transaction destination address should be multisig wallet which '
            + 'addWallet function will be called.',
        );

        assert.strictEqual(
            transaction.data,
            generateAddWalletData(walletToAdd),
            'Transaction payload data should be addWallet with a new wallet '
            + 'as argument.',
        );

        assert.strictEqual(
            transaction.executed,
            false,
            'Transaction state should be non-executed as there is 2 wallets '
            + 'and 2 required setup.',
        );

        assert.isOk(
            (await multisig.transactionCount.call()).eqn(1),
            'After submitting a transaction, the transaction count is '
            + 'incremented by one, hence it should be equal to 1',
        );

        assert.isOk(
            await multisig.confirmations(
                addWalletTransactionID,
                registeredWallet0,
            ),
            'Wallet that submits a new wallet addition transaction, should '
            + 'confirm the transaction afterwards.',
        );

        assert.isNotOk(
            await multisig.confirmations(
                addWalletTransactionID,
                registeredWallet1,
            ),
            'Wallet that did not submit a wallet addition transaction, should '
            + 'not confirm the transaction.',
        );

        assert.isOk(
            (await multisig.required.call()).eqn(2),
            'Adding a wallet should not change the "required"',
        );

        assert.isOk(
            (await multisig.walletCount.call()).eqn(2),
            'As a wallet addition was not executed, wallet count '
            + 'should be equal 2',
        );

        assert.isNotOk(
            await multisig.isWallet.call(walletToAdd),
            'As a wallet addition was not executed, a new wallet should not be '
            + 'in the registered wallet list.',
        );
    });
});
