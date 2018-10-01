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
const ethUtils = require('ethereumjs-util');

const TokenHolder = artifacts.require('TokenHolder');
const MockRule = artifacts.require('MockRule');
const TokenRulesMock = artifacts.require('TokenRulesMock');
const EIP20TokenMock = artifacts.require('EIP20TokenMock');

const ephemeralPrivateKey1 = '0xa8225c01ceeaf01d7bc7c1b1b929037bd4050967c5730c0b854263121b8399f3';
const ephemeralKeyAddress1 = '0x62502C4DF73935D0D10054b0Fb8cC036534C6fb0';

const ephemeralPrivateKey2 = '0x634011a05b2f48e2d19aba49a9dbc12766bf7dbd6111ed2abb2621c92e8cfad9';
const ephemeralKeyAddress2 = '0x4b1E0C6d1423cdEa335512b2c89F935c4c258EB0';

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

    const rsv = ethUtils.ecsign(
        ethUtils.toBuffer(msgHash),
        ethUtils.toBuffer(_ephemeralKey),
    );

    return [msgHash, rsv];
}

async function createTokenHolder(
    _wallet, _ephemeralKeyAddress, _spendingLimit, _deltaExpirationHeight,
) {
    const token = await EIP20TokenMock.new(1, 1, 'OST', 'Open Simple Token', 1);
    const tokenRules = await TokenRulesMock.new();
    const required = 1;
    const registeredWallet0 = _wallet;
    const wallets = [registeredWallet0];

    const tokenHolder = await TokenHolder.new(
        token.address,
        tokenRules.address,
        required,
        wallets,
    );

    await tokenHolder.submitAuthorizeSession(
        _ephemeralKeyAddress,
        _spendingLimit,
        (await web3.eth.getBlockNumber()) + _deltaExpirationHeight,
        {
            from: registeredWallet0,
        },
    );

    return tokenHolder;
}

