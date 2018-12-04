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
const UtilityTokenMock = artifacts.require('UtilityTokenMock');

const ephemeralKeyAddress1 = '0x62502C4DF73935D0D10054b0Fb8cC036534C6fb0';
const ephemeralPrivateKey1 = '0xa8225c01ceeaf01d7bc7c1b1b929037bd4050967c5730c0b854263121b8399f3';
const ephemeralPrivateKey2 = '0x634011a05b2f48e2d19aba49a9dbc12766bf7dbd6111ed2abb2621c92e8cfad9';

let token;

async function getRedeemSignedData(
  tokenHolder, ruleAddress, redeemCallData, nonce, ephemeralKey
) {

  let redeemRuleCallPrefix = await tokenHolder.REDEEM_RULE_CALLPREFIX.call();
  const msgHash = web3.utils.soliditySha3(
    {
      t: 'bytes1', v: '0x19',
    },
    {
      t: 'bytes1', v: '0x0',
    },
    {
      t: 'address', v: tokenHolder.address,
    },
    {
      t: 'address', v: ruleAddress,
    },
    {
      t: 'uint8', v: 0,
    },
    {
      t: 'bytes32', v: web3.utils.keccak256(redeemCallData),
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
      t: 'bytes4', v: redeemRuleCallPrefix,
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

function getRedeemDataToSign(
  amount, beneficiary, gasPrice, gasLimit, redeemerNonce) {
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
          name: 'redeemerNonce',
        },
      ],
    },
    [amount, beneficiary, gasPrice, gasLimit, redeemerNonce],
  );
}

