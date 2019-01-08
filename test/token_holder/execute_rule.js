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

const CustomRuleDouble = artifacts.require('CustomRuleDouble');

const sessionPublicKey1 = '0x62502C4DF73935D0D10054b0Fb8cC036534C6fb0';
const sessionPrivateKey1 = '0xa8225c01ceeaf01d7bc7c1b1b929037bd4050967c5730c0b854263121b8399f3';
const sessionPublicKey2 = '0xBbfd1BF77dA692abc82357aC001415b98d123d17';
const sessionPrivateKey2 = '0x6817f551bbc3e12b8fe36787ab192c921390d6176a3324ed02f96935a370bc41';

function generateTokenHolderAuthorizeSessionFunctionData(
    sessionKey, spendingLimit, expirationHeight,
) {
    return web3.eth.abi.encodeFunctionCall(
        {

            name: 'authorizeSession',
            type: 'function',
            inputs: [
                {
                    type: 'address',
                    name: 'sessionKey',
                },
                {
                    type: 'uint256',
                    name: 'spendingLimit',
                },
                {
                    type: 'uint256',
                    name: 'expirationHeight',
                },
            ],
        },
        [sessionKey, spendingLimit, expirationHeight],
    );
}

function generateUtilityTokenApproveFunctionData(spender, value) {
    return web3.eth.abi.encodeFunctionCall(
        {

            name: 'approve',
            type: 'function',
            inputs: [
                {
                    type: 'address',
                    name: 'spender',
                },
                {
                    type: 'uint256',
                    name: 'value',
                },
            ],
        },
        [spender, value],
    );
}

function generateMockRulePassFunctionData(value) {
    return web3.eth.abi.encodeFunctionCall(
        {
            name: 'pass',
            type: 'function',
            inputs: [
                {
                    type: 'address',
                    name: 'value',
                },
            ],
        },
        [value],
    );
}

function generateMockRulePassPayableFunctionData(value) {
    return web3.eth.abi.encodeFunctionCall(
        {
            name: 'passPayable',
            type: 'function',
            inputs: [
                {
                    type: 'address',
                    name: 'value',
                },
            ],
        },
        [value],
    );
}

function generateMockRuleFailFunctionData(value) {
    return web3.eth.abi.encodeFunctionCall(
        {
            name: 'fail',
            type: 'function',
            inputs: [
                {
                    type: 'address',
                    name: 'value',
                },
            ],
        },
        [value],
    );
}

