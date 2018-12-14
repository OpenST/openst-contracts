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
const { TokenHolderUtils } = require('./utils.js');
const { Event } = require('../test_lib/event_decoder');
const { AccountProvider } = require('../test_lib/utils.js');

async function prepare(
    accountProvider,
    spendingLimit, deltaExpirationHeight,
) {
    const { utilityToken } = await TokenHolderUtils.createUtilityMockToken();

    const { tokenRules } = await TokenHolderUtils.createMockTokenRules();

    const authorizedSessionPublicKey = accountProvider.get();

    const {
        tokenHolderOwnerAddress,
        tokenHolder,
    } = await TokenHolderUtils.createTokenHolder(
        accountProvider,
        utilityToken, tokenRules,
        spendingLimit, deltaExpirationHeight,
        authorizedSessionPublicKey,
    );

    await TokenHolderUtils.authorizeSessionKey(
        tokenHolder, tokenHolderOwnerAddress,
        authorizedSessionPublicKey, spendingLimit, deltaExpirationHeight,
    );

    return {
        utilityToken,
        tokenRules,
        tokenHolderOwnerAddress,
        tokenHolder,
        authorizedSessionPublicKey,
    };
}

contract('TokenHolder::revokeSelfSession', async () => {
    contract('Negative Tests', async (accounts) => {
        const accountProvider = new AccountProvider(accounts);

        it('Reverts if caller is not a registered session key.', async () => {
            const {
                tokenHolder,
            } = await prepare(
                accountProvider,
                10 /* spendingLimit */,
                50 /* deltaExpirationHeight */,
            );

            await utils.expectRevert(
                tokenHolder.revokeSelfSession(
                    {
                        from: accountProvider.get(),
                    },
                ),
                'Should revert as caller is not a registered session key.',
                'Key is not authorized.',
            );
        });

        it('Reverts if key to revoke is already revoked.', async () => {
            const {
                tokenHolder,
                authorizedSessionPublicKey,
            } = await prepare(
                accountProvider,
                10 /* spendingLimit */,
                50 /* deltaExpirationHeight */,
            );

            await tokenHolder.revokeSelfSession(
                { from: authorizedSessionPublicKey },
            );

            await utils.expectRevert(
                tokenHolder.revokeSelfSession(
                    { from: authorizedSessionPublicKey },
                ),
                'Should revert as key to revoke was already revoked.',
                'Key is not authorized.',
            );
        });
    });

    contract('Events', async (accounts) => {
        const accountProvider = new AccountProvider(accounts);

        it('Emits SessionRevoked event.', async () => {
            const {
                tokenHolder,
                authorizedSessionPublicKey,
            } = await prepare(
                accountProvider,
                10 /* spendingLimit */,
                50 /* deltaExpirationHeight */,
            );

            const transactionResponse = await tokenHolder.revokeSelfSession(
                { from: authorizedSessionPublicKey },
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
                    _sessionKey: authorizedSessionPublicKey,
                },
            });
        });
    });

    contract('Storage', async (accounts) => {
        const accountProvider = new AccountProvider(accounts);

        it('Checks that key is revoked after successfull revocation.', async () => {
            const {
                tokenHolder,
                authorizedSessionPublicKey,
            } = await prepare(
                accountProvider,
                10 /* spendingLimit */,
                50 /* deltaExpirationHeight */,
            );

            let keyData = await tokenHolder.sessionKeys.call(
                authorizedSessionPublicKey,
            );

            assert.isOk(
                // TokenHolder.AuthorizationStatus.AUTHORIZED == 1
                keyData.status.eqn(1),
            );

            await tokenHolder.revokeSelfSession(
                { from: authorizedSessionPublicKey },
            );

            keyData = await tokenHolder.sessionKeys.call(
                authorizedSessionPublicKey,
            );

            assert.isOk(
                // TokenHolder.AuthorizationStatus.REVOKED == 2
                keyData.status.eqn(2),
            );
        });
    });
});
