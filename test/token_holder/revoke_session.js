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
const web3 = require('../test_lib/web3.js');
const utils = require('../test_lib/utils.js');
const { Event } = require('../test_lib/event_decoder');

const TokenHolder = artifacts.require('TokenHolder');

contract('TokenHolder::revokeSession', async () => {
    contract('Negative testing for input parameters:', async (accounts) => {
        it('Non registered wallet requests session revocation.', async () => {
            const required = 1;

            const registeredWallet0 = accounts[0];
            const nonRegisteredWallet = accounts[1];

            const wallets = [registeredWallet0];

            const brandedToken = accounts[2];
            const tokenRules = accounts[3];

            const ephemeralKey = '0x62502C4DF73935D0D10054b0Fb8cC036534C6fb0';
            const spendingLimit = 1;
            const expirationHeight = (await web3.eth.getBlockNumber()) + 10;

            const tokenHolder = await TokenHolder.new(
                brandedToken, tokenRules, wallets, required,
            );

            await tokenHolder.submitAuthorizeSession(
                ephemeralKey,
                spendingLimit,
                expirationHeight,
                {
                    from: registeredWallet0,
                },
            );

            const keyData = await tokenHolder.ephemeralKeys.call(ephemeralKey);

            assert.isOk(
                // TokenHolder.AuthorizationStatus.AUTHORIZED == 1
                keyData.status.eqn(1),
            );

            await utils.expectRevert(
                tokenHolder.submitAuthorizeSession(
                    ephemeralKey,
                    spendingLimit,
                    expirationHeight,
                    {
                        from: nonRegisteredWallet,
                    },
                ),
                'Non registered wallet cannot request session revocation.',
            );
        });
        it('Key to revoke is not in the authorized state.', async () => {
            const required = 1;

            const registeredWallet0 = accounts[0];

            const wallets = [registeredWallet0];

            const brandedToken = accounts[1];
            const tokenRules = accounts[2];

            const ephemeralKey = '0x62502C4DF73935D0D10054b0Fb8cC036534C6fb0';

            const tokenHolder = await TokenHolder.new(
                brandedToken, tokenRules, wallets, required,
            );

            await utils.expectRevert(
                tokenHolder.revokeSession(
                    ephemeralKey,
                    {
                        from: registeredWallet0,
                    },
                ),
                'Key to revoke is not in the authorized state.',
            );
        });
    });
    contract('Events', async (accounts) => {
        it('SessionRevoked is emitted.', async () => {
            const required = 1;

            const registeredWallet0 = accounts[0];

            const wallets = [registeredWallet0];

            const brandedToken = accounts[1];
            const tokenRules = accounts[2];

            const tokenHolder = await TokenHolder.new(
                brandedToken, tokenRules, wallets, required,
            );

            const ephemeralKey = '0x62502C4DF73935D0D10054b0Fb8cC036534C6fb0';
            const spendingLimit = 1;
            const expirationHeight = await web3.eth.getBlockNumber() + 50;

            await tokenHolder.submitAuthorizeSession(
                ephemeralKey,
                spendingLimit,
                expirationHeight,
                {
                    from: registeredWallet0,
                },
            );

            const transactionResponse = await tokenHolder.revokeSession(
                ephemeralKey,
                {
                    from: registeredWallet0,
                },
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
                logIndex: 0,
            });
        });
    });

    contract('Storage', async (accounts) => {
        it('Revocation happens.', async () => {
            const required = 1;

            const registeredWallet0 = accounts[0];

            const wallets = [registeredWallet0];

            const brandedToken = accounts[1];
            const tokenRules = accounts[2];

            const tokenHolder = await TokenHolder.new(
                brandedToken, tokenRules, wallets, required,
            );

            const ephemeralKey = '0x62502C4DF73935D0D10054b0Fb8cC036534C6fb0';
            const spendingLimit = 1;
            const expirationHeight = await web3.eth.getBlockNumber() + 50;

            await tokenHolder.submitAuthorizeSession(
                ephemeralKey,
                spendingLimit,
                expirationHeight,
                {
                    from: registeredWallet0,
                },
            );

            let keyData = await tokenHolder.ephemeralKeys.call(ephemeralKey);

            assert.isOk(
                // TokenHolder.AuthorizationStatus.AUTHORIZED == 1
                keyData.status.eqn(1),
            );

            await tokenHolder.revokeSession(
                ephemeralKey,
                {
                    from: registeredWallet0,
                },
            );

            keyData = await tokenHolder.ephemeralKeys.call(ephemeralKey);

            assert.isOk(
                // TokenHolder.AuthorizationStatus.REVOKED == 2
                keyData.status.eqn(2),
            );
        });
    });
});
