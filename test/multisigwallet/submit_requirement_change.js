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
const { Event } = require('../test_lib/event_decoder');
const { AccountProvider } = require('../test_lib/utils.js');
const { MultiSigWalletUtils } = require('./utils.js');


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
    contract('Negative Tests', async (accounts) => {
        const accountProvider = new AccountProvider(accounts);

        it('Reverts if non-registered wallet calls.', async () => {
            const helper = await new MultiSigWalletUtils(
                { accountProvider, walletCount: 2, required: 1 },
            );


            await utils.expectRevert(
                helper.multisig().submitRequirementChange(
                    2,
                    { from: accountProvider.get() },
                ),
                'Should revert as non-registered wallet calls.',
                'Only wallet is allowed to call.',
            );
        });

        it('Should revert if new requirement equal to 0.', async () => {
            const helper = await new MultiSigWalletUtils(
                { accountProvider, walletCount: 1, required: 1 },
            );

            await utils.expectRevert(
                helper.multisig().submitRequirementChange(
                    0,
                    { from: helper.wallet(0) },
                ),
                'Should revert as new requirement is 0.',
                'Requirement validity not fulfilled.',
            );
        });

        it('Should revert if new requirement is bigger than wallets count.', async () => {
            const helper = await new MultiSigWalletUtils(
                { accountProvider, walletCount: 1, required: 1 },
            );

            await utils.expectRevert(
                helper.multisig().submitRequirementChange(
                    2,
                    { from: helper.wallet(0) },
                ),
                'Should revert as new requirement is 2 and wallet counts is 1.',
                'Requirement validity not fulfilled.',
            );
        });
    });

    contract('Events', async (accounts) => {
        const accountProvider = new AccountProvider(accounts);

        it('Emits RequirementChangeSubmitted, TransactionConfirmed '
        + 'TransactionExecutionSucceeded events.', async () => {
            const helper = await new MultiSigWalletUtils(
                { accountProvider, walletCount: 2, required: 1 },
            );

            const newRequired = 2;

            const transactionResponse = await helper.multisig().submitRequirementChange(
                newRequired,
                { from: helper.wallet(0) },
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
            });

            // The second emitted event should be 'TransactionConfirmed', as
            // the wallet that submits transaction confirms afterwards.
            Event.assertEqual(events[1], {
                name: 'TransactionConfirmed',
                args: {
                    _transactionID: new BN(0),
                    _wallet: helper.wallet(0),
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

        it('Emits RequirementChangeSubmitted and TransactionConfirmed.', async () => {
            const helper = await new MultiSigWalletUtils(
                { accountProvider, walletCount: 3, required: 2 },
            );

            const newRequired = 3;

            const transactionResponse = await helper.multisig().submitRequirementChange(
                newRequired,
                { from: helper.wallet(0) },
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
            });

            // The second emitted event should be 'TransactionConfirmed', as
            // the wallet that submits transaction confirms afterwards.
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

            const newRequired = 2;

            const transactionID = await helper.submitRequirementChange(
                newRequired,
                0,
            );

            assert.isOk(
                (await helper.multisig().required.call()).eqn(newRequired),
                'As required is equal to 1, the transaction would be '
                + 'executed in the same call.',
            );

            assert.isOk(
                await helper.multisig().confirmations(
                    transactionID, helper.wallet(0),
                ),
                'Submitter should also confirm.',
            );

            assert.isNotOk(
                await helper.multisig().confirmations(
                    transactionID, helper.wallet(1),
                ),
                'Non submitter should not confirm.',
            );

            assert.isOk(
                (await helper.multisig().transactionCount.call()).eqn(1),
                'Transaction count should be increased by one.',
            );

            const transaction = await helper.multisig().transactions.call(transactionID);

            assert.strictEqual(
                transaction.destination,
                helper.multisig().address,
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

        it('Checks state in case of 3-wallets-2-required.', async () => {
            const helper = await new MultiSigWalletUtils(
                { accountProvider, walletCount: 3, required: 2 },
            );

            const required = 2;
            const newRequired = 3;

            const transactionID = await helper.submitRequirementChange(
                newRequired, 0,
            );

            assert.isOk(
                (await helper.multisig().required.call()).eqn(required),
                'As required is equal to 2, the transaction would not be '
                + 'executed in the same call.',
            );

            assert.isOk(
                await helper.multisig().confirmations(
                    transactionID, helper.wallet(0),
                ),
                'Submitter should also confirm.',
            );

            assert.isNotOk(
                await helper.multisig().confirmations(
                    transactionID, helper.wallet(1),
                ),
                'Non submitter should not confirm.',
            );

            assert.isNotOk(
                await helper.multisig().confirmations(transactionID, helper.wallet(2)),
                'Non submitter should not confirm.',
            );

            assert.isOk(
                (await helper.multisig().transactionCount.call()).eqn(1),
                'Transaction count should be increased by one.',
            );

            const transaction = await helper.multisig().transactions.call(transactionID);

            assert.strictEqual(
                transaction.destination,
                helper.multisig().address,
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
