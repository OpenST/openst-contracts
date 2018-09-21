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

const utils = require('../lib/utils.js');

const MultiSigWallet = artifacts.require('MultiSigWallet');

contract('MultiSigWallet::constructor', async (accounts) => {
    it('negative testing', async () => {
        const registeredWallet0 = accounts[0];
        const duplicateWallet = accounts[0];
        const nullWallet = utils.NULL_ADDRESS;

        const walletsWithDuplicate = [registeredWallet0, duplicateWallet];
        const walletsWithNull = [registeredWallet0, nullWallet];

        await utils.expectRevert(
            MultiSigWallet.new(walletsWithNull, 1),
            'Wallets with null entries should revert construction.',
        );

        await utils.expectRevert(
            MultiSigWallet.new(walletsWithDuplicate, 1),
            'Wallets with duplicate entries should revert construction.',
        );
    });

    it('input validity', async () => {
        const required = 2;
        const registeredWallet0 = accounts[0];
        const registeredWallet1 = accounts[1];

        const wallets = [registeredWallet0, registeredWallet1];

        const multisig = await MultiSigWallet.new(wallets, required);

        assert.isOk(
            (await multisig.required.call()).eqn(required),
        );

        assert.isOk(
            (await multisig.walletCount.call()).eqn(2),
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
            await multisig.isWallet.call(registeredWallet0),
        );

        assert.isOk(
            await multisig.isWallet.call(registeredWallet1),
        );

        assert.isOk(
            (await multisig.required.call()).eqn(required),
            'After submitting a transaction, the transaction count is '
            + 'incremented by one, hence it should be equal to 1',
        );

        assert.isOk(
            (await multisig.transactionCount.call()).eqn(0),
        );
    });
});
