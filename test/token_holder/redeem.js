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

const ephemeralPrivateKey1 = '0xa8225c01ceeaf01d7bc7c1b1b929037bd4050967c5730c0b854263121b8399f3';
const ephemeralKeyAddress1 = '0x62502C4DF73935D0D10054b0Fb8cC036534C6fb0';
const ephemeralPrivateKey2 = '0x634011a05b2f48e2d19aba49a9dbc12766bf7dbd6111ed2abb2621c92e8cfad9';

let token;

function generateEIP20PassData(spender, value){

  return web3.eth.abi.encodeFunctionCall(
    {

      name: 'approve',
      type: 'function',
      inputs: [
        {
          type: 'address',
          name: 'spender'
        },
        {
          type: 'uint256',
          name: 'value'
        }
      ]
    },
    [spender, value]
  );

}

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


function generateRedeemCallPrefix() {
  return web3.eth.abi.encodeFunctionSignature({
    name: 'redeem',
    type: 'function',
    inputs: [
      {
        type: 'uint256', name: '',
      },
      {
        type: 'address', name: '',
      },
      {
        type: 'uint256', name: '',
      },
      {
        type: 'uint256', name: '',
      },
      {
        type: 'uint256', name: '',
      },
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

function getRedeemExTxHash(
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
      t: 'bytes4', v: generateRedeemCallPrefix(),
    },
    {
      t: 'uint8', v: 0,
    },
    {
      t: 'bytes32', v: '0x0',
    },
  );
}

function getRedeemExTxData(
  _tokenHolderAddress, _ruleAddress, _ruleData, _nonce, _ephemeralKey,
) {
  const msgHash = getRedeemExTxHash(
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
    CoGatewayAddress,
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

  const { msgHash, rsv } = getRedeemExTxData(
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

contract('TokenHolder::redeem', async (accounts) => {
  contract('Positive Tests', async () => {
    const accountProvider = new AccountProvider(accounts);

    it('Checks that redeem payable rule is actually executed.', async () => {
      const spendingLimit = 10,
      deltaExpirationHeight = 50,
      amount = 10,
      beneficiary = accountProvider.get(),
      gasPrice = 10,
      gasLimit = 10,
      redeemerNonce = 1,
      hashLock = web3.utils.soliditySha3('test');

      const {
              tokenHolder,
           } = await createTokenHolder(
        accountProvider,
        ephemeralKeyAddress1,
        spendingLimit,
        deltaExpirationHeight,
      );

      const nonce = 1;
      const {
        mockRule,
        mockRuleValue,
        rsv,
      } = await preparePassPayableRule(
        accountProvider,
        tokenHolder,
        nonce,
        ephemeralPrivateKey1,
      );

      await token.setCoGateway(mockRule.address);

      assert.strictEqual(
        (await tokenHolder.coGateway.call()),
        mockRule.address,
      );

      const payableValue = 100;
      await tokenHolder.redeem(
        mockRule.address,
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

});
