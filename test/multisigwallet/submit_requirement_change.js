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
// Test: MultiSigWallet::submitRequirementChange
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const BN = require('bn.js');
const web3 = require('../test_lib/web3.js');
const utils = require('../test_lib/utils.js');
const { Event } = require('../test_lib/event_decoder.js');
const { MultiSigWalletHelper } = require('../test_lib/multisigwallet_helper.js');

const MultiSigWallet = artifacts.require('MultiSigWallet');

function generateRequirementChangeData(required) {
    return web3.eth.abi.encodeFunctionCall(
        {
            name: 'changeRequirement',
            type: 'function',
            inputs: [{
                type: 'uint256',
                name: '',
            }],
        },
        [required],
    );
}

contract('MultiSigWallet::submitRequirementChange', async () => {
    contract('Negative testing for input parameters.', async (accounts) => {
        it('Non registered wallet submits a wallet removal.', async () => {
            const required = 1;

            const registeredWallet0 = accounts[0];
            const registeredWallet1 = accounts[1];
            const nonRegisteredWallet = accounts[2];

            const newRequired = 2;

            const wallets = [registeredWallet0, registeredWallet1];

            const multisig = await MultiSigWallet.new(wallets, required);

            await utils.expectRevert(
                multisig.submitRequirementChange(
                    newRequired,
                    {
                        from: nonRegisteredWallet,
                    },
                ),
                'Non registered wallet cannot submit a requirement change.',
            );
        });

        contract('Submitting invalid requirement.', async () => {
            it('Required is 0.', async () => {
                const required = 1;

                const registeredWallet0 = accounts[0];

                const wallets = [registeredWallet0];

                const multisig = await MultiSigWallet.new(wallets, required);

                const newRequired = 0;

                await utils.expectRevert(
                    multisig.submitRequirementChange(
                        newRequired,
                        {
                            from: registeredWallet0,
                        },
                    ),
                    'Required is 0.',
                );
            });
            it('Required is bigger then wallet counts.', async () => {
                const required = 1;

                const registeredWallet0 = accounts[0];

                const wallets = [registeredWallet0];

                const multisig = await MultiSigWallet.new(wallets, required);

                const newRequired = 2;

                await utils.expectRevert(
                    multisig.submitRequirementChange(
                        newRequired,
                        {
                            from: registeredWallet0,
                        },
                    ),
                    'Wallets count is 1 and proposed required is 2.',
                );
            });
        });
    });
    contract('Events', async (accounts) => {
        it('Submit => Confirm => Execute', async () => {
            const required = 1;

            const registeredWallet0 = accounts[0];
            const registeredWallet1 = accounts[1];

            const wallets = [registeredWallet0, registeredWallet1];

            const multisig = await MultiSigWallet.new(wallets, required);

            const newRequired = 2;

            const transactionResponse = await multisig.submitRequirementChange(
                newRequired,
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
                + 'afterwards, hence RequirementChangeSubmitted, '
                + 'TransactionConfirmed and TransactionExecutionSucceeded '
                + 'would be emitted.',
            );

            // The first emitted event should be 'RequirementChangeSubmitted'.
            Event.assertEqual(events[0], {
                name: 'RequirementChangeSubmitted',
                args: {
                    _transactionID: new BN(0),
                    _required: new BN(newRequired),
                },
                logIndex: 0,
            });

            // The second emitted event should be 'TransactionConfirmed', as
            // the wallet that submits transaction confirms afterwards.
            Event.assertEqual(events[1], {
                name: 'TransactionConfirmed',
                args: {
                    _transactionID: new BN(0),
                    _wallet: registeredWallet0,
                },
                logIndex: 1,
            });

            // The third emitted event should be 'TransactionExecutionSucceeded'
            // as requirement is 1, hence transaction would be executed
            // afterwards.
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
            const registeredWallet2 = accounts[2];

            const wallets = [
                registeredWallet0, registeredWallet1, registeredWallet2,
            ];

            const multisig = await MultiSigWallet.new(wallets, required);

            const newRequired = 3;

            const transactionResponse = await multisig.submitRequirementChange(
                newRequired,
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
                + 'afterwards, hence RequirementChangeSubmitted and '
                + 'TransactionConfirmed would be emitted.',
            );

            // The first emitted event should be 'RequirementChangeSubmitted'.
            Event.assertEqual(events[0], {
                name: 'RequirementChangeSubmitted',
                args: {
                    _transactionID: new BN(0),
                    _required: new BN(newRequired),
                },
                logIndex: 0,
            });

            // The second emitted event should be 'TransactionConfirmed', as
            // the wallet that submits transaction confirms afterwards.
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
            const registeredWallet1 = accounts[1];

            const wallets = [registeredWallet0, registeredWallet1];

            const multisig = await MultiSigWallet.new(wallets, required);

            const newRequired = 2;

            const transactionID = await MultiSigWalletHelper.submitRequirementChange(
                multisig,
                newRequired,
                {
                    from: registeredWallet0,
                },
            );

            assert.isOk(
                (await multisig.required.call()).eqn(newRequired),
                'As required is equal to 1, the transaction would be '
                + 'executed in the same call.',
            );

            assert.isOk(
                await multisig.confirmations(transactionID, registeredWallet0),
                'Submitter should also confirm.',
            );

            assert.isNotOk(
                await multisig.confirmations(transactionID, registeredWallet1),
                'Non submitter should not confirm.',
            );

            assert.isOk(
                (await multisig.transactionCount.call()).eqn(1),
                'Transaction count should be increased by one.',
            );

            const transaction = await multisig.transactions.call(transactionID);

            assert.strictEqual(
                transaction.destination,
                multisig.address,
            );

            assert.strictEqual(
                transaction.data,
                generateRequirementChangeData(newRequired),
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

            const newRequired = 3;

            const transactionID = await MultiSigWalletHelper.submitRequirementChange(
                multisig,
                newRequired,
                {
                    from: registeredWallet0,
                },
            );

            assert.isOk(
                (await multisig.required.call()).eqn(required),
                'As required is equal to 2, the transaction would not be '
                + 'executed in the same call.',
            );

            assert.isOk(
                await multisig.confirmations(transactionID, registeredWallet0),
                'Submitter should also confirm.',
            );

            assert.isNotOk(
                await multisig.confirmations(transactionID, registeredWallet1),
                'Non submitter should not confirm.',
            );

            assert.isNotOk(
                await multisig.confirmations(transactionID, registeredWallet2),
                'Non submitter should not confirm.',
            );

            assert.isOk(
                (await multisig.transactionCount.call()).eqn(1),
                'Transaction count should be increased by one.',
            );

            const transaction = await multisig.transactions.call(transactionID);

            assert.strictEqual(
                transaction.destination,
                multisig.address,
            );

            assert.strictEqual(
                transaction.data,
                generateRequirementChangeData(newRequired),
            );

            assert.strictEqual(
                transaction.executed,
                false,
            );
        });
    });
});
