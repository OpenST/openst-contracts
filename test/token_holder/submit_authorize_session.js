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
const Utils = require('../test_lib/utils.js');
const { Event } = require('../test_lib/event_decoder');
const { TokenHolderUtils } = require('./utils.js');
const { AccountProvider } = require('../test_lib/utils.js');

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

contract('TokenHolder::submitAuthorizeSession', async () => {
    contract('Negative Tests', async (accounts) => {
        const accountProvider = new AccountProvider(accounts);

        it('Reverts if non-registered wallet calls.', async () => {
            const {
                tokenHolder,
            } = await createTokenHolder(accountProvider);

            const ephemeralKey = '0x62502C4DF73935D0D10054b0Fb8cC036534C6fb0';
            const spendingLimit = 1;
            const expirationHeight = (await web3.eth.getBlockNumber()) + 10;

            await Utils.expectRevert(
                tokenHolder.submitAuthorizeSession(
                    ephemeralKey,
                    spendingLimit,
                    expirationHeight,
                    { from: accountProvider.get() },
                ),
                'Should revert as non-registered wallet calls.',
                'Only wallet is allowed to call',
            );
        });

        it('Reverts if key to authorize is null.', async () => {
            const {
                tokenHolder,
                registeredWallet0,
            } = await createTokenHolder(accountProvider);

            const spendingLimit = 1;
            const expirationHeight = (await web3.eth.getBlockNumber()) + 10;

            await Utils.expectRevert(
                tokenHolder.submitAuthorizeSession(
                    Utils.NULL_ADDRESS,
                    spendingLimit,
                    expirationHeight,
                    { from: registeredWallet0 },
                ),
                'Should revert as key to authorize is null.',
                'Key address is null',
            );
        });

        it('Reverts if key to authorize already was authorized.', async () => {
            const {
                tokenHolder,
                registeredWallet0,
            } = await createTokenHolder(accountProvider);

            const ephemeralKey = '0x62502C4DF73935D0D10054b0Fb8cC036534C6fb0';
            const spendingLimit = 1;
            const expirationHeight = (await web3.eth.getBlockNumber()) + 10;

            await tokenHolder.submitAuthorizeSession(
                ephemeralKey,
                spendingLimit,
                expirationHeight,
                { from: registeredWallet0 },
            );

            await Utils.expectRevert(
                tokenHolder.submitAuthorizeSession(
                    ephemeralKey,
                    spendingLimit,
                    expirationHeight,
                    { from: registeredWallet0 },
                ),
                'Should revert as key to authorize was already authorized.',
                'Key exists',
            );
        });

        it('Reverts if key to authorize is in revoked state.', async () => {
            const {
                tokenHolder,
                registeredWallet0,
            } = await createTokenHolder(accountProvider);

            const ephemeralKey = '0x62502C4DF73935D0D10054b0Fb8cC036534C6fb0';
            const spendingLimit = 1;
            const expirationHeight = (await web3.eth.getBlockNumber()) + 10;

            await tokenHolder.submitAuthorizeSession(
                ephemeralKey,
                spendingLimit,
                expirationHeight,
                { from: registeredWallet0 },
            );

            await tokenHolder.revokeSession(
                ephemeralKey,
                { from: registeredWallet0 },
            );

            await Utils.expectRevert(
                tokenHolder.submitAuthorizeSession(
                    ephemeralKey,
                    spendingLimit,
                    expirationHeight,
                    { from: registeredWallet0 },
                ),
                'Should revert as key to authorize was revoked.',
                'Key exists',
            );
        });

        it('Reverts if key to authorize has expired.', async () => {
            const {
                tokenHolder,
                registeredWallet0,
            } = await createTokenHolder(accountProvider);

            const ephemeralKey = '0x62502C4DF73935D0D10054b0Fb8cC036534C6fb0';
            const spendingLimit = 1;
            const expirationHeightDelta = 10;
            const blockNumber = await web3.eth.getBlockNumber();
            const expirationHeight = blockNumber + expirationHeightDelta;

            await tokenHolder.submitAuthorizeSession(
                ephemeralKey,
                spendingLimit,
                expirationHeight,
                { from: registeredWallet0 },
            );

            for (let i = 0; i < expirationHeightDelta; i += 1) {
                // eslint-disable-next-line no-await-in-loop
                await Utils.advanceBlock();
            }

            // Checking that key has expired.
            assert.isOk(
                (await tokenHolder.ephemeralKeys.call(ephemeralKey))
                    .expirationHeight <= (await web3.eth.getBlockNumber()),
            );

            await Utils.expectRevert(
                tokenHolder.submitAuthorizeSession(
                    ephemeralKey,
                    spendingLimit,
                    expirationHeight,
                    {
                        from: registeredWallet0,
                    },
                ),
                'Should revert as key to submit has already expired.',
                'Key exists',
            );
        });

        it('Expiration height is less or equal to the block number', async () => {
            const {
                tokenHolder,
                registeredWallet0,
            } = await createTokenHolder(accountProvider);

            const ephemeralKey = '0x62502C4DF73935D0D10054b0Fb8cC036534C6fb0';
            const spendingLimit = 10;

            await Utils.expectRevert(
                tokenHolder.submitAuthorizeSession(
                    ephemeralKey,
                    spendingLimit,
                    (await web3.eth.getBlockNumber()),
                    { from: registeredWallet0 },
                ),
                'Should revert as expiration heigh is less than equal to the '
                + ' current block height',
                'Expiration height is lte to the current block height',
            );
        });
    });

    contract('Events', async (accounts) => {
        const accountProvider = new AccountProvider(accounts);

        // Because of 1-wallet-1-required the submitted authorization
        // request is going to be executed immediately, hence 3 events.
        it('Emits SessionAuthorizationSubmitted, TransactionConfirmed '
         + 'TransactionExecutionSucceeded events.', async () => {
            const required = 1;

            const registeredWallet0 = accountProvider.get();

            const wallets = [registeredWallet0];

            const token = accountProvider.get();
            const tokenRules = accountProvider.get();

            const tokenHolder = await TokenHolder.new(
                token, tokenRules, wallets, required,
            );

            const ephemeralKey = '0x62502C4DF73935D0D10054b0Fb8cC036534C6fb0';
            const spendingLimit = 1;
            const expirationHeight = await web3.eth.getBlockNumber() + 50;

            const transactionResponse = await tokenHolder.submitAuthorizeSession(
                ephemeralKey,
                spendingLimit,
                expirationHeight,
                { from: registeredWallet0 },
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
            });

            // The third emitted event should be
            // 'TransactionExecutionSucceeded', because of the setup
            // 1-wallet-1-requirement.
            Event.assertEqual(events[2], {
                name: 'TransactionExecutionSucceeded',
                args: {
                    _transactionID: new BN(0),
                },
            });
        });

        // Because of 2-wallet-2-required the submitted authorization
        // request is *not* going to be executed immediately, hence 2 events.
        it('Emits SessionAuthorizationSubmitted and TransactionConfirmed', async () => {
            const required = 2;

            const registeredWallet0 = accountProvider.get();
            const registeredWallet1 = accountProvider.get();

            const wallets = [registeredWallet0, registeredWallet1];

            const token = accountProvider.get();
            const tokenRules = accountProvider.get();

            const tokenHolder = await TokenHolder.new(
                token, tokenRules, wallets, required,
            );

            const ephemeralKey = '0x62502C4DF73935D0D10054b0Fb8cC036534C6fb0';
            const spendingLimit = 1;
            const expirationHeight = await web3.eth.getBlockNumber() + 50;

            const transactionResponse = await tokenHolder.submitAuthorizeSession(
                ephemeralKey,
                spendingLimit,
                expirationHeight,
                { from: registeredWallet0 },
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
            });
        });
    });

    contract('Storage', async (accounts) => {
        const accountProvider = new AccountProvider(accounts);

        it('Checks states in case of 1-wallet-1-required.', async () => {
            const required = 1;

            const registeredWallet0 = accountProvider.get();

            const wallets = [registeredWallet0];

            const token = accountProvider.get();
            const tokenRules = accountProvider.get();

            const tokenHolder = await TokenHolder.new(
                token, tokenRules, wallets, required,
            );

            const ephemeralKey = '0x62502C4DF73935D0D10054b0Fb8cC036534C6fb0';
            const spendingLimit = 1;
            const expirationHeight = await web3.eth.getBlockNumber() + 50;

            const transactionID = await TokenHolderUtils.submitAuthorizeSession(
                tokenHolder,
                ephemeralKey,
                spendingLimit,
                expirationHeight,
                { from: registeredWallet0 },
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

        it('Checks states in case of 2-walleta-2-required.', async () => {
            const required = 2;

            const registeredWallet0 = accountProvider.get();
            const registeredWallet1 = accountProvider.get();

            const wallets = [registeredWallet0, registeredWallet1];

            const token = accountProvider.get();
            const tokenRules = accountProvider.get();

            const tokenHolder = await TokenHolder.new(
                token, tokenRules, wallets, required,
            );

            const ephemeralKey = '0x62502C4DF73935D0D10054b0Fb8cC036534C6fb0';
            const spendingLimit = 1;
            const expirationHeight = await web3.eth.getBlockNumber() + 50;

            const transactionID = await TokenHolderUtils.submitAuthorizeSession(
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