function generateTokenHolderExecuteRuleCallPrefix() {
    return web3.eth.abi.encodeFunctionSignature({
        name: 'executeRule',
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

async function generateTokenHolderAuthorizeSessionFunctionExTx(
    tokenHolder, nonce, sessionPrivateKey,
    newSessionPublicKey, newSessionSpendingLimit, newSessionExpirationHeight,
) {
    const tokenHolderAuthorizeSessionFunctionData = generateTokenHolderAuthorizeSessionFunctionData(
        newSessionPublicKey, newSessionSpendingLimit, newSessionExpirationHeight,
    );

    const { exTxHash, exTxSignature } = Utils.generateExTx(
        tokenHolder.address,
        tokenHolder.address,
        tokenHolderAuthorizeSessionFunctionData,
        nonce,
        generateTokenHolderExecuteRuleCallPrefix(),
        sessionPrivateKey,
    );

    return {
        tokenHolderAuthorizeSessionFunctionData,
        exTxHash,
        exTxSignature,
    };
}

async function generateUtilityTokenApproveFunctionExTx(
    tokenHolder, nonce, sessionPrivateKey,
    spender, amount,
) {
    const utilityTokenApproveFunctionData = generateUtilityTokenApproveFunctionData(
        spender, amount,
    );

    const tokenAddress = await tokenHolder.token();

    const { exTxHash, exTxSignature } = Utils.generateExTx(
        tokenHolder.address,
        tokenAddress,
        utilityTokenApproveFunctionData,
        nonce,
        generateTokenHolderExecuteRuleCallPrefix(),
        sessionPrivateKey,
    );

    return {
        utilityTokenApproveFunctionData,
        exTxHash,
        exTxSignature,
    };
}

async function generateMockRulePassFunctionExTx(
    tokenHolder, nonce, sessionKey,
    mockRule, mockRuleValue,
) {
    const mockRulePassFunctionData = generateMockRulePassFunctionData(
        mockRuleValue,
    );

    const { exTxHash, exTxSignature } = Utils.generateExTx(
        tokenHolder.address,
        mockRule.address,
        mockRulePassFunctionData,
        nonce,
        generateTokenHolderExecuteRuleCallPrefix(),
        sessionKey,
    );

    return {
        mockRulePassFunctionData,
        exTxHash,
        exTxSignature,
    };
}

async function generateMockRulePassPayableFunctionExTx(
    tokenHolder, nonce, sessionKey,
    mockRule, mockRuleValue,
) {
    const mockRulePassPayableFunctionData = generateMockRulePassPayableFunctionData(
        mockRuleValue,
    );

    const { exTxHash, exTxSignature } = Utils.generateExTx(
        tokenHolder.address,
        mockRule.address,
        mockRulePassPayableFunctionData,
        nonce,
        generateTokenHolderExecuteRuleCallPrefix(),
        sessionKey,
    );

    return {
        mockRulePassPayableFunctionData,
        exTxHash,
        exTxSignature,
    };
}

async function generateMockRuleFailFunctionExTx(
    tokenHolder, nonce, sessionKey,
    mockRule, mockRuleValue,
) {
    const mockRuleFailFunctionData = generateMockRuleFailFunctionData(
        mockRuleValue,
    );

    const { exTxHash, exTxSignature } = Utils.generateExTx(
        tokenHolder.address,
        mockRule.address,
        mockRuleFailFunctionData,
        nonce,
        generateTokenHolderExecuteRuleCallPrefix(),
        sessionKey,
    );

    return {
        mockRuleFailFunctionData,
        exTxHash,
        exTxSignature,
    };
}

async function prepare(
    accountProvider,
    spendingLimit, deltaExpirationHeight,
    sessionPublicKeyToAuthorize,
) {
    const { utilityToken } = await TokenHolderUtils.createUtilityMockToken();

    const { tokenRules } = await TokenHolderUtils.createMockTokenRules();

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

    return {
        utilityToken,
        tokenRules,
        tokenHolderOwnerAddress,
        tokenHolder,
    };
}

contract('TokenHolder::executeRule', async () => {
    contract('Negative Tests', async (accounts) => {
        const accountProvider = new AccountProvider(accounts);

        it('Reverts if ExTx is signed with non-authorized key.', async () => {
            const {
                tokenHolder,
            } = await prepare(
                accountProvider,
                10, /* spendingLimit */
                50, /* deltaExpirationHeight */
                sessionPublicKey1,
            );

            const nonce = 1;

            const mockRule = await CustomRuleDouble.new();
            const mockRuleValue = accountProvider.get();

            const {
                mockRulePassFunctionData,
                exTxSignature,
            } = await generateMockRulePassFunctionExTx(
                tokenHolder, nonce, sessionPrivateKey2,
                mockRule,
                mockRuleValue,
            );

            await Utils.expectRevert(
                tokenHolder.executeRule(
                    mockRule.address,
                    mockRulePassFunctionData,
                    nonce,
                    exTxSignature.v,
                    EthUtils.bufferToHex(exTxSignature.r),
                    EthUtils.bufferToHex(exTxSignature.s),
                ),
                'Should revert as ExTx is signed with non-authorized key.',
                'Session key is not active.',
            );
        });

        it('Reverts if ExTx is signed with authorized but expired key.', async () => {
            const deltaExpirationHeight = 10;
            const {
                tokenHolder,
            } = await prepare(
                accountProvider,
                10, /* spendingLimit */
                deltaExpirationHeight,
                sessionPublicKey1,
            );

            const nonce = 1;

            const mockRule = await CustomRuleDouble.new();
            const mockRuleValue = accountProvider.get();

            const {
                mockRulePassFunctionData,
                exTxSignature,
            } = await generateMockRulePassFunctionExTx(
                tokenHolder, nonce, sessionPrivateKey2,
                mockRule,
                mockRuleValue,
            );

            for (let i = 0; i < deltaExpirationHeight; i += 1) {
                // eslint-disable-next-line no-await-in-loop
                await Utils.advanceBlock();
            }

            await Utils.expectRevert(
                tokenHolder.executeRule(
                    mockRule.address,
                    mockRulePassFunctionData,
                    nonce,
                    exTxSignature.v,
                    EthUtils.bufferToHex(exTxSignature.r),
                    EthUtils.bufferToHex(exTxSignature.s),
                ),
                'Should revert as transaction is signed with expired key.',
                'Session key is not active.',
            );
        });

        it('Reverts if ExTx is signed with revoked key.', async () => {
            const {
                tokenHolder,
                tokenHolderOwnerAddress,
            } = await prepare(
                accountProvider,
                10, /* spendingLimit */
                50, /* deltaExpirationHeight */
                sessionPublicKey1,
            );

            await tokenHolder.revokeSession(
                sessionPublicKey1,
                { from: tokenHolderOwnerAddress },
            );

            const keyData = await tokenHolder.sessionKeys(
                sessionPublicKey1,
            );

            assert.isOk(
                // AuthorizationStatus.REVOKED == 2
                keyData.status.eqn(2),
            );

            const nonce = 1;

            const mockRule = await CustomRuleDouble.new();
            const mockRuleValue = accountProvider.get();

            const {
                mockRulePassFunctionData,
                exTxSignature,
            } = await generateMockRulePassFunctionExTx(
                tokenHolder, nonce, sessionPrivateKey2,
                mockRule,
                mockRuleValue,
            );

            await Utils.expectRevert(
                tokenHolder.executeRule(
                    mockRule.address,
                    mockRulePassFunctionData,
                    nonce,
                    exTxSignature.v,
                    EthUtils.bufferToHex(exTxSignature.r),
                    EthUtils.bufferToHex(exTxSignature.s),
                ),
                'Should revert as transaction is signed with revoked key.',
                'Session key is not active.',
            );
        });

        it('Reverts if "to" address is the utility token address.', async () => {
            const {
                utilityToken,
                tokenHolder,
            } = await prepare(
                accountProvider,
                10, /* spendingLimit */
                50, /* deltaExpirationHeight */
                sessionPublicKey1,
            );

            const nonce = 1;

            const {
                utilityTokenApproveFunctionData,
                exTxSignature,
            } = await generateUtilityTokenApproveFunctionExTx(
                tokenHolder, nonce, sessionPrivateKey1,
                accountProvider.get(), /* spender */
                1, /* amount */
            );

            await Utils.expectRevert(
                tokenHolder.executeRule(
                    utilityToken.address,
                    utilityTokenApproveFunctionData,
                    nonce,
                    exTxSignature.v,
                    EthUtils.bufferToHex(exTxSignature.r),
                    EthUtils.bufferToHex(exTxSignature.s),
                ),
                'Should revert if "to" address is utility token address.',
                '\'to\' address is utility token address.',
            );
        });

        it('Reverts if ExTx is signed with a wrong nonce.', async () => {
            const {
                tokenHolder,
            } = await prepare(
                accountProvider,
                10, /* spendingLimit */
                50, /* deltaExpirationHeight */
                sessionPublicKey1,
            );

            // Correct nonce is 1.
            const invalidNonce0 = 0;

            const mockRule0 = await CustomRuleDouble.new();
            const mockRuleValue0 = accountProvider.get();

            const {
                mockRulePassFunctionData: mockRulePassFunctionData0,
                exTxSignature: exTxSignature0,
            } = await generateMockRulePassFunctionExTx(
                tokenHolder, invalidNonce0, sessionPrivateKey1,
                mockRule0,
                mockRuleValue0,
            );

            await Utils.expectRevert(
                tokenHolder.executeRule(
                    mockRule0.address,
                    mockRulePassFunctionData0,
                    invalidNonce0,
                    exTxSignature0.v,
                    EthUtils.bufferToHex(exTxSignature0.r),
                    EthUtils.bufferToHex(exTxSignature0.s),
                ),
                'Should revert as ExTx is signed with a wrong nonce.',
                'The next nonce is not provided.',
            );

            // correct nonce is 1.
            const invalidNonce2 = 2;

            const mockRule2 = await CustomRuleDouble.new();
            const mockRuleValue2 = accountProvider.get();

            const {
                mockRulePassFunctionData: mockRulePassFunctionData2,
                exTxSignature: exTxSignature2,
            } = await generateMockRulePassFunctionExTx(
                tokenHolder, invalidNonce2, sessionPrivateKey1,
                mockRule2,
                mockRuleValue2,
            );

            await Utils.expectRevert(
                tokenHolder.executeRule(
                    mockRule2.address,
                    mockRulePassFunctionData2,
                    invalidNonce2,
                    exTxSignature2.v,
                    EthUtils.bufferToHex(exTxSignature2.r),
                    EthUtils.bufferToHex(exTxSignature2.s),
                ),
                'Should revert as ExTx is signed with a wrong nonce.',
                'The next nonce is not provided.',
            );
        });

        it('Reverts if "to" is TokenHolder address itself', async () => {
            const {
                tokenHolder,
            } = await prepare(
                accountProvider,
                10, /* spendingLimit */
                50, /* deltaExpirationHeight */
                sessionPublicKey1,
            );

            const nonce = 1;

            const {
                tokenHolderAuthorizeSessionFunctionData,
                exTxSignature,
            } = await generateTokenHolderAuthorizeSessionFunctionExTx(
                tokenHolder, nonce, sessionPrivateKey1,
                sessionPublicKey2, /* new session key. */
                20, /* spending limit for new session. */
                200, /* expiration height for new session. */
            );

            await Utils.expectRevert(
                tokenHolder.executeRule(
                    tokenHolder.address,
                    tokenHolderAuthorizeSessionFunctionData,
                    nonce,
                    exTxSignature.v,
                    EthUtils.bufferToHex(exTxSignature.r),
                    EthUtils.bufferToHex(exTxSignature.s),
                ),
                'Should revert if "to" address is TokenHolder address itself.',
                '\'to\' address is TokenHolder address itself.',
            );
        });
    });

    contract('Events', async (accounts) => {
        const accountProvider = new AccountProvider(accounts);

        it('Emits RuleExecuted event with successful execution status.', async () => {
            const {
                tokenHolder,
            } = await prepare(
                accountProvider,
                10, /* spendingLimit */
                50, /* deltaExpirationHeight */
                sessionPublicKey1,
            );

            // correct nonce is 1.
            const nonce = 1;

            const mockRule = await CustomRuleDouble.new();
            const mockRuleValue = accountProvider.get();

            const {
                mockRulePassFunctionData,
                exTxHash,
                exTxSignature,
            } = await generateMockRulePassFunctionExTx(
                tokenHolder, nonce, sessionPrivateKey1,
                mockRule, mockRuleValue,
            );

            const transactionResponse = await tokenHolder.executeRule(
                mockRule.address,
                mockRulePassFunctionData,
                nonce,
                exTxSignature.v,
                EthUtils.bufferToHex(exTxSignature.r),
                EthUtils.bufferToHex(exTxSignature.s),
            );

            const events = Event.decodeTransactionResponse(
                transactionResponse,
            );

            assert.strictEqual(
                events.length,
                1,
            );

            const passCallPrefix = await mockRule.PASS_CALLPREFIX.call();

            Event.assertEqual(events[0], {
                name: 'RuleExecuted',
                args: {
                    _to: mockRule.address,
                    _functionSelector: passCallPrefix,
                    _sessionKey: sessionPublicKey1,
                    _nonce: new BN(nonce),
                    _messageHash: exTxHash,
                    _status: true,
                },
            });
        });

        it('Emits RuleExecuted event with failed execution status.', async () => {
            const {
                tokenHolder,
            } = await prepare(
                accountProvider,
                10, /* spendingLimit */
                50, /* deltaExpirationHeight */
                sessionPublicKey1,
            );

            // correct nonce is 1.
            const nonce = 1;

            const mockRule = await CustomRuleDouble.new();
            const mockRuleValue = accountProvider.get();

            const {
                mockRuleFailFunctionData,
                exTxHash,
                exTxSignature,
            } = await generateMockRuleFailFunctionExTx(
                tokenHolder, nonce, sessionPrivateKey1,
                mockRule, mockRuleValue,
            );

            const transactionResponse = await tokenHolder.executeRule(
                mockRule.address,
                mockRuleFailFunctionData,
                nonce,
                exTxSignature.v,
                EthUtils.bufferToHex(exTxSignature.r),
                EthUtils.bufferToHex(exTxSignature.s),
            );

            const events = Event.decodeTransactionResponse(
                transactionResponse,
            );

            assert.strictEqual(
                events.length,
                1,
            );

            Event.assertEqual(events[0], {
                name: 'RuleExecuted',
                args: {
                    _to: mockRule.address,
                    _functionSelector: await mockRule.FAIL_CALLPREFIX.call(),
                    _sessionKey: sessionPublicKey1,
                    _nonce: new BN(nonce),
                    _messageHash: exTxHash,
                    // We should check against false here, however
                    // current version of web3 returns null for false values
                    // in event log. After updating web3, this test might
                    // fail and we should use false (as intended).
                    _status: null,
                },
            });
        });
    });

    contract('Rule Executed', async (accounts) => {
        const accountProvider = new AccountProvider(accounts);

        it('Checks that rule is actually executed.', async () => {
            const {
                tokenHolder,
            } = await prepare(
                accountProvider,
                10, /* spendingLimit */
                50, /* deltaExpirationHeight */
                sessionPublicKey1,
            );

            // correct nonce is 1.
            const nonce = 1;

            const mockRule = await CustomRuleDouble.new();
            const mockRuleValue = accountProvider.get();

            const {
                mockRulePassFunctionData,
                exTxSignature,
            } = await generateMockRulePassFunctionExTx(
                tokenHolder, nonce, sessionPrivateKey1,
                mockRule, mockRuleValue,
            );

            await tokenHolder.executeRule(
                mockRule.address,
                mockRulePassFunctionData,
                nonce,
                exTxSignature.v,
                EthUtils.bufferToHex(exTxSignature.r),
                EthUtils.bufferToHex(exTxSignature.s),
            );

            assert.strictEqual(
                (await mockRule.recordedValue.call()),
                mockRuleValue,
            );
        });

        it('Checks that payable rule is actually executed.', async () => {
            const {
                tokenHolder,
            } = await prepare(
                accountProvider,
                10, /* spendingLimit */
                50, /* deltaExpirationHeight */
                sessionPublicKey1,
            );

            // correct nonce is 1.
            const nonce = 1;

            const mockRule = await CustomRuleDouble.new();
            const mockRuleValue = accountProvider.get();

            const {
                mockRulePassPayableFunctionData,
                exTxSignature,
            } = await generateMockRulePassPayableFunctionExTx(
                tokenHolder, nonce, sessionPrivateKey1,
                mockRule, mockRuleValue,
            );

            const payableValue = 111;
            await tokenHolder.executeRule(
                mockRule.address,
                mockRulePassPayableFunctionData,
                nonce,
                exTxSignature.v,
                EthUtils.bufferToHex(exTxSignature.r),
                EthUtils.bufferToHex(exTxSignature.s),
                {
                    value: payableValue,
                },
            );

            assert.strictEqual(
                (await mockRule.recordedValue.call()),
                mockRuleValue,
            );

            assert.isOk(
                (await mockRule.recordedPayedAmount.call()).eqn(payableValue),
            );
        });
    });

    contract('Returned Execution Status', async (accounts) => {
        const accountProvider = new AccountProvider(accounts);

        it('Checks that return value is true in case of successfull execution.', async () => {
            const {
                tokenHolder,
            } = await prepare(
                accountProvider,
                10, /* spendingLimit */
                50, /* deltaExpirationHeight */
                sessionPublicKey1,
            );

            // correct nonce is 1.
            const nonce = 1;

            const mockRule = await CustomRuleDouble.new();
            const mockRuleValue = accountProvider.get();

            const {
                mockRulePassFunctionData,
                exTxSignature,
            } = await generateMockRulePassFunctionExTx(
                tokenHolder, nonce, sessionPrivateKey1,
                mockRule, mockRuleValue,
            );

            const executionStatus = await tokenHolder.executeRule.call(
                mockRule.address,
                mockRulePassFunctionData,
                nonce,
                exTxSignature.v,
                EthUtils.bufferToHex(exTxSignature.r),
                EthUtils.bufferToHex(exTxSignature.s),
            );

            assert.isOk(
                executionStatus,
            );
        });

        it('Checks that return value is true in case of failing execution.', async () => {
            const {
                tokenHolder,
            } = await prepare(
                accountProvider,
                10, /* spendingLimit */
                50, /* deltaExpirationHeight */
                sessionPublicKey1,
            );

            // correct nonce is 1.
            const nonce = 1;

            const mockRule = await CustomRuleDouble.new();
            const mockRuleValue = accountProvider.get();

            const {
                mockRuleFailFunctionData,
                exTxSignature,
            } = await generateMockRuleFailFunctionExTx(
                tokenHolder, nonce, sessionPrivateKey1,
                mockRule, mockRuleValue,
            );

            const executionStatus = await tokenHolder.executeRule.call(
                mockRule.address,
                mockRuleFailFunctionData,
                nonce,
                exTxSignature.v,
                EthUtils.bufferToHex(exTxSignature.r),
                EthUtils.bufferToHex(exTxSignature.s),
            );

            assert.isNotOk(
                executionStatus,
            );
        });
    });
});
