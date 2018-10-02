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

const web3 = require('../test_lib/web3.js');
const utils = require('../test_lib/utils.js');
const { Event } = require('../test_lib/event_decoder');
const { AccountProvider } = require('../test_lib/utils.js');

const TokenHolder = artifacts.require('TokenHolder');

async function createTokenHolder(
    accountProvider,
) {
    const required = 1;

    const registeredWallet0 = accountProvider.get();

    const wallets = [registeredWallet0];

    const tokenAddress = accountProvider.get();
    const tokenRulesAddress = accountProvider.get();

    const tokenHolder = await TokenHolder.new(
        tokenAddress, tokenRulesAddress, wallets, required,
    );

    return {
        tokenHolder,
        registeredWallet0,
    };
}

async function prepareTokenHolder(
    accountProvider, ephemeralKey,
) {
    const {
        tokenHolder,
        registeredWallet0,
    } = await createTokenHolder(accountProvider);

    const spendingLimit = 1;
    const expirationHeight = (await web3.eth.getBlockNumber()) + 10;

    await tokenHolder.submitAuthorizeSession(
        ephemeralKey,
        spendingLimit,
        expirationHeight,
        {
            from: registeredWallet0,
        },
    );

    return {
        tokenHolder,
        registeredWallet0,
    };
}

contract('TokenHolder::revokeSession', async () => {
    contract('Negative Tests', async (accounts) => {
        const accountProvider = new AccountProvider(accounts);

        it('Reverts if non-registered wallet calls.', async () => {
            const ephemeralKey = '0x62502C4DF73935D0D10054b0Fb8cC036534C6fb0';

            const {
                tokenHolder,
            } = await prepareTokenHolder(accountProvider, ephemeralKey);

            await utils.expectRevert(
                tokenHolder.revokeSession(
                    ephemeralKey,
                    {
                        from: accountProvider.get(),
                    },
                ),
                'Should revert as non-registered wallet calls.',
                'Only wallet is allowed to call',
            );
        });

        it('Reverts if key to revoke does not exist.', async () => {
            const {
                tokenHolder,
                registeredWallet0,
            } = await createTokenHolder(accountProvider);

            const ephemeralKey = '0x62502C4DF73935D0D10054b0Fb8cC036534C6fb0';

            await utils.expectRevert(
                tokenHolder.revokeSession(
                    ephemeralKey,
                    { from: registeredWallet0 },
                ),
                'Should revert as key to revoke does not exist.',
                'Key is not authorized',
            );
        });

        it('Reverts if key to revoke is already revoked.', async () => {
            const ephemeralKey = '0x62502C4DF73935D0D10054b0Fb8cC036534C6fb0';

            const {
                tokenHolder,
                registeredWallet0,
            } = await prepareTokenHolder(accountProvider, ephemeralKey);

            await tokenHolder.revokeSession(
                ephemeralKey,
                { from: registeredWallet0 },
            );

            await utils.expectRevert(
                tokenHolder.revokeSession(
                    ephemeralKey,
                    { from: registeredWallet0 },
                ),
                'Should revert as key to revoke was already revoked.',
                'Key is not authorized',
            );
        });
    });

    contract('Events', async (accounts) => {
        const accountProvider = new AccountProvider(accounts);

        it('Emits SessionRevoked event.', async () => {
            const ephemeralKey = '0x62502C4DF73935D0D10054b0Fb8cC036534C6fb0';

            const {
                tokenHolder,
                registeredWallet0,
            } = await prepareTokenHolder(accountProvider, ephemeralKey);

            const transactionResponse = await tokenHolder.revokeSession(
                ephemeralKey,
                { from: registeredWallet0 },
            );

            const events = Event.decodeTransactionResponse(
                transactionResponse,
            );

            assert.strictEqual(
                events.length,
                1,
            );

            // The only emitted event should be 'SessionRevoked'.
            Event.assertEqual(events[0], {
                name: 'SessionRevoked',
                args: {
                    _ephemeralKey: ephemeralKey,
                },
            });
        });
    });

    contract('Storage', async (accounts) => {
        const accountProvider = new AccountProvider(accounts);

        it('Checks that key is revoked after successfull revocation.', async () => {
            const ephemeralKey = '0x62502C4DF73935D0D10054b0Fb8cC036534C6fb0';

            const {
                tokenHolder,
                registeredWallet0,
            } = await prepareTokenHolder(accountProvider, ephemeralKey);

            let keyData = await tokenHolder.ephemeralKeys.call(ephemeralKey);

            assert.isOk(
                // TokenHolder.AuthorizationStatus.AUTHORIZED == 1
                keyData.status.eqn(1),
            );

            await tokenHolder.revokeSession(
                ephemeralKey,
                { from: registeredWallet0 },
            );

            keyData = await tokenHolder.ephemeralKeys.call(ephemeralKey);

            assert.isOk(
                // TokenHolder.AuthorizationStatus.REVOKED == 2
                keyData.status.eqn(2),
            );
        });
    });
});