contract('TokenHolder::executeRule', async () => {
    contract('Negative Testing', async (accounts) => {
        it('Non authorized ephemeral key.', async () => {
            const spendingLimit = 10;
            const deltaExpirationHeight = 50;
            const tokenHolder = await createTokenHolder(
                accounts[0],
                ephemeralKeyAddress1,
                spendingLimit,
                deltaExpirationHeight,
            );

            const mockRule = await MockRule.new();
            const mockRuleValue = accounts[1];
            const mockRulePassActionData = generateMockRulePassActionData(
                mockRuleValue,
            );
            const nonce = 1;

            const [, rsv] = getExecuteRuleExTxData(
                tokenHolder.address,
                mockRule.address,
                mockRulePassActionData,
                nonce,
                ephemeralPrivateKey2,
            );

            await utils.expectRevert(
                tokenHolder.executeRule(
                    mockRule.address,
                    mockRulePassActionData,
                    nonce,
                    rsv.v,
                    ethUtils.bufferToHex(rsv.r),
                    ethUtils.bufferToHex(rsv.s),
                ),
                'Transaction is signed with non authorized key.',
            );
        });

        it('Authorized but expired ephemeral key.', async () => {
            const spendingLimit = 10;
            // deltaExpirationHeight is set to 2, as within createTokenHolder
            // two transactions are done: creating token holder and
            // authorizing key. After that key is expired.
            const deltaExpirationHeight = 2;
            const tokenHolder = await createTokenHolder(
                accounts[0],
                ephemeralKeyAddress1,
                spendingLimit,
                deltaExpirationHeight,
            );

            const mockRule = await MockRule.new();
            const mockRuleValue = accounts[1];
            const mockRulePassActionData = generateMockRulePassActionData(
                mockRuleValue,
            );
            const nonce = 1;

            const [, rsv] = getExecuteRuleExTxData(
                tokenHolder.address,
                mockRule.address,
                mockRulePassActionData,
                nonce,
                ephemeralPrivateKey1,
            );

            await utils.expectRevert(
                tokenHolder.executeRule(
                    mockRule.address,
                    mockRulePassActionData,
                    nonce,
                    rsv.v,
                    ethUtils.bufferToHex(rsv.r),
                    ethUtils.bufferToHex(rsv.s),
                ),
                'Transaction is signed with expired key.',
            );
        });

        it('Revoked ephemeral key.', async () => {
            const spendingLimit = 10;
            const deltaExpirationHeight = 50;
            const wallet = accounts[0];
            const tokenHolder = await createTokenHolder(
                wallet,
                ephemeralKeyAddress1,
                spendingLimit,
                deltaExpirationHeight,
            );

            await tokenHolder.submitRevokeSession(
                ephemeralKeyAddress1,
                {
                    from: wallet,
                },
            );

            const keyData = await tokenHolder.ephemeralKeys(
                ephemeralKeyAddress1,
            );
            assert.isOk(
                // AuthorizationStatus.REVOKED == 2
                keyData.status.eqn(2),
                'Because of 1-wallet-1-required setup key should be revoked.',
            );

            const mockRule = await MockRule.new();
            const mockRuleValue = accounts[1];
            const mockRulePassActionData = generateMockRulePassActionData(
                mockRuleValue,
            );
            const nonce = 1;

            const [, rsv] = getExecuteRuleExTxData(
                tokenHolder.address,
                mockRule.address,
                mockRulePassActionData,
                nonce,
                ephemeralPrivateKey1,
            );

            await utils.expectRevert(
                tokenHolder.executeRule(
                    mockRule.address,
                    mockRulePassActionData,
                    nonce,
                    rsv.v,
                    ethUtils.bufferToHex(rsv.r),
                    ethUtils.bufferToHex(rsv.s),
                ),
                'Transaction is signed with revoked key.',
            );
        });

        it('Invalid nonce.', async () => {
            const spendingLimit = 10;
            const deltaExpirationHeight = 50;
            const tokenHolder = await createTokenHolder(
                accounts[0],
                ephemeralKeyAddress1,
                spendingLimit,
                deltaExpirationHeight,
            );

            const mockRule = await MockRule.new();
            const mockRuleValue = accounts[1];
            const mockRuleSucceedActionData = generateMockRulePassActionData(
                mockRuleValue,
            );

            // Correct nonce is 1.
            const invalidNonce0 = 0;

            const [, rsv0] = getExecuteRuleExTxData(
                tokenHolder.address,
                mockRule.address,
                mockRuleSucceedActionData,
                invalidNonce0, // correct nonce is 1
                ephemeralPrivateKey2,
            );

            await utils.expectRevert(
                tokenHolder.executeRule(
                    mockRule.address,
                    mockRuleSucceedActionData,
                    invalidNonce0,
                    rsv0.v,
                    ethUtils.bufferToHex(rsv0.r),
                    ethUtils.bufferToHex(rsv0.s),
                ),
                'Transaction is signed with non authorized key.',
            );

            // correct nonce is 1.
            const invalidNonce2 = 2;

            const [, rsv2] = getExecuteRuleExTxData(
                tokenHolder.address,
                mockRule.address,
                mockRuleSucceedActionData,
                invalidNonce2, // correct nonce is 1
                ephemeralPrivateKey2,
            );

            await utils.expectRevert(
                tokenHolder.executeRule(
                    mockRule.address,
                    mockRuleSucceedActionData,
                    invalidNonce2,
                    rsv2.v,
                    ethUtils.bufferToHex(rsv2.r),
                    ethUtils.bufferToHex(rsv2.s),
                ),
                'Transaction is signed with non authorized key.',
            );
        });
    });

    contract('Events', async (accounts) => {
        it('Rule Passed.', async () => {
            const spendingLimit = 10;
            const deltaExpirationHeight = 50;
            const tokenHolder = await createTokenHolder(
                accounts[0],
                ephemeralKeyAddress1,
                spendingLimit,
                deltaExpirationHeight,
            );

            const mockRule = await MockRule.new();
            const mockRuleValue = accounts[1];
            const mockRulePassActionData = generateMockRulePassActionData(
                mockRuleValue,
            );
            const nonce = 1;

            const [msgHash, rsv] = getExecuteRuleExTxData(
                tokenHolder.address,
                mockRule.address,
                mockRulePassActionData,
                nonce,
                ephemeralPrivateKey1,
            );

            const transactionResponse = await tokenHolder.executeRule(
                mockRule.address,
                mockRulePassActionData,
                nonce,
                rsv.v,
                ethUtils.bufferToHex(rsv.r),
                ethUtils.bufferToHex(rsv.s),
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

        it('Rule Failed.', async () => {
            const spendingLimit = 10;
            const deltaExpirationHeight = 50;
            const tokenHolder = await createTokenHolder(
                accounts[0],
                ephemeralKeyAddress1,
                spendingLimit,
                deltaExpirationHeight,
            );

            const mockRule = await MockRule.new();
            const mockRuleValue = accounts[1];
            const mockRuleFailActionData = generateMockRuleFailActionData(
                mockRuleValue,
            );
            const nonce = 1;

            const [msgHash, rsv] = getExecuteRuleExTxData(
                tokenHolder.address,
                mockRule.address,
                mockRuleFailActionData,
                nonce,
                ephemeralPrivateKey1,
            );

            const transactionResponse = await tokenHolder.executeRule(
                mockRule.address,
                mockRuleFailActionData,
                nonce,
                rsv.v,
                ethUtils.bufferToHex(rsv.r),
                ethUtils.bufferToHex(rsv.s),
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

    contract('Rule Execution Status', async (accounts) => {
        it('Successful Execution', async () => {
            const spendingLimit = 10;
            const deltaExpirationHeight = 50;
            const tokenHolder = await createTokenHolder(
                accounts[0],
                ephemeralKeyAddress1,
                spendingLimit,
                deltaExpirationHeight,
            );

            const mockRule = await MockRule.new();
            const mockRuleValue = accounts[1];
            const mockRulePassActionData = generateMockRulePassActionData(
                mockRuleValue,
            );
            const nonce = 1;

            const [, rsv] = getExecuteRuleExTxData(
                tokenHolder.address,
                mockRule.address,
                mockRulePassActionData,
                nonce,
                ephemeralPrivateKey1,
            );

            await tokenHolder.executeRule(
                mockRule.address,
                mockRulePassActionData,
                nonce,
                rsv.v,
                ethUtils.bufferToHex(rsv.r),
                ethUtils.bufferToHex(rsv.s),
            );

            assert.strictEqual(
                (await mockRule.value.call()),
                mockRuleValue,
            );
        });

        it('Failing Execution', async () => {
            const spendingLimit = 10;
            const deltaExpirationHeight = 50;
            const tokenHolder = await createTokenHolder(
                accounts[0],
                ephemeralKeyAddress1,
                spendingLimit,
                deltaExpirationHeight,
            );

            const mockRule = await MockRule.new();
            const mockRuleValue = accounts[1];
            const mockRuleFailActionData = generateMockRuleFailActionData(
                mockRuleValue,
            );
            const nonce = 1;

            const [, rsv] = getExecuteRuleExTxData(
                tokenHolder.address,
                mockRule.address,
                mockRuleFailActionData,
                nonce,
                ephemeralPrivateKey1,
            );

            await tokenHolder.executeRule(
                mockRule.address,
                mockRuleFailActionData,
                nonce,
                rsv.v,
                ethUtils.bufferToHex(rsv.r),
                ethUtils.bufferToHex(rsv.s),
            );

            assert.strictEqual(
                (await mockRule.value.call()),
                utils.NULL_ADDRESS,
            );
        });
    });

    contract('Return value', async (accounts) => {
        it('True case', async () => {
            const spendingLimit = 10;
            const deltaExpirationHeight = 50;
            const tokenHolder = await createTokenHolder(
                accounts[0],
                ephemeralKeyAddress1,
                spendingLimit,
                deltaExpirationHeight,
            );

            const mockRule = await MockRule.new();
            const mockRuleValue = accounts[1];
            const mockRulePassActionData = generateMockRulePassActionData(
                mockRuleValue,
            );
            const nonce = 1;

            const [, rsv] = getExecuteRuleExTxData(
                tokenHolder.address,
                mockRule.address,
                mockRulePassActionData,
                nonce,
                ephemeralPrivateKey1,
            );

            const executionStatus = await tokenHolder.executeRule.call(
                mockRule.address,
                mockRulePassActionData,
                nonce,
                rsv.v,
                ethUtils.bufferToHex(rsv.r),
                ethUtils.bufferToHex(rsv.s),
            );

            assert.isOk(
                executionStatus,
            );
        });

        it('Failing Execution', async () => {
            const spendingLimit = 10;
            const deltaExpirationHeight = 50;
            const tokenHolder = await createTokenHolder(
                accounts[0],
                ephemeralKeyAddress1,
                spendingLimit,
                deltaExpirationHeight,
            );

            const mockRule = await MockRule.new();
            const mockRuleValue = accounts[1];
            const mockRuleFailActionData = generateMockRuleFailActionData(
                mockRuleValue,
            );
            const nonce = 1;

            const [, rsv] = getExecuteRuleExTxData(
                tokenHolder.address,
                mockRule.address,
                mockRuleFailActionData,
                nonce,
                ephemeralPrivateKey1,
            );

            const executionStatus = await tokenHolder.executeRule.call(
                mockRule.address,
                mockRuleFailActionData,
                nonce,
                rsv.v,
                ethUtils.bufferToHex(rsv.r),
                ethUtils.bufferToHex(rsv.s),
            );

            assert.isNotOk(
                executionStatus,
            );
        });
    });
});
