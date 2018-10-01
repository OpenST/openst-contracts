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
const { TokenHolderHelper } = require('../test_lib/token_holder_helper.js');

const TokenHolder = artifacts.require('TokenHolder');

function generateSubmitAuthorizeSessionData(
    ephemeralKey, spendingLimit, expirationHeight,
) {
    return web3.eth.abi.encodeFunctionCall(
        {
            name: 'authorizeSession',
            type: 'function',
            inputs: [
                {
                    type: 'address',
                    name: '',
                },
                {
                    type: 'uint256',
                    name: '',
                },
                {
                    type: 'uint256',
                    name: '',
                },
            ],
        },
        [ephemeralKey, spendingLimit, expirationHeight],
    );
}

contract('TokenHolder::submitAuthorizeSession', async () => {
    contract('Negative testing for input parameters:', async (accounts) => {
        it('Non registered wallet submits authorization session.', async () => {
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

            await utils.expectRevert(
                tokenHolder.submitAuthorizeSession(
                    ephemeralKey,
                    spendingLimit,
                    expirationHeight,
                    {
                        from: nonRegisteredWallet,
                    },
                ),
                'Non registered wallet cannot submit a key authorization.',
            );
        });
        it('Submitted ephemeral key is null.', async () => {
            const required = 1;

            const registeredWallet0 = accounts[0];

            const wallets = [registeredWallet0];

            const brandedToken = accounts[2];
            const tokenRules = accounts[3];

            const spendingLimit = 1;
            const expirationHeight = (await web3.eth.getBlockNumber()) + 10;

            const tokenHolder = await TokenHolder.new(
                brandedToken, tokenRules, wallets, required,
            );

            await utils.expectRevert(
                tokenHolder.submitAuthorizeSession(
                    utils.NULL_ADDRESS,
                    spendingLimit,
                    expirationHeight,
                    {
                        from: registeredWallet0,
                    },
                ),
                'Ephemeral key can not be null.',
            );
        });
        it('Submitted ephemeral key is already authorized.', async () => {
            const required = 1;

            const registeredWallet0 = accounts[0];

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

            await utils.expectRevert(
                tokenHolder.submitAuthorizeSession(
                    ephemeralKey,
                    spendingLimit,
                    expirationHeight,
                    {
                        from: registeredWallet0,
                    },
                ),
                'Ephemeral key can not be authorized.',
            );
        });

        it('Submitted ephemeral key is revoked.', async () => {
            const required = 1;

            const registeredWallet0 = accounts[0];

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

            await tokenHolder.revokeSession(
                ephemeralKey,
                {
                    from: registeredWallet0,
                },
            );

            await utils.expectRevert(
                tokenHolder.submitAuthorizeSession(
                    ephemeralKey,
                    spendingLimit,
                    expirationHeight,
                    {
                        from: registeredWallet0,
                    },
                ),
                'Ephemeral key cannot be revoked.',
            );
        });

        it('Submitted ephemeral key has expired.', async () => {
            const required = 1;

            const registeredWallet0 = accounts[0];

            const wallets = [registeredWallet0];

            const brandedToken = accounts[2];
            const tokenRules = accounts[3];

            const ephemeralKey = '0x62502C4DF73935D0D10054b0Fb8cC036534C6fb0';
            const spendingLimit = 1;
            const expirationHeightDelta = 5;
            const blockNumber = await web3.eth.getBlockNumber();
            const expirationHeight = blockNumber + expirationHeightDelta;

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

            for (let i = 0; i < expirationHeightDelta; i += 1) {
                // eslint-disable-next-line no-await-in-loop
                await utils.advanceBlock();
            }

            // Checking that key has expired.
            assert.isOk(
                (await tokenHolder.ephemeralKeys.call(ephemeralKey))
                    .expirationHeight <= (await web3.eth.getBlockNumber()),
            );

            await utils.expectRevert(
                tokenHolder.submitAuthorizeSession(
                    ephemeralKey,
                    spendingLimit,
                    expirationHeight,
                    {
                        from: registeredWallet0,
                    },
                ),
                'Ephemeral key can not be expired.',
            );
        });

        it('Expiration height is less or equal to the block number', async () => {
            const required = 1;

            const registeredWallet0 = accounts[0];

            const wallets = [registeredWallet0];

            const brandedToken = accounts[2];
            const tokenRules = accounts[3];

            const ephemeralKey = '0x62502C4DF73935D0D10054b0Fb8cC036534C6fb0';
            const spendingLimit = 10;

            const tokenHolder = await TokenHolder.new(
                brandedToken, tokenRules, wallets, required,
            );

            await utils.expectRevert(
                tokenHolder.submitAuthorizeSession(
                    ephemeralKey,
                    spendingLimit,
                    (await web3.eth.getBlockNumber()),
                    {
                        from: registeredWallet0,
                    },
                ),
                'Ephemeral key cannot be revoked.',
            );
        });
    });

    contract('Events', async (accounts) => {
        it('Submit => Confirm => Execute', async () => {
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


            const transactionResponse = await tokenHolder.submitAuthorizeSession(
                ephemeralKey,
                spendingLimit,
                expirationHeight,
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
                'As the requirement is 1, transaction would be executed '
                + 'afterwards, hence SessionAuthorizationSubmitted, '
                + 'TransactionConfirmed and TransactionExecutionSucceeded '
                + 'would be emitted.',
            );

            // The first emitted event should be 'SessionAuthorizationSubmitted'.
            Event.assertEqual(events[0], {
                name: 'SessionAuthorizationSubmitted',
                args: {
                    _transactionID: new BN(0),
                    _ephemeralKey: ephemeralKey,
                    _spendingLimit: new BN(spendingLimit),
                    _expirationHeight: new BN(expirationHeight),
                },
                logIndex: 0,
            });

            // The second emitted event should be 'TransactionConfirmed',
            // because the wallet that submitted a session authorization request
            // should confirm it afterwards in the same call.
            Event.assertEqual(events[1], {
                name: 'TransactionConfirmed',
                args: {
                    _transactionID: new BN(0),
                    _wallet: registeredWallet0,
                },
                logIndex: 1,
            });

            // The third emitted event should be
            // 'TransactionExecutionSucceeded', because of the setup
            // 1-wallet-1-requirement.
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

            const wallets = [registeredWallet0, registeredWallet1];

            const brandedToken = accounts[2];
            const tokenRules = accounts[3];

            const tokenHolder = await TokenHolder.new(
                brandedToken, tokenRules, wallets, required,
            );

            const ephemeralKey = '0x62502C4DF73935D0D10054b0Fb8cC036534C6fb0';
            const spendingLimit = 1;
            const expirationHeight = await web3.eth.getBlockNumber() + 50;


            const transactionResponse = await tokenHolder.submitAuthorizeSession(
                ephemeralKey,
                spendingLimit,
                expirationHeight,
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
                'As the requirement is 2, transaction would not be executed '
                + 'afterwards, hence SessionAuthorizationSubmitted and '
                + 'TransactionConfirmed would be emitted.',
            );


            // The first emitted event should be 'SessionAuthorizationSubmitted'.
            Event.assertEqual(events[0], {
                name: 'SessionAuthorizationSubmitted',
                args: {
                    _transactionID: new BN(0),
                    _ephemeralKey: ephemeralKey,
                    _spendingLimit: new BN(spendingLimit),
                    _expirationHeight: new BN(expirationHeight),
                },
                logIndex: 0,
            });

            // The second emitted event should be 'TransactionConfirmed',
            // because the wallet that submitted a session authorization request
            // should confirm it afterwards in the same call.
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

            const wallets = [registeredWallet0];

            const brandedToken = accounts[1];
            const tokenRules = accounts[2];

            const tokenHolder = await TokenHolder.new(
                brandedToken, tokenRules, wallets, required,
            );

            const ephemeralKey = '0x62502C4DF73935D0D10054b0Fb8cC036534C6fb0';
            const spendingLimit = 1;
            const expirationHeight = await web3.eth.getBlockNumber() + 50;


            const transactionID = await TokenHolderHelper.submitAuthorizeSession(
                tokenHolder,
                ephemeralKey,
                spendingLimit,
                expirationHeight,
                {
                    from: registeredWallet0,
                },
            );

            const keyData = await tokenHolder.ephemeralKeys.call(ephemeralKey);

            assert.isOk(
                keyData.spendingLimit.eqn(spendingLimit),
            );

            assert.isOk(
                keyData.nonce.eqn(0),
            );

            assert.isOk(
                keyData.expirationHeight.eqn(expirationHeight),
            );

            assert.isOk(
                // TokenHolder.AuthorizationStatus.AUTHORIZED == 1
                keyData.status.eqn(1),
            );

            const transaction = await tokenHolder.transactions.call(
                transactionID,
            );

            assert.strictEqual(
                transaction.destination,
                tokenHolder.address,
            );

            assert.strictEqual(
                transaction.data,
                generateSubmitAuthorizeSessionData(
                    ephemeralKey, spendingLimit, expirationHeight,
                ),
            );

            assert.isOk(
                transaction.executed,
            );
        });

        it('Submit => Confirm', async () => {
            const required = 2;

            const registeredWallet0 = accounts[0];
            const registeredWallet1 = accounts[1];

            const wallets = [registeredWallet0, registeredWallet1];

            const brandedToken = accounts[2];
            const tokenRules = accounts[3];

            const tokenHolder = await TokenHolder.new(
                brandedToken, tokenRules, wallets, required,
            );

            const ephemeralKey = '0x62502C4DF73935D0D10054b0Fb8cC036534C6fb0';
            const spendingLimit = 1;
            const expirationHeight = await web3.eth.getBlockNumber() + 50;


            const transactionID = await TokenHolderHelper.submitAuthorizeSession(
                tokenHolder,
                ephemeralKey,
                spendingLimit,
                expirationHeight,
                {
                    from: registeredWallet0,
                },
            );

            const keyData = await tokenHolder.ephemeralKeys.call(ephemeralKey);

            assert.isOk(
                // TokenHolder.AuthorizationStatus.NOT_AUTHORIZED == 0
                keyData.status.eqn(0),
            );

            const transaction = await tokenHolder.transactions.call(
                transactionID,
            );

            assert.strictEqual(
                transaction.destination,
                tokenHolder.address,
            );

            assert.strictEqual(
                transaction.data,
                generateSubmitAuthorizeSessionData(
                    ephemeralKey, spendingLimit, expirationHeight,
                ),
            );

            assert.isNotOk(
                transaction.executed,
            );
        });
    });
});
