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

const EthUtils = require('ethereumjs-util');
const web3 = require('../test_lib/web3.js');
const Utils = require('../test_lib/utils.js');
const { Event } = require('../test_lib/event_decoder');
const { AccountProvider } = require('../test_lib/utils.js');

const TokenHolder = artifacts.require('TokenHolder');
const MockRule = artifacts.require('MockRule');
const TokenRulesMock = artifacts.require('TokenRulesMock');
const UtilityTokenMock = artifacts.require('UtilityTokenMock');

const ephemeralKeyAddress1 = '0x62502C4DF73935D0D10054b0Fb8cC036534C6fb0';
const ephemeralPrivateKey1 = '0xa8225c01ceeaf01d7bc7c1b1b929037bd4050967c5730c0b854263121b8399f3';
const ephemeralPrivateKey2 = '0x634011a05b2f48e2d19aba49a9dbc12766bf7dbd6111ed2abb2621c92e8cfad9';

let token;


function getRevertRedemptionCallPrefix() {
  return web3.eth.abi.encodeFunctionSignature({
    name: 'revertRedemption',
    type: 'function',
    inputs: [
      {
        type: 'bytes32', name: '',
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

function getRevertRedemptionSignedData(
  tokenHolderAddress, ruleAddress, revertRedemptionCallData, nonce, ephemeralKey
) {
  const msgHash = web3.utils.soliditySha3(
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
      t: 'bytes32', v: web3.utils.keccak256(revertRedemptionCallData),
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
      t: 'bytes4', v: getRevertRedemptionCallPrefix(),
    },
    {
      t: 'uint8', v: 0,
    },
    {
      t: 'bytes32', v: '0x0',
    },
  );

  const rsv = EthUtils.ecsign(
    EthUtils.toBuffer(msgHash),
    EthUtils.toBuffer(ephemeralKey),
  );

  return { msgHash, rsv };
}

function getRevertRedemptionDataToSign(
  messageHash) {
  return web3.eth.abi.encodeFunctionCall(
    {
      name: 'revertRedemption',
      type: 'function',
      inputs: [
        {
          type: 'bytes32',
          name: 'messageHash',
        }
      ],
    },
    [messageHash],
  );
}

async function prepareRevertRedemptionPayableRule(
  accountProvider,
  messageHash,
  tokenHolder,
  nonce,
  ephemeralKey,
)
{
  const mockRule = await MockRule.new();

  const coGatewayRevertRedemptionEncodedAbi = await getRevertRedemptionDataToSign(
    messageHash
  );

  const { msgHash, rsv } = getRevertRedemptionSignedData(
    tokenHolder.address,
    mockRule.address,
    coGatewayRevertRedemptionEncodedAbi,
    nonce,
    ephemeralKey,
  );

  return {
    mockRule,
    msgHash,
    rsv,
  };
}

async function setupTokenHolder(
  accountProvider, _ephemeralKeyAddress, _spendingLimit, _deltaExpirationHeight,
) {
  token = await UtilityTokenMock.new(1, 1, 'OST', 'Open Simple Token', 1);
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

contract('TokenHolder::revertRedemption', async (accounts) => {

  describe('Negative Tests', async () => {
    const accountProvider = new AccountProvider(accounts);
    const spendingLimit = 50,
      deltaExpirationHeight = 100,
      payableValue = 100,
      facilitator = accountProvider.get(),
      nonce = 1,
      redeemMessageHash = web3.utils.soliditySha3('redeemMessageHash');

    it('Reverts if ExTx is signed with non-authorized key.', async () => {

      const {
        tokenHolder,
      } = await setupTokenHolder(
        accountProvider,
        ephemeralKeyAddress1,
        spendingLimit,
        deltaExpirationHeight,
      );

      const {
        mockRule,
        rsv,
      } = await prepareRevertRedemptionPayableRule(
        accountProvider,
        redeemMessageHash,
        tokenHolder,
        nonce,
        ephemeralPrivateKey2,
      );

      await token.setCoGateway(mockRule.address);


      await Utils.expectRevert(
        tokenHolder.revertRedemption(
          redeemMessageHash,
          nonce,
          rsv.v,
          EthUtils.bufferToHex(rsv.r),
          EthUtils.bufferToHex(rsv.s),
          {
            value: payableValue,
            from: facilitator,
          }
        ),
        'Should revert as revertRedemption is signed with non-authorized key.',
        'Ephemeral key is not active.'
      );
    });

    it('Reverts if revertRedemption ExTx is signed with authorized but expired key.', async () => {

      const {
        tokenHolder,
      } = await setupTokenHolder(
        accountProvider,
        ephemeralKeyAddress1,
        spendingLimit,
        deltaExpirationHeight,
      );

      for (let i = 0; i < deltaExpirationHeight; i += 1) {
        await Utils.advanceBlock();
      }

      const {
        mockRule,
        rsv,
      } = await prepareRevertRedemptionPayableRule(
        accountProvider,
        redeemMessageHash,
        tokenHolder,
        nonce,
        ephemeralPrivateKey1,
      );

      await token.setCoGateway(mockRule.address);

      await Utils.expectRevert(
        tokenHolder.revertRedemption(
          redeemMessageHash,
          nonce,
          rsv.v,
          EthUtils.bufferToHex(rsv.r),
          EthUtils.bufferToHex(rsv.s),
          {
            value: payableValue,
            from: facilitator,
          }
        ),
        'Should revert as revertRedemption is signed with authorized expired key.',
        'Ephemeral key is not active.'
      );

    });

    it('Reverts if transaction signed with revoked key.', async () => {
      const {
        tokenHolder,
        registeredWallet0,
      } = await setupTokenHolder(
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
        keyData.status.eqn(2),
        'Ephemeral key should be revoked.',
      );

      const {
        mockRule,
        rsv,
      } = await prepareRevertRedemptionPayableRule(
        accountProvider,
        redeemMessageHash,
        tokenHolder,
        nonce,
        ephemeralPrivateKey1,
      );

      await token.setCoGateway(mockRule.address);

      await Utils.expectRevert(
        tokenHolder.revertRedemption(
          redeemMessageHash,
          nonce,
          rsv.v,
          EthUtils.bufferToHex(rsv.r),
          EthUtils.bufferToHex(rsv.s),
          {
            value: payableValue,
            from: facilitator,
          }
        ),
        'Should revert as revertRedemption is signed with authorized expired key.',
        'Ephemeral key is not active.'
      );
    });

    it('Reverts if data is not signed with valid nonce.', async () => {
      const {
        tokenHolder
      } = await setupTokenHolder(
        accountProvider,
        ephemeralKeyAddress1,
        spendingLimit,
        deltaExpirationHeight,
      );

      const {
        mockRule,
        rsv,
      } = await prepareRevertRedemptionPayableRule(
        accountProvider,
        redeemMessageHash,
        tokenHolder,
        nonce,
        ephemeralPrivateKey1,
      );

      await token.setCoGateway(mockRule.address);

      const invalidNonce = 0;
      await Utils.expectRevert(
        tokenHolder.revertRedemption(
          redeemMessageHash,
          invalidNonce,
          rsv.v,
          EthUtils.bufferToHex(rsv.r),
          EthUtils.bufferToHex(rsv.s),
          {
            value: payableValue,
            from: facilitator,
          }
        ),
        'Should revert as data is not signed with valid nonce.',
        'Ephemeral key is not active.'
      );
    });

  });

  describe('Positive Tests', async () => {
    const accountProvider = new AccountProvider(accounts);

    it('Checks that revertRedemption payable rule is successfully executed.', async () => {
      const spendingLimit = 50,
        deltaExpirationHeight = 100,
        facilitator = accountProvider.get(),
        redeemMessageHash = web3.utils.soliditySha3('redeemMessageHash');

      const {
        tokenHolder,
      } = await setupTokenHolder(
        accountProvider,
        ephemeralKeyAddress1,
        spendingLimit,
        deltaExpirationHeight,
      );

      const nonce = 1;
      const {
        mockRule,
        rsv,
      } = await prepareRevertRedemptionPayableRule(
        accountProvider,
        redeemMessageHash,
        tokenHolder,
        nonce,
        ephemeralPrivateKey1,
      );

      await token.setCoGateway(mockRule.address);

      const payableValue = 100;
      let redeemReceipt = await tokenHolder.revertRedemption(
        redeemMessageHash,
        nonce,
        rsv.v,
        EthUtils.bufferToHex(rsv.r),
        EthUtils.bufferToHex(rsv.s),
        {
          value: payableValue,
          from: facilitator,
        }
      );

      assert.equal(redeemReceipt.receipt.status, true);

      assert.strictEqual(
        (await tokenHolder.coGateway.call()),
        mockRule.address,
      );

      assert.isOk(
        (await mockRule.receivedPayableAmount.call()).eqn(payableValue),
      );
    });

  });

  describe('Events', async () => {
    const accountProvider = new AccountProvider(accounts);

    it('Verifies emitting of RevertRedemptionInitiated event.', async () => {
      const spendingLimit = 50,
        deltaExpirationHeight = 100,
        facilitator = accountProvider.get(),
        redeemMessageHash = web3.utils.soliditySha3('redeemMessageHash');

      const {
        tokenHolder,
      } = await setupTokenHolder(
        accountProvider,
        ephemeralKeyAddress1,
        spendingLimit,
        deltaExpirationHeight,
      );

      const nonce = 1;
      const {
        mockRule,
        rsv,
      } = await prepareRevertRedemptionPayableRule(
        accountProvider,
        redeemMessageHash,
        tokenHolder,
        nonce,
        ephemeralPrivateKey1,
      );

      await token.setCoGateway(mockRule.address);

      const payableValue = 100;

      const executionStatus = await tokenHolder.revertRedemption.call(
        redeemMessageHash,
        nonce,
        rsv.v,
        EthUtils.bufferToHex(rsv.r),
        EthUtils.bufferToHex(rsv.s),
        {
          value: payableValue,
          from: facilitator,
        }
      );

      let redeemReceipt = await tokenHolder.revertRedemption(
        redeemMessageHash,
        nonce,
        rsv.v,
        EthUtils.bufferToHex(rsv.r),
        EthUtils.bufferToHex(rsv.s),
        {
          value: payableValue,
          from: facilitator,
        }
      );

      const events = Event.decodeTransactionResponse(
        redeemReceipt,
      );

      assert.strictEqual(
        events.length,
        1,
      );

      Event.assertEqual(events[0], {
        name: 'RevertRedemptionInitiated',
        args: {
          _redeemMessageHash: redeemMessageHash,
          _ephemeralKey: ephemeralKeyAddress1,
          _executionStatus: executionStatus
        },
      });

    });

    it('Checks that TH.revertRedemption execution status is false when msg.value is 0.', async () => {
      const spendingLimit = 50,
        deltaExpirationHeight = 100,
        facilitator = accountProvider.get(),
        redeemMessageHash = web3.utils.soliditySha3('redeemMessageHash');

      const {
        tokenHolder,
      } = await setupTokenHolder(
        accountProvider,
        ephemeralKeyAddress1,
        spendingLimit,
        deltaExpirationHeight,
      );

      const nonce = 1;
      const {
        mockRule,
        rsv,
      } = await prepareRevertRedemptionPayableRule(
        accountProvider,
        redeemMessageHash,
        tokenHolder,
        nonce,
        ephemeralPrivateKey1,
      );

      await token.setCoGateway(mockRule.address);

      const payableValue = 0;
      let redeemReceipt = await tokenHolder.revertRedemption(
        redeemMessageHash,
        nonce,
        rsv.v,
        EthUtils.bufferToHex(rsv.r),
        EthUtils.bufferToHex(rsv.s),
        {
          value: payableValue,
          from: facilitator,
        }
      );

      assert.equal(redeemReceipt.receipt.status, true);

      const events = Event.decodeTransactionResponse(
        redeemReceipt,
      );

      assert.strictEqual(
        events.length,
        1,
      );

      Event.assertEqual(events[0], {
        name: 'RevertRedemptionInitiated',
        args: {
          _redeemMessageHash: redeemMessageHash,
          _ephemeralKey: ephemeralKeyAddress1,
          _executionStatus: null // web3 Returns null when execution status is false.
        },
      });

    });

  });

});
