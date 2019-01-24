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
const EthUtils = require('ethereumjs-util');
const web3 = require('../test_lib/web3.js');
const Utils = require('../test_lib/utils.js');
const { TokenHolderUtils } = require('./utils.js');
const { Event } = require('../test_lib/event_decoder');
const { AccountProvider } = require('../test_lib/utils.js');

const CoGatewaySpy = artifacts.require('CoGatewaySpy.sol');

const sessionPublicKey1 = '0x62502C4DF73935D0D10054b0Fb8cC036534C6fb0';
const sessionPrivateKey1 = '0xa8225c01ceeaf01d7bc7c1b1b929037bd4050967c5730c0b854263121b8399f3';
// const sessionPublicKey2 = '0xBbfd1BF77dA692abc82357aC001415b98d123d17';
const sessionPrivateKey2 = '0x6817f551bbc3e12b8fe36787ab192c921390d6176a3324ed02f96935a370bc41';


function generateTokenHolderexecuteRedemptionFunctionCallPrefix() {
    return web3.eth.abi.encodeFunctionSignature({
        name: 'executeRedemption',
        type: 'function',
        inputs: [
            {
                type: 'address', name: '',
            },
            {
                type: 'bytes', name: '',
            },
            {
                type: 'uint256', name: '',
            },
            {
                type: 'uint8', name: '',
            },
            {
                type: 'bytes32', name: '',
            },
            {
                type: 'bytes32', name: '',
            },
        ],
    });
}

function generateCoGatewayRedeemFunctionData(
    amount, beneficiary, gasPrice, gasLimit, nonce, hashLock,
) {
    return web3.eth.abi.encodeFunctionCall(
        {
            name: 'redeem',
            type: 'function',
            inputs: [
                {
                    type: 'uint256',
                    name: 'amount',
                },
                {
                    type: 'address',
                    name: 'beneficiary',
                },
                {
                    type: 'uint256',
                    name: 'gasPrice',
                },
                {
                    type: 'uint256',
                    name: 'gasLimit',
                },
                {
                    type: 'uint256',
                    name: 'nonce',
                },
                {
                    type: 'bytes32',
                    name: 'hashlock',
                },
            ],
        },
        [amount, beneficiary, gasPrice, gasLimit, nonce, hashLock],
    );
}

async function prepare(
    accountProvider,
    spendingLimit, deltaExpirationHeight,
    sessionPublicKeyToAuthorize,
) {
    const { utilityToken } = await TokenHolderUtils.createUtilityMockToken();

    const { tokenRules } = await TokenHolderUtils.createMockTokenRules(
        utilityToken.address,
    );

    const {
        tokenHolderOwnerAddress,
        tokenHolder,
    } = await TokenHolderUtils.createTokenHolder(
        accountProvider,
        utilityToken, tokenRules,
        spendingLimit, deltaExpirationHeight,
        sessionPublicKeyToAuthorize,
    );

    await TokenHolderUtils.authorizeSessionKey(
        tokenHolder, tokenHolderOwnerAddress,
        sessionPublicKeyToAuthorize, spendingLimit, deltaExpirationHeight,
    );

    const coGateway = await CoGatewaySpy.new();

    await utilityToken.setCoGateway(coGateway.address);

    return {
        utilityToken,
        tokenRules,
        tokenHolderOwnerAddress,
        tokenHolder,
        coGateway,
    };
}

async function generateCoGatewayRedeemFunctionExTx(
    tokenHolder,
    tokenHolderNonce,
    sessionPrivateKey,
    coGateway,
    amount, beneficiary, gasPrice, gasLimit, redeemerNonce, hashLock,
) {
    const coGatewayRedeemFunctionData = await generateCoGatewayRedeemFunctionData(
        amount, beneficiary, gasPrice, gasLimit, redeemerNonce, hashLock,
    );

    const { exTxHash, exTxSignature } = await Utils.generateExTx(
        tokenHolder.address,
        coGateway.address,
        coGatewayRedeemFunctionData,
        tokenHolderNonce,
        generateTokenHolderexecuteRedemptionFunctionCallPrefix(),
        sessionPrivateKey,
    );

    return {
        coGatewayRedeemFunctionData,
        exTxHash,
        exTxSignature,
    };
}

