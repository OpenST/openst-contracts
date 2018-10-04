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

const MultiSigWallet = artifacts.require('MultiSigWallet');

contract('MultiSigWallet::constructor', async () => {
    contract('Negative Tests', async (accounts) => {
        const accountProvider = new AccountProvider(accounts);

        it('Reverts if wallets array contains null address.', async () => {
            const registeredWallet0 = accountProvider.get();
            const nullWallet = utils.NULL_ADDRESS;

            const walletsWithNull = [registeredWallet0, nullWallet];

            await utils.expectRevert(
                MultiSigWallet.new(walletsWithNull, 1),
                'Should revert as wallets array contains null address.',
                'Wallet address is 0.',
            );
        });

        it('Reverts if wallets array contains duplicate entries.', async () => {
            const registeredWallet0 = accountProvider.get();
            const walletsWithDuplicate = [registeredWallet0, registeredWallet0];

            await utils.expectRevert(
                MultiSigWallet.new(walletsWithDuplicate, 1),
                'Should revert as wallets array contains duplicate entry.',
                'Duplicate wallet address.',
            );
        });
    });

    contract('Storage', async (accounts) => {
        const accountProvider = new AccountProvider(accounts);

        it('Checks that passed arguments are set correctly.', async () => {
            const required = 2;
            const registeredWallet0 = accountProvider.get();
            const registeredWallet1 = accountProvider.get();

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
});
