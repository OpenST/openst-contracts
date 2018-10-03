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

const utils = require('../test_lib/utils.js');
const { AccountProvider } = require('../test_lib/utils.js');
const { MultiSigWalletUtils } = require('./utils.js');

contract('MultiSigWallet::isTransactionConfirmed', async (accounts) => {
    const accountProvider = new AccountProvider(accounts);

    it('Reverts if transaction ID does not exist.', async () => {
        const helper = await new MultiSigWalletUtils(
            { accountProvider, walletCount: 1, required: 1 },
        );

        const nonExistingTransactionID = 11;

        await utils.expectRevert(
            helper.multisig().isTransactionConfirmed.call(
                nonExistingTransactionID,
                { from: helper.wallet(0) },
            ),
            'Should revert as transaction ID does not exist.'
        );
    });

    it('Checks transaction confirmation status for 1-wallet-1-required setup.', async () => {
        const helper = await new MultiSigWalletUtils(
            { accountProvider, walletCount: 1, required: 1 },
        );

        const transactionID = await helper.submitAddWallet(
            accountProvider.get(), 0,
        );

        assert.isOk(
            await helper.multisig().isTransactionConfirmed.call(transactionID),
            'Because of required being 1 the transaction would be immediately '
            + 'confirmed by the submitter.',
        );
    });

    it('Checks transaction confirmation status for  2-wallets-2-required setup.', async () => {
        const helper = await new MultiSigWalletUtils(
            { accountProvider, walletCount: 2, required: 2 },
        );

        const addWalletTransactionID = await helper.submitAddWallet(
            accountProvider.get(), 0,
        );

        assert.isNotOk(
            await helper.multisig().isTransactionConfirmed.call(addWalletTransactionID),
            'Because of required being 2 the transaction is not yet confirmed.',
        );

        await helper.multisig().confirmTransaction(
            addWalletTransactionID,
            { from: helper.wallet(1) },
        );

        assert.isOk(
            await helper.multisig().isTransactionConfirmed.call(addWalletTransactionID),
            'Transaction should be confirmed because the submitter confirms '
            + 'the transaction in the same call, and second wallet has just '
            + 'confirmed it',
        );

        const replaceWalletTransactionID = await helper.submitReplaceWallet(
            1, accountProvider.get(), 0,
        );

        await helper.multisig().confirmTransaction(
            replaceWalletTransactionID,
            { from: helper.wallet(1) },
        );

        assert.isOk(
            await helper.multisig().isTransactionConfirmed.call(addWalletTransactionID),
            'Despite that the wallet that has confirmed the transaction '
            + 'was replaced with the one that has not yet confirmed it, '
            + 'function returns true because the transaction was executed',
        );
    });
});
