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
const utils = require('../test_lib/utils.js');
const { MultiSigWalletHelper } = require('../test_lib/multisigwallet_helper.js');

const MultiSigWallet = artifacts.require('MultiSigWallet');

contract('MultiSigWallet::isTransactionConfirmed', async (accounts) => {
    it('Non existing transaction ID should revert.', async () => {
        const required = 1;

        const registeredWallet0 = accounts[0];

        const wallets = [registeredWallet0];

        const multisig = await MultiSigWallet.new(wallets, required);

        const nonExistingTransactionID = 0;

        await utils.expectRevert(
            multisig.isTransactionConfirmed.call(
                nonExistingTransactionID,
                {
                    from: registeredWallet0,
                },
            ),
        );
    });

    it('1-wallet-1-required', async () => {
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
            await multisig.isTransactionConfirmed.call(transactionID),
            'Because of required being 1 the transaction would be immediately '
            + 'confirmed by the submitter.',
        );
    });

    it('2-wallets-2-required', async () => {
        const required = 2;

        const registeredWallet0 = accounts[0];
        const registeredWallet1 = accounts[1];
        const walletToReplace = accounts[2];
        const walletToAdd = accounts[3];

        const wallets = [registeredWallet0, registeredWallet1];

        const multisig = await MultiSigWallet.new(wallets, required);

        const addWalletTransactionID = await MultiSigWalletHelper
            .submitAddWallet(
                multisig,
                walletToAdd,
                {
                    from: registeredWallet0,
                },
            );

        assert.isNotOk(
            await multisig.isTransactionConfirmed.call(addWalletTransactionID),
            'Because of required being 2 the transaction is not yet confirmed.',
        );

        await multisig.confirmTransaction(
            addWalletTransactionID,
            {
                from: registeredWallet1,
            },
        );

        assert.isOk(
            await multisig.isTransactionConfirmed.call(addWalletTransactionID),
            'Transaction should be confirmed because the submitter confirms '
            + 'the transaction in the same call, and second wallet has just '
            + 'confirmed it',
        );

        const replaceWalletTransactionID = await MultiSigWalletHelper
            .submitReplaceWallet(
                multisig,
                registeredWallet1,
                walletToReplace,
                {
                    from: registeredWallet0,
                },
            );

        await multisig.confirmTransaction(
            replaceWalletTransactionID,
            {
                from: registeredWallet1,
            },
        );

        assert.isOk(
            await multisig.isTransactionConfirmed.call(addWalletTransactionID),
            'Despite that the wallet that has confirmed the transaction '
            + 'was replaced with the one that has not yet confirmed it, '
            + 'function returns true because the transaction was executed',
        );
    });
});