async function prepareRedeemPayableRule(
    amount,
    beneficiary,
    gasPrice,
    gasLimit,
    redeemerNonce,
    tokenHolder,
    nonce,
    ephemeralKey,
)
{
  const coGateway = await MockRule.new();

  const coGatewayRedeemEncodedAbiWithoutHashLock = await getRedeemDataToSign(
      amount,
      beneficiary,
      gasPrice,
      gasLimit,
      redeemerNonce
    );

  const { msgHash, rsv } = await getRedeemSignedData(
    tokenHolder,
    coGateway.address,
    coGatewayRedeemEncodedAbiWithoutHashLock,
    nonce,
    ephemeralKey,
  );

  return {
    coGateway,
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

contract('TokenHolder::redeem', async (accounts) => {

  describe('Negative Tests', async () => {
    const accountProvider = new AccountProvider(accounts);
    const spendingLimit = 50,
      deltaExpirationHeight = 100,
      amount = 10,
      beneficiary = accountProvider.get(),
      facilitator = accountProvider.get(),
      gasPrice = 10,
      gasLimit = 10,
      redeemerNonce = 1,
      hashLock = web3.utils.soliditySha3('hl'),
      nonce = 1;

    it('Reverts if ExTx is signed with non-authorized key.', async () => {

      const {
        tokenHolder,
      } = await setupTokenHolder(
        accountProvider,
        ephemeralKeyAddress1,
        spendingLimit,
        deltaExpirationHeight,
      );

      const keyData = await tokenHolder.ephemeralKeys(ephemeralKeyAddress1);
      let nonce = keyData.nonce.add(new BN(1));
      const {
        coGateway,
        rsv,
      } = await prepareRedeemPayableRule(
        amount,
        beneficiary,
        gasPrice,
        gasLimit,
        redeemerNonce,
        tokenHolder,
        nonce,
        ephemeralPrivateKey2,
      );

      await token.setCoGateway(coGateway.address);
      let bounty = await coGateway.BOUNTY.call();

      await Utils.expectRevert(
         tokenHolder.redeem(
          amount,
          beneficiary,
          gasPrice,
          gasLimit,
          redeemerNonce,
          hashLock,
          nonce,
          rsv.v,
          EthUtils.bufferToHex(rsv.r),
          EthUtils.bufferToHex(rsv.s),
          {
            value: bounty,
            from: facilitator,
          }
      ),
      'Should revert as Redeem is signed with non-authorized key.',
      'Ephemeral key is not active.'
      );
    });

    it('Reverts if Redeem ExTx is signed with authorized but expired key.', async () => {

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

      const keyData = await tokenHolder.ephemeralKeys(ephemeralKeyAddress1);
      let nonce = keyData.nonce.add(new BN(1));

      const {
        coGateway,
        rsv,
      } = await prepareRedeemPayableRule(
        amount,
        beneficiary,
        gasPrice,
        gasLimit,
        redeemerNonce,
        tokenHolder,
        nonce,
        ephemeralPrivateKey2,
      );

      await token.setCoGateway(coGateway.address);
      let bounty = await coGateway.BOUNTY.call();

      await Utils.expectRevert(
        tokenHolder.redeem(
          amount,
          beneficiary,
          gasPrice,
          gasLimit,
          redeemerNonce,
          hashLock,
          nonce,
          rsv.v,
          EthUtils.bufferToHex(rsv.r),
          EthUtils.bufferToHex(rsv.s),
          {
            value: bounty,
            from: facilitator,
          }
        ),
        'Should revert as Redeem is signed with authorized expired key.',
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

      const keyData = await tokenHolder.ephemeralKeys(ephemeralKeyAddress1);
      assert.strictEqual(keyData.status.cmp(new BN(2)), 0);

      let nonce = keyData.nonce.add(new BN(1));

      const {
        coGateway,
        rsv,
      } = await prepareRedeemPayableRule(
        amount,
        beneficiary,
        gasPrice,
        gasLimit,
        redeemerNonce,
        tokenHolder,
        nonce,
        ephemeralPrivateKey1,
      );

      await token.setCoGateway(coGateway.address);
      let bounty = await coGateway.BOUNTY.call();

      await Utils.expectRevert(
        tokenHolder.redeem(
          amount,
          beneficiary,
          gasPrice,
          gasLimit,
          redeemerNonce,
          hashLock,
          nonce,
          rsv.v,
          EthUtils.bufferToHex(rsv.r),
          EthUtils.bufferToHex(rsv.s),
          {
            value: bounty,
            from: facilitator,
          }
        ),
        'Should revert as Redeem is signed with authorized expired key.',
        'Ephemeral key is not active.'
      );
    });

    it('Reverts if amount to redeem is higher than spending limit.', async () => {
      const {
        tokenHolder
      } = await setupTokenHolder(
        accountProvider,
        ephemeralKeyAddress1,
        spendingLimit,
        deltaExpirationHeight,
      );

      const amountToRedeem = 100;
      const keyData = await tokenHolder.ephemeralKeys(ephemeralKeyAddress1);
      let nonce = keyData.nonce.add(new BN(1));

      const {
        coGateway,
        rsv,
      } = await prepareRedeemPayableRule(
        amountToRedeem,
        beneficiary,
        gasPrice,
        gasLimit,
        redeemerNonce,
        tokenHolder,
        nonce,
        ephemeralPrivateKey1,
      );

      await token.setCoGateway(coGateway.address);
      let bounty = await coGateway.BOUNTY.call();

      await Utils.expectRevert(
        tokenHolder.redeem(
          amountToRedeem,
          beneficiary,
          gasPrice,
          gasLimit,
          redeemerNonce,
          hashLock,
          nonce,
          rsv.v,
          EthUtils.bufferToHex(rsv.r),
          EthUtils.bufferToHex(rsv.s),
          {
            value: bounty,
            from: facilitator,
          }
        ),
        'Should revert as amount to redeem is higher than redemption limit.',
        'Amount to redeem should be lte to spending limit.'
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

      const keyData = await tokenHolder.ephemeralKeys(ephemeralKeyAddress1);
      let nonce = keyData.nonce.add(new BN(1));

      const {
        coGateway,
        rsv,
      } = await prepareRedeemPayableRule(
        amount,
        beneficiary,
        gasPrice,
        gasLimit,
        redeemerNonce,
        tokenHolder,
        nonce,
        ephemeralPrivateKey1,
      );

      await token.setCoGateway(coGateway.address);
      let bounty = await coGateway.BOUNTY.call();

      const invalidNonce = 0;
      await Utils.expectRevert(
        tokenHolder.redeem(
          amount,
          beneficiary,
          gasPrice,
          gasLimit,
          redeemerNonce,
          hashLock,
          invalidNonce,
          rsv.v,
          EthUtils.bufferToHex(rsv.r),
          EthUtils.bufferToHex(rsv.s),
          {
            value: bounty,
            from: facilitator,
          }
        ),
        'Should revert as data is not signed with valid nonce.',
        'Ephemeral key is not active.'
      );
    });

    it('Reverts if same signature/nonce is used to call redeem.', async () => {
      const {
        tokenHolder
      } = await setupTokenHolder(
        accountProvider,
        ephemeralKeyAddress1,
        spendingLimit,
        deltaExpirationHeight,
      );

      const keyData = await tokenHolder.ephemeralKeys(ephemeralKeyAddress1);
      let nonce = keyData.nonce.add(new BN(1));

      const {
        coGateway,
        rsv,
      } = await prepareRedeemPayableRule(
        amount,
        beneficiary,
        gasPrice,
        gasLimit,
        redeemerNonce,
        tokenHolder,
        nonce,
        ephemeralPrivateKey1,
      );

      await token.setCoGateway(coGateway.address);
      let bounty = await coGateway.BOUNTY.call();

      await tokenHolder.redeem(
        amount,
        beneficiary,
        gasPrice,
        gasLimit,
        redeemerNonce,
        hashLock,
        nonce,
        rsv.v,
        EthUtils.bufferToHex(rsv.r),
        EthUtils.bufferToHex(rsv.s),
        {
          value: bounty,
          from: facilitator,
        }
      );

      await Utils.expectRevert(
        tokenHolder.redeem(
          amount,
          beneficiary,
          gasPrice,
          gasLimit,
          redeemerNonce,
          hashLock,
          nonce,
          rsv.v,
          EthUtils.bufferToHex(rsv.r),
          EthUtils.bufferToHex(rsv.s),
          {
            value: bounty,
            from: facilitator,
          }
        ),
        'Should revert as same signature and nonce used to make transaction.',
        'The next nonce is not provided.'
      );
    });

  });

  describe('Positive Tests', async () => {
    const accountProvider = new AccountProvider(accounts),
      spendingLimit = 50,
      deltaExpirationHeight = 100,
      amount = 10,
      beneficiary = accountProvider.get(),
      facilitator = accountProvider.get(),
      gasPrice = 10,
      gasLimit = 10,
      // redeemerNonce is nonce of TokenHolder.It's stored in coGateway contract.
      redeemerNonce = 1,
      hashLock = web3.utils.soliditySha3('hl');

    it('Checks that redeem payable rule is successfully executed.', async () => {

      const {
              tokenHolder,
           } = await setupTokenHolder(
        accountProvider,
        ephemeralKeyAddress1,
        spendingLimit,
        deltaExpirationHeight,
      );

      const keyData = await tokenHolder.ephemeralKeys(ephemeralKeyAddress1);
      let nonce = keyData.nonce.add(new BN(1));

      const {
        coGateway,
        rsv,
      } = await prepareRedeemPayableRule(
        amount,
        beneficiary,
        gasPrice,
        gasLimit,
        redeemerNonce,
        tokenHolder,
        nonce,
        ephemeralPrivateKey1,
      );

      await token.setCoGateway(coGateway.address);
      let bounty = await coGateway.BOUNTY.call();

      let returnedExecutionStatus = await tokenHolder.redeem.call(
        amount,
        beneficiary,
        gasPrice,
        gasLimit,
        redeemerNonce,
        hashLock,
        nonce,
        rsv.v,
        EthUtils.bufferToHex(rsv.r),
        EthUtils.bufferToHex(rsv.s),
        {
          value: bounty,
          from: facilitator,
        }
      );

      assert.strictEqual(returnedExecutionStatus, true);

      let redeemReceipt = await tokenHolder.redeem(
        amount,
        beneficiary,
        gasPrice,
        gasLimit,
        redeemerNonce,
        hashLock,
        nonce,
        rsv.v,
        EthUtils.bufferToHex(rsv.r),
        EthUtils.bufferToHex(rsv.s),
        {
          value: bounty,
          from: facilitator,
        }
      );

      assert.strictEqual(redeemReceipt.receipt.status, true);

      const updatedPayableValue = await coGateway.receivedPayableAmount.call();

      assert.strictEqual(updatedPayableValue.cmp(new BN(bounty)), 0);

      const allowance = await (token.allowance.call(
        tokenHolder.address,
        coGateway.address)
      );

      assert.strictEqual(allowance.cmp(new BN(0)), 0);
    });

  });

  describe('Events', async () => {
    const accountProvider = new AccountProvider(accounts);

    it('Verifies emitting of RedeemInitiated event.', async () => {
      const spendingLimit = 50,
        deltaExpirationHeight = 100,
        amount = 10,
        beneficiary = accountProvider.get(),
        facilitator = accountProvider.get(),
        gasPrice = 10,
        gasLimit = 10,
        redeemerNonce = 1,
        hashLock = web3.utils.soliditySha3('hl');

      const {
        tokenHolder,
      } = await setupTokenHolder(
        accountProvider,
        ephemeralKeyAddress1,
        spendingLimit,
        deltaExpirationHeight,
      );

      const keyData = await tokenHolder.ephemeralKeys(ephemeralKeyAddress1);
      let nonce = keyData.nonce.add(new BN(1));

      const {
        coGateway,
        rsv,
      } = await prepareRedeemPayableRule(
        amount,
        beneficiary,
        gasPrice,
        gasLimit,
        redeemerNonce,
        tokenHolder,
        nonce,
        ephemeralPrivateKey1,
      );

      await token.setCoGateway(coGateway.address);
      let bounty = await coGateway.BOUNTY.call();

      let redeemReceipt = await tokenHolder.redeem(
        amount,
        beneficiary,
        gasPrice,
        gasLimit,
        redeemerNonce,
        hashLock,
        nonce,
        rsv.v,
        EthUtils.bufferToHex(rsv.r),
        EthUtils.bufferToHex(rsv.s),
        {
          value: bounty,
          from: facilitator,
        }
      );

      const events = Event.decodeTransactionResponse(redeemReceipt);

      assert.strictEqual(events.length, 1);

      Event.assertEqual(events[0], {
        name: 'RedeemInitiated',
        args: {
          _beneficiary: beneficiary,
          _amount: new BN(amount),
          _redeemerNonce: new BN(redeemerNonce),
          _ephemeralKey: ephemeralKeyAddress1,
          _executionStatus: true
        },
      });

    });

    it('Verifies that execution status is false when CoGateway execution fails.', async () => {
      const spendingLimit = 50,
        deltaExpirationHeight = 100,
        amount = 10,
        beneficiary = accountProvider.get(),
        facilitator = accountProvider.get(),
        gasPrice = 10,
        gasLimit = 10,
        redeemerNonce = 1,
        hashLock = web3.utils.soliditySha3('hl');

      const {
        tokenHolder,
      } = await setupTokenHolder(
        accountProvider,
        ephemeralKeyAddress1,
        spendingLimit,
        deltaExpirationHeight,
      );

      const keyData = await tokenHolder.ephemeralKeys(ephemeralKeyAddress1);
      let nonce = keyData.nonce.add(new BN(1));
      const {
        coGateway,
        rsv,
      } = await prepareRedeemPayableRule(
        amount,
        beneficiary,
        gasPrice,
        gasLimit,
        redeemerNonce,
        tokenHolder,
        nonce,
        ephemeralPrivateKey1,
      );

      await token.setCoGateway(coGateway.address);

      let wrongBounty = 5;
      let redeemReceipt = await tokenHolder.redeem(
        amount,
        beneficiary,
        gasPrice,
        gasLimit,
        redeemerNonce,
        hashLock,
        nonce,
        rsv.v,
        EthUtils.bufferToHex(rsv.r),
        EthUtils.bufferToHex(rsv.s),
        {
          value: wrongBounty, // Bounty value is 10.
          from: facilitator,
        }
      );

      const events = Event.decodeTransactionResponse(redeemReceipt);

      assert.strictEqual(events.length, 1);

      Event.assertEqual(events[0], {
        name: 'RedeemInitiated',
        args: {
          _beneficiary: beneficiary,
          _amount: new BN(amount),
          _redeemerNonce: new BN(redeemerNonce),
          _ephemeralKey: ephemeralKeyAddress1,
          // web3 returns null when _executionStatus is false
          _executionStatus: null
        },
      });

    })

  });

});