contract('TokenHolder::redeem', async (accounts) => {
    contract('Negative Tests', async () => {
        const accountProvider = new AccountProvider(accounts);

        it('Reverts if ExTx is signed with non-authorized key.', async () => {
            const {
                tokenHolder,
                coGateway,
            } = await prepare(
                accountProvider,
                50 /* spendingLimit */,
                100 /* deltaExpirationHeight */,
                sessionPublicKey1,
            );

            const tokenHolderNonce = 0;

            const amount = 10;
            const beneficiary = accountProvider.get();
            const gasPrice = 10;
            const gasLimit = 100;
            const redeemerNonce = 1;
            const hashLock = web3.utils.soliditySha3('hash-lock');

            const {
                coGatewayRedeemFunctionData,
                exTxSignature,
            } = await generateCoGatewayRedeemFunctionExTx(
                tokenHolder,
                tokenHolderNonce,
                sessionPrivateKey2,
                coGateway,
                amount, beneficiary, gasPrice, gasLimit, redeemerNonce, hashLock,
            );

            await Utils.expectRevert(
                tokenHolder.executeRedemption(
                    coGateway.address,
                    coGatewayRedeemFunctionData,
                    tokenHolderNonce,
                    EthUtils.bufferToHex(exTxSignature.r),
                    EthUtils.bufferToHex(exTxSignature.s),
                    exTxSignature.v,
                    {
                        from: accountProvider.get(),
                        value: 1 /* bounty */,
                    },
                ),
                'Should revert as ExTx is signed with non-authorized key.',
                'Session key is not active.',
            );
        });

        it('Reverts if ExTx is signed with expired key.', async () => {
            const deltaExpirationHeight = 100;
            const {
                tokenHolder,
                coGateway,
            } = await prepare(
                accountProvider,
                50 /* spendingLimit */,
                deltaExpirationHeight,
                sessionPublicKey1,
            );

            const tokenHolderNonce = 0;

            const amount = 10;
            const beneficiary = accountProvider.get();
            const gasPrice = 10;
            const gasLimit = 100;
            const redeemerNonce = 1;
            const hashLock = web3.utils.soliditySha3('hash-lock');

            const {
                coGatewayRedeemFunctionData,
                exTxSignature,
            } = await generateCoGatewayRedeemFunctionExTx(
                tokenHolder,
                tokenHolderNonce,
                sessionPrivateKey1,
                coGateway,
                amount, beneficiary, gasPrice, gasLimit, redeemerNonce, hashLock,
            );

            for (let i = 0; i < deltaExpirationHeight; i += 1) {
                // eslint-disable-next-line no-await-in-loop
                await Utils.advanceBlock();
            }

            await Utils.expectRevert(
                tokenHolder.executeRedemption(
                    coGateway.address,
                    coGatewayRedeemFunctionData,
                    tokenHolderNonce,
                    EthUtils.bufferToHex(exTxSignature.r),
                    EthUtils.bufferToHex(exTxSignature.s),
                    exTxSignature.v,
                    {
                        from: accountProvider.get(),
                        value: 1 /* bounty */,
                    },
                ),
                'Should revert as ExTx is signed with expired key.',
                'Session key is not active.',
            );
        });

        it('Reverts if ExTx is signed with a revoked key.', async () => {
            const {
                tokenHolder,
                tokenHolderOwnerAddress,
                coGateway,
            } = await prepare(
                accountProvider,
                50, /* spendingLimit */
                100, /* deltaExpirationHeight */
                sessionPublicKey1,
            );

            const tokenHolderNonce = 0;

            const amount = 10;
            const beneficiary = accountProvider.get();
            const gasPrice = 10;
            const gasLimit = 100;
            const redeemerNonce = 1;
            const hashLock = web3.utils.soliditySha3('hash-lock');

            const {
                coGatewayRedeemFunctionData,
                exTxSignature,
            } = await generateCoGatewayRedeemFunctionExTx(
                tokenHolder,
                tokenHolderNonce,
                sessionPrivateKey1,
                coGateway,
                amount, beneficiary, gasPrice, gasLimit, redeemerNonce, hashLock,
            );

            await tokenHolder.revokeSession(
                sessionPublicKey1,
                { from: tokenHolderOwnerAddress },
            );

            await Utils.expectRevert(
                tokenHolder.executeRedemption(
                    coGateway.address,
                    coGatewayRedeemFunctionData,
                    tokenHolderNonce,
                    EthUtils.bufferToHex(exTxSignature.r),
                    EthUtils.bufferToHex(exTxSignature.s),
                    exTxSignature.v,
                    {
                        from: accountProvider.get(),
                        value: 1 /* bounty */,
                    },
                ),
                'Should revert as ExTx is signed with a revoked key.',
                'Session key is not active.',
            );
        });

        it('Reverts if ExTx is signed with an invalid nonce.', async () => {
            const {
                tokenHolder,
                coGateway,
            } = await prepare(
                accountProvider,
                50, /* spendingLimit */
                100, /* deltaExpirationHeight */
                sessionPublicKey1,
            );

            const amount = 10;
            const beneficiary = accountProvider.get();
            const gasPrice = 10;
            const gasLimit = 100;
            const redeemerNonce = 1;
            const hashLock = web3.utils.soliditySha3('hash-lock');

            // Correct nonce is 0.
            const tokenHolderInvalidNonce = 1;

            const {
                coGatewayRedeemFunctionData: coGatewayRedeemFunctionData0,
                exTxSignature: exTxSignature0,
            } = await generateCoGatewayRedeemFunctionExTx(
                tokenHolder,
                tokenHolderInvalidNonce,
                sessionPrivateKey1,
                coGateway,
                amount, beneficiary, gasPrice, gasLimit, redeemerNonce, hashLock,
            );

            await Utils.expectRevert(
                tokenHolder.executeRedemption(
                    coGateway.address,
                    coGatewayRedeemFunctionData0,
                    tokenHolderInvalidNonce,
                    EthUtils.bufferToHex(exTxSignature0.r),
                    EthUtils.bufferToHex(exTxSignature0.s),
                    exTxSignature0.v,
                    {
                        from: accountProvider.get(),
                        value: 1 /* bounty */,
                    },
                ),
                'Should revert as ExTx is signed with an invalid nonce.',
                'Incorrect nonce is specified.',
            );
        });
    });

    contract('Redeem Executed', async () => {
        const accountProvider = new AccountProvider(accounts);

        it('Checks that redeem is successfully executed.', async () => {
            const {
                utilityToken,
                tokenHolder,
                coGateway,
            } = await prepare(
                accountProvider,
                50, /* spendingLimit */
                100, /* deltaExpirationHeight */
                sessionPublicKey1,
            );

            const amount = 10;
            const beneficiary = accountProvider.get();
            const gasPrice = 10;
            const gasLimit = 100;
            const redeemerNonce = 1;
            const hashLock = web3.utils.soliditySha3('hash-lock');

            const tokenHolderNonce = 0;

            const {
                coGatewayRedeemFunctionData,
                exTxSignature,
            } = await generateCoGatewayRedeemFunctionExTx(
                tokenHolder,
                tokenHolderNonce,
                sessionPrivateKey1,
                coGateway,
                amount, beneficiary, gasPrice, gasLimit, redeemerNonce, hashLock,
            );

            const bounty = 1;

            const executionStatus = await tokenHolder.executeRedemption.call(
                coGateway.address,
                coGatewayRedeemFunctionData,
                tokenHolderNonce,
                EthUtils.bufferToHex(exTxSignature.r),
                EthUtils.bufferToHex(exTxSignature.s),
                exTxSignature.v,
                {
                    from: accountProvider.get(),
                    value: bounty,
                },
            );

            assert.isOk(executionStatus);

            const redeemReceipt = await tokenHolder.executeRedemption(
                coGateway.address,
                coGatewayRedeemFunctionData,
                tokenHolderNonce,
                EthUtils.bufferToHex(exTxSignature.r),
                EthUtils.bufferToHex(exTxSignature.s),
                exTxSignature.v,
                {
                    from: accountProvider.get(),
                    value: bounty,
                },
            );

            assert.isOk(redeemReceipt.receipt.status);

            const updatedPayableValue = await coGateway.recordedPayedAmount.call();

            assert.isOk(
                updatedPayableValue.eqn(bounty),
            );

            const allowance = await (
                utilityToken.allowance.call(
                    tokenHolder.address, coGateway.address,
                )
            );

            assert.strictEqual(allowance.cmp(new BN(0)), 0);

            assert.isOk(
                allowance.eqn(0),
            );
        });
    });

    contract('Events', async () => {
        const accountProvider = new AccountProvider(accounts);

        it('Emits RuleExecuted event with successful execution status.', async () => {
            const {
                tokenHolder,
                coGateway,
            } = await prepare(
                accountProvider,
                50, /* spendingLimit */
                100, /* deltaExpirationHeight */
                sessionPublicKey1,
            );

            const amount = 10;
            const beneficiary = accountProvider.get();
            const gasPrice = 10;
            const gasLimit = 100;
            const redeemerNonce = 1;
            const hashLock = web3.utils.soliditySha3('hash-lock');

            const tokenHolderNonce = 0;

            const {
                coGatewayRedeemFunctionData,
                exTxHash,
                exTxSignature,
            } = await generateCoGatewayRedeemFunctionExTx(
                tokenHolder,
                tokenHolderNonce,
                sessionPrivateKey1,
                coGateway,
                amount, beneficiary, gasPrice, gasLimit, redeemerNonce, hashLock,
            );

            const transactionResponse = await tokenHolder.executeRedemption(
                coGateway.address,
                coGatewayRedeemFunctionData,
                tokenHolderNonce,
                EthUtils.bufferToHex(exTxSignature.r),
                EthUtils.bufferToHex(exTxSignature.s),
                exTxSignature.v,
                {
                    from: accountProvider.get(),
                    value: 1,
                },
            );

            const events = Event.decodeTransactionResponse(transactionResponse);

            assert.strictEqual(events.length, 1);

            Event.assertEqual(events[0], {
                name: 'RedemptionExecuted',
                args: {
                    _messageHash: exTxHash,
                    _status: true,
                },
            });
        });

        it('Emits RuleExecuted event with failed execution status.', async () => {
            const {
                tokenHolder,
                coGateway,
            } = await prepare(
                accountProvider,
                50, /* spendingLimit */
                100, /* deltaExpirationHeight */
                sessionPublicKey1,
            );

            const amount = 10;
            const beneficiary = accountProvider.get();
            const gasPrice = 10;
            const gasLimit = 100;
            const redeemerNonce = 1;
            const hashLock = web3.utils.soliditySha3('hash-lock');

            const tokenHolderNonce = 0;

            const {
                coGatewayRedeemFunctionData,
                exTxHash,
                exTxSignature,
            } = await generateCoGatewayRedeemFunctionExTx(
                tokenHolder,
                tokenHolderNonce,
                sessionPrivateKey1,
                coGateway,
                amount, beneficiary, gasPrice, gasLimit, redeemerNonce, hashLock,
            );

            await coGateway.makeRedemptionToFail();

            const transactionResponse = await tokenHolder.executeRedemption(
                coGateway.address,
                coGatewayRedeemFunctionData,
                tokenHolderNonce,
                EthUtils.bufferToHex(exTxSignature.r),
                EthUtils.bufferToHex(exTxSignature.s),
                exTxSignature.v,
                {
                    from: accountProvider.get(),
                    value: 1,
                },
            );

            const events = Event.decodeTransactionResponse(transactionResponse);

            assert.strictEqual(events.length, 1);

            Event.assertEqual(events[0], {
                name: 'RedemptionExecuted',
                args: {
                    _messageHash: exTxHash,
                    _status: false,
                },
            });
        });
    });

    contract('Returned Execution Status', async () => {
        const accountProvider = new AccountProvider(accounts);

        it('Checks that return value is true in case of successfull execution.', async () => {
            const {
                tokenHolder,
                coGateway,
            } = await prepare(
                accountProvider,
                50, /* spendingLimit */
                100, /* deltaExpirationHeight */
                sessionPublicKey1,
            );

            const amount = 10;
            const beneficiary = accountProvider.get();
            const gasPrice = 10;
            const gasLimit = 100;
            const redeemerNonce = 1;
            const hashLock = web3.utils.soliditySha3('hash-lock');

            const tokenHolderNonce = 0;

            const {
                coGatewayRedeemFunctionData,
                exTxSignature,
            } = await generateCoGatewayRedeemFunctionExTx(
                tokenHolder,
                tokenHolderNonce,
                sessionPrivateKey1,
                coGateway,
                amount, beneficiary, gasPrice, gasLimit, redeemerNonce, hashLock,
            );

            const executionStatus = await tokenHolder.executeRedemption.call(
                coGateway.address,
                coGatewayRedeemFunctionData,
                tokenHolderNonce,
                EthUtils.bufferToHex(exTxSignature.r),
                EthUtils.bufferToHex(exTxSignature.s),
                exTxSignature.v,
                {
                    from: accountProvider.get(),
                    value: 1,
                },
            );

            assert.isOk(
                executionStatus,
            );
        });

        it('Checks that return value is false in case of failing execution.', async () => {
            const {
                tokenHolder,
                coGateway,
            } = await prepare(
                accountProvider,
                50, /* spendingLimit */
                100, /* deltaExpirationHeight */
                sessionPublicKey1,
            );

            const amount = 10;
            const beneficiary = accountProvider.get();
            const gasPrice = 10;
            const gasLimit = 100;
            const redeemerNonce = 1;
            const hashLock = web3.utils.soliditySha3('hash-lock');

            const tokenHolderNonce = 0;

            const {
                coGatewayRedeemFunctionData,
                exTxSignature,
            } = await generateCoGatewayRedeemFunctionExTx(
                tokenHolder,
                tokenHolderNonce,
                sessionPrivateKey1,
                coGateway,
                amount, beneficiary, gasPrice, gasLimit, redeemerNonce, hashLock,
            );

            await coGateway.makeRedemptionToFail();

            const executionStatus = await tokenHolder.executeRedemption.call(
                coGateway.address,
                coGatewayRedeemFunctionData,
                tokenHolderNonce,
                EthUtils.bufferToHex(exTxSignature.r),
                EthUtils.bufferToHex(exTxSignature.s),
                exTxSignature.v,
                {
                    from: accountProvider.get(),
                    value: 1,
                },
            );

            assert.isNotOk(
                executionStatus,
            );
        });
    });

    contract('Nonce handling', async () => {
        const accountProvider = new AccountProvider(accounts);

        it('Checks that nonce is incremented in case of successfull execution.', async () => {
            const {
                tokenHolder,
                coGateway,
            } = await prepare(
                accountProvider,
                50, /* spendingLimit */
                100, /* deltaExpirationHeight */
                sessionPublicKey1,
            );

            const amount = 10;
            const beneficiary = accountProvider.get();
            const gasPrice = 10;
            const gasLimit = 100;
            const redeemerNonce = 1;
            const hashLock = web3.utils.soliditySha3('hash-lock');

            const tokenHolderNonce = 0;

            const {
                coGatewayRedeemFunctionData,
                exTxSignature,
            } = await generateCoGatewayRedeemFunctionExTx(
                tokenHolder,
                tokenHolderNonce,
                sessionPrivateKey1,
                coGateway,
                amount, beneficiary, gasPrice, gasLimit, redeemerNonce, hashLock,
            );

            await tokenHolder.executeRedemption(
                coGateway.address,
                coGatewayRedeemFunctionData,
                tokenHolderNonce,
                EthUtils.bufferToHex(exTxSignature.r),
                EthUtils.bufferToHex(exTxSignature.s),
                exTxSignature.v,
                {
                    from: accountProvider.get(),
                    value: 1,
                },
            );

            // Checks that nonce is updated.
            assert.isOk(
                (await tokenHolder.sessionKeys.call(sessionPublicKey1)).nonce.eqn(1),
            );
        });

        it('Checks that return value is false in case of failing execution.', async () => {
            const {
                tokenHolder,
                coGateway,
            } = await prepare(
                accountProvider,
                50, /* spendingLimit */
                100, /* deltaExpirationHeight */
                sessionPublicKey1,
            );

            const amount = 10;
            const beneficiary = accountProvider.get();
            const gasPrice = 10;
            const gasLimit = 100;
            const redeemerNonce = 1;
            const hashLock = web3.utils.soliditySha3('hash-lock');

            const tokenHolderNonce = 0;

            const {
                coGatewayRedeemFunctionData,
                exTxSignature,
            } = await generateCoGatewayRedeemFunctionExTx(
                tokenHolder,
                tokenHolderNonce,
                sessionPrivateKey1,
                coGateway,
                amount, beneficiary, gasPrice, gasLimit, redeemerNonce, hashLock,
            );

            await coGateway.makeRedemptionToFail();

            await tokenHolder.executeRedemption(
                coGateway.address,
                coGatewayRedeemFunctionData,
                tokenHolderNonce,
                EthUtils.bufferToHex(exTxSignature.r),
                EthUtils.bufferToHex(exTxSignature.s),
                exTxSignature.v,
                {
                    from: accountProvider.get(),
                    value: 1,
                },
            );

            // Checks that nonce is updated.
            assert.isOk(
                (await tokenHolder.sessionKeys.call(sessionPublicKey1)).nonce.eqn(1),
            );
        });
    });
});
