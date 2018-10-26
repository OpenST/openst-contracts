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
const { Event } = require('../test_lib/event_decoder');
const { AccountProvider } = require('../test_lib/utils.js');

const TokenHolder = artifacts.require('TokenHolder');
const MockRule = artifacts.require('MockRule');
const TokenRulesMock = artifacts.require('TokenRulesMock');
const EIP20TokenMock = artifacts.require('EIP20TokenMock');

const ephemeralPrivateKey1 = '0xa8225c01ceeaf01d7bc7c1b1b929037bd4050967c5730c0b854263121b8399f3';
const ephemeralKeyAddress1 = '0x62502C4DF73935D0D10054b0Fb8cC036534C6fb0';

const ephemeralPrivateKey2 = '0x634011a05b2f48e2d19aba49a9dbc12766bf7dbd6111ed2abb2621c92e8cfad9';

function generateMockRulePassActionData(value) {
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

function generateMockRulePassPayableActionData(value) {
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

function generateMockRuleFailActionData(value) {
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

function generateExecuteRuleCallPrefix() {
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

function getExecuteRuleExTxHash(
    tokenHolderAddress, ruleAddress, ruleData, nonce,
) {
    return web3.utils.soliditySha3(
        {
            t: 'bytes1', v: '0x19',
        },
        {
            t: 'bytes1', v: '0x0',
        },
        {
            t: 'address', v: tokenHolderAddress,
        },
        {
            t: 'address', v: ruleAddress,
        },
        {
            t: 'uint8', v: 0,
        },
        {
            t: 'bytes32', v: web3.utils.keccak256(ruleData),
        },
        {
            t: 'uint256', v: nonce,
        },
        {
            t: 'uint8', v: 0,
        },
        {
            t: 'uint8', v: 0,
        },
        {
            t: 'uint8', v: 0,
        },
        {
            t: 'bytes4', v: generateExecuteRuleCallPrefix(),
        },
        {
            t: 'uint8', v: 0,
        },
        {
            t: 'bytes32', v: '0x0',
        },
    );
}

function getExecuteRuleExTxData(
    _tokenHolderAddress, _ruleAddress, _ruleData, _nonce, _ephemeralKey,
) {
    const msgHash = getExecuteRuleExTxHash(
        _tokenHolderAddress, _ruleAddress, _ruleData, _nonce,
    );

    const rsv = EthUtils.ecsign(
        EthUtils.toBuffer(msgHash),
        EthUtils.toBuffer(_ephemeralKey),
    );

    return { msgHash, rsv };
}

async function createTokenHolder(
    accountProvider, _ephemeralKeyAddress, _spendingLimit, _deltaExpirationHeight,
) {
    const token = await EIP20TokenMock.new(1, 1, 'OST', 'Open Simple Token', 1);
    const tokenRules = await TokenRulesMock.new();
    const required = 1;
    const registeredWallet0 = accountProvider.get();
    const wallets = [registeredWallet0];

    const tokenHolder = await TokenHolder.new(
        token.address,
        tokenRules.address,
        wallets,
        required,
    );

    const blockNumber = await web3.eth.getBlockNumber();

    await tokenHolder.submitAuthorizeSession(
        _ephemeralKeyAddress,
        _spendingLimit,
        blockNumber + _deltaExpirationHeight,
        { from: registeredWallet0 },
    );

    return {
        tokenHolder,
        registeredWallet0,
    };
}

async function preparePassRule(
    accountProvider, tokenHolder, nonce, ephemeralKey,
) {
    const mockRule = await MockRule.new();
    const mockRuleValue = accountProvider.get();
    const mockRulePassActionData = generateMockRulePassActionData(
        mockRuleValue,
    );

    const { msgHash, rsv } = getExecuteRuleExTxData(
        tokenHolder.address,
        mockRule.address,
        mockRulePassActionData,
        nonce,
        ephemeralKey,
    );

    return {
        mockRule,
        mockRuleValue,
        mockRulePassActionData,
        msgHash,
        rsv,
    };
}

async function preparePassPayableRule(
    accountProvider, tokenHolder, nonce, ephemeralKey,
) {
    const mockRule = await MockRule.new();
    const mockRuleValue = accountProvider.get();
    const mockRulePassActionData = generateMockRulePassPayableActionData(
        mockRuleValue,
    );

    const { msgHash, rsv } = getExecuteRuleExTxData(
        tokenHolder.address,
        mockRule.address,
        mockRulePassActionData,
        nonce,
        ephemeralKey,
    );

    return {
        mockRule,
        mockRuleValue,
        mockRulePassActionData,
        msgHash,
        rsv,
    };
}

async function prepareFailRule(
    accountProvider, tokenHolder, nonce, ephemeralKey,
) {
    const mockRule = await MockRule.new();
    const mockRuleValue = accountProvider.get();
    const mockRuleFailActionData = generateMockRuleFailActionData(
        mockRuleValue,
    );

    const { msgHash, rsv } = getExecuteRuleExTxData(
        tokenHolder.address,
        mockRule.address,
        mockRuleFailActionData,
        nonce,
        ephemeralKey,
    );

    return {
        mockRule,
        mockRuleValue,
        mockRuleFailActionData,
        msgHash,
        rsv,
    };
}

contract('TokenHolder::executeRule', async () => {
    contract('Negative Tests', async (accounts) => {
        const accountProvider = new AccountProvider(accounts);

        it('Reverts if ExTx is signed with non-authorized key.', async () => {
            const spendingLimit = 10;
            const deltaExpirationHeight = 50;

            const { tokenHolder } = await createTokenHolder(
                accountProvider,
                ephemeralKeyAddress1,
                spendingLimit,
                deltaExpirationHeight,
            );

            const nonce = 1;
            const {
                mockRule,
                mockRulePassActionData,
                rsv,
            } = await preparePassRule(
                accountProvider,
                tokenHolder,
                nonce,
                ephemeralPrivateKey2,
            );

            await Utils.expectRevert(
                tokenHolder.executeRule(
                    mockRule.address,
                    mockRulePassActionData,
                    nonce,
                    rsv.v,
                    EthUtils.bufferToHex(rsv.r),
                    EthUtils.bufferToHex(rsv.s),
                ),
                'Should revert as ExTx is signed with non-authorized key.',
                'Ephemeral key is not active.',
            );
        });

        it('Reverts if ExTx is signed with authorized but expired key.', async () => {
            const spendingLimit = 10;
            const deltaExpirationHeight = 10;
            const { tokenHolder } = await createTokenHolder(
                accountProvider,
                ephemeralKeyAddress1,
                spendingLimit,
                deltaExpirationHeight,
            );

            const nonce = 1;
            const {
                mockRule,
                mockRulePassActionData,
                rsv,
            } = await preparePassRule(
                accountProvider,
                tokenHolder,
                nonce,
                ephemeralPrivateKey2,
            );

            for (let i = 0; i < deltaExpirationHeight; i += 1) {
                // eslint-disable-next-line no-await-in-loop
                await Utils.advanceBlock();
            }

            await Utils.expectRevert(
                tokenHolder.executeRule(
                    mockRule.address,
                    mockRulePassActionData,
                    nonce,
                    rsv.v,
                    EthUtils.bufferToHex(rsv.r),
                    EthUtils.bufferToHex(rsv.s),
                ),
                'Should revert as transaction is signed with expired key.',
                'Ephemeral key is not active.',
            );
        });

        it('Reverts if transaction signed with revoked key.', async () => {
            const spendingLimit = 10;
            const deltaExpirationHeight = 50;
            const {
                tokenHolder,
                registeredWallet0,
            } = await createTokenHolder(
                accountProvider,
                ephemeralKeyAddress1,
                spendingLimit,
                deltaExpirationHeight,
            );

            await tokenHolder.revokeSession(
                ephemeralKeyAddress1,
                { from: registeredWallet0 },
            );

            const keyData = await tokenHolder.ephemeralKeys(
                ephemeralKeyAddress1,
            );

            assert.isOk(
                // AuthorizationStatus.REVOKED == 2
                keyData.status.eqn(2),
                'Because of 1-wallet-1-required setup key should be revoked.',
            );

            const nonce = 1;
            const {
                mockRule,
                mockRulePassActionData,
                rsv,
            } = await preparePassRule(
                accountProvider,
                tokenHolder,
                nonce,
                ephemeralPrivateKey1,
            );

            await Utils.expectRevert(
                tokenHolder.executeRule(
                    mockRule.address,
                    mockRulePassActionData,
                    nonce,
                    rsv.v,
                    EthUtils.bufferToHex(rsv.r),
                    EthUtils.bufferToHex(rsv.s),
                ),
                'Should revert as transaction is signed with revoked key.',
                'Ephemeral key is not active.',
            );
        });

        it('Reverts if ExTx is signed with a wrong nonce.', async () => {
            const spendingLimit = 10;
            const deltaExpirationHeight = 50;
            const { tokenHolder } = await createTokenHolder(
                accountProvider,
                ephemeralKeyAddress1,
                spendingLimit,
                deltaExpirationHeight,
            );

            // Correct nonce is 1.
            const invalidNonce0 = 0;
            const {
                mockRule: mockRule0,
                mockRulePassActionData: mockRulePassActionData0,
                rsv: rsv0,
            } = await preparePassRule(
                accountProvider,
                tokenHolder,
                invalidNonce0,
                ephemeralPrivateKey1,
            );

            await Utils.expectRevert(
                tokenHolder.executeRule(
                    mockRule0.address,
                    mockRulePassActionData0,
                    invalidNonce0,
                    rsv0.v,
                    EthUtils.bufferToHex(rsv0.r),
                    EthUtils.bufferToHex(rsv0.s),
                ),
                'Should revert as ExTx is signed with a wrong nonce.',
                'The next nonce is not provided.',
            );

            // correct nonce is 1.
            const invalidNonce2 = 2;
            const {
                mockRule: mockRule2,
                mockRulePassActionData: mockRulePassActionData2,
                rsv: rsv2,
            } = await preparePassRule(
                accountProvider,
                tokenHolder,
                invalidNonce2,
                ephemeralPrivateKey1,
            );

            await Utils.expectRevert(
                tokenHolder.executeRule(
                    mockRule2.address,
                    mockRulePassActionData2,
                    invalidNonce2,
                    rsv2.v,
                    EthUtils.bufferToHex(rsv2.r),
                    EthUtils.bufferToHex(rsv2.s),
                ),
                'Should revert as ExTx is signed with a wrong nonce.',
                'The next nonce is not provided.',
            );
        });

        it('Reverts if ExTx targets itself (TokenHolder)', async () => {
            const spendingLimit = 10;
            const deltaExpirationHeight = 50;
            const { tokenHolder } = await createTokenHolder(
                accountProvider,
                ephemeralKeyAddress1,
                spendingLimit,
                deltaExpirationHeight,
            );

            const nonce = 1;
            const {
                mockRulePassActionData: mockRulePassActionData,
                rsv: rsv,
            } = await preparePassRule(
                accountProvider,
                tokenHolder,
                nonce,
                ephemeralPrivateKey1,
            );

            await Utils.expectRevert(
                tokenHolder.executeRule(
                    tokenHolder.address,
                    mockRulePassActionData,
                    nonce,
                    rsv.v,
                    EthUtils.bufferToHex(rsv.r),
                    EthUtils.bufferToHex(rsv.s),
                ),
                'Should revert as ExTx target is TokenHolder itself.',
                'Target of a transaction cannot be TokenHolder itself.',
            );
        });
    });

    contract('Events', async (accounts) => {
        const accountProvider = new AccountProvider(accounts);

        it('Emits RuleExecuted event with successful execution status.', async () => {
            const spendingLimit = 10;
            const deltaExpirationHeight = 50;
            const { tokenHolder } = await createTokenHolder(
                accountProvider,
                ephemeralKeyAddress1,
                spendingLimit,
                deltaExpirationHeight,
            );

            const nonce = 1;
            const {
                mockRule,
                mockRulePassActionData,
                msgHash,
                rsv,
            } = await preparePassRule(
                accountProvider,
                tokenHolder,
                nonce,
                ephemeralPrivateKey1,
            );

            const transactionResponse = await tokenHolder.executeRule(
                mockRule.address,
                mockRulePassActionData,
                nonce,
                rsv.v,
                EthUtils.bufferToHex(rsv.r),
                EthUtils.bufferToHex(rsv.s),
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
                    _ephemeralKey: ephemeralKeyAddress1,
                    _nonce: new BN(nonce),
                    _messageHash: msgHash,
                    _status: true,
                },
            });
        });

        it('Emits RuleExecuted event with failed execution status.', async () => {
            const spendingLimit = 10;
            const deltaExpirationHeight = 50;
            const { tokenHolder } = await createTokenHolder(
                accountProvider,
                ephemeralKeyAddress1,
                spendingLimit,
                deltaExpirationHeight,
            );

            const nonce = 1;
            const {
                mockRule,
                mockRuleFailActionData,
                msgHash,
                rsv,
            } = await prepareFailRule(
                accountProvider,
                tokenHolder,
                nonce,
                ephemeralPrivateKey1,
            );

            const transactionResponse = await tokenHolder.executeRule(
                mockRule.address,
                mockRuleFailActionData,
                nonce,
                rsv.v,
                EthUtils.bufferToHex(rsv.r),
                EthUtils.bufferToHex(rsv.s),
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
                    _ephemeralKey: ephemeralKeyAddress1,
                    _nonce: new BN(nonce),
                    _messageHash: msgHash,
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
            const spendingLimit = 10;
            const deltaExpirationHeight = 50;
            const { tokenHolder } = await createTokenHolder(
                accountProvider,
                ephemeralKeyAddress1,
                spendingLimit,
                deltaExpirationHeight,
            );

            const nonce = 1;
            const {
                mockRule,
                mockRuleValue,
                mockRulePassActionData,
                rsv,
            } = await preparePassRule(
                accountProvider,
                tokenHolder,
                nonce,
                ephemeralPrivateKey1,
            );

            await tokenHolder.executeRule(
                mockRule.address,
                mockRulePassActionData,
                nonce,
                rsv.v,
                EthUtils.bufferToHex(rsv.r),
                EthUtils.bufferToHex(rsv.s),
            );

            assert.strictEqual(
                (await mockRule.value.call()),
                mockRuleValue,
            );
        });

        it('Checks that payable rule is actually executed.', async () => {
            const spendingLimit = 10;
            const deltaExpirationHeight = 50;
            const { tokenHolder } = await createTokenHolder(
                accountProvider,
                ephemeralKeyAddress1,
                spendingLimit,
                deltaExpirationHeight,
            );

            const nonce = 1;
            const {
                mockRule,
                mockRuleValue,
                mockRulePassActionData,
                rsv,
            } = await preparePassPayableRule(
                accountProvider,
                tokenHolder,
                nonce,
                ephemeralPrivateKey1,
            );

            const payableValue = 111;
            await tokenHolder.executeRule(
                mockRule.address,
                mockRulePassActionData,
                nonce,
                rsv.v,
                EthUtils.bufferToHex(rsv.r),
                EthUtils.bufferToHex(rsv.s),
                {
                    value: payableValue,
                },
            );

            assert.strictEqual(
                (await mockRule.value.call()),
                mockRuleValue,
            );

            assert.isOk(
                (await mockRule.receivedPayableAmount.call()).eqn(payableValue),
            );
        });
    });

    contract('Returned Execution Status', async (accounts) => {
        const accountProvider = new AccountProvider(accounts);

        it('Checks that return value is true in case of successfull execution.', async () => {
            const spendingLimit = 10;
            const deltaExpirationHeight = 50;
            const { tokenHolder } = await createTokenHolder(
                accountProvider,
                ephemeralKeyAddress1,
                spendingLimit,
                deltaExpirationHeight,
            );

            const nonce = 1;
            const {
                mockRule,
                mockRulePassActionData,
                rsv,
            } = await preparePassRule(
                accountProvider,
                tokenHolder,
                nonce,
                ephemeralPrivateKey1,
            );

            const executionStatus = await tokenHolder.executeRule.call(
                mockRule.address,
                mockRulePassActionData,
                nonce,
                rsv.v,
                EthUtils.bufferToHex(rsv.r),
                EthUtils.bufferToHex(rsv.s),
            );

            assert.isOk(
                executionStatus,
            );
        });

        it('Checks that return value is true in case of failing execution.', async () => {
            const spendingLimit = 10;
            const deltaExpirationHeight = 50;
            const { tokenHolder } = await createTokenHolder(
                accountProvider,
                ephemeralKeyAddress1,
                spendingLimit,
                deltaExpirationHeight,
            );

            const nonce = 1;
            const {
                mockRule,
                mockRuleFailActionData,
                rsv,
            } = await prepareFailRule(
                accountProvider,
                tokenHolder,
                nonce,
                ephemeralPrivateKey1,
            );

            const executionStatus = await tokenHolder.executeRule.call(
                mockRule.address,
                mockRuleFailActionData,
                nonce,
                rsv.v,
                EthUtils.bufferToHex(rsv.r),
                EthUtils.bufferToHex(rsv.s),
            );

            assert.isNotOk(
                executionStatus,
            );
        });
    });
});
