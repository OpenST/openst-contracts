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

const TokenRules = artifacts.require('TokenRules'),
  TokenHolder = artifacts.require('TokenHolder'),
  TransferRule = artifacts.require('TransferRule'),
  EIP20TokenMock = artifacts.require('EIP20TokenMock'),
  Organization = artifacts.require('Organization'),
  EthUtils = require('ethereumjs-util');

/**
 * It deploys the contracts, setup workers and registers a rule.
 */
module.exports.setup = async (accountProvider) => {

  const eip20TokenMock = await this.createEIP20Token();

  const {
    owner,
    organization,
    worker
  } = await this.setupOrganization(accountProvider);

  const tokenRules = await this.tokenRules(organization, eip20TokenMock);

  const transferRule = await this.transferRule(tokenRules.address);

  const ruleName = 'transferRule';
  const ruleAbi = `Rule abi of ${ruleName}`;

  await tokenRules.registerRule(
    ruleName,
    transferRule.address,
    ruleAbi,
    { from: worker },
  );

  let wallets = [], wallet1;
  wallet1 = accountProvider.get();
  wallets.push(wallet1);

  const tokenHolder = await this.setupTokenHolder(
    eip20TokenMock.address,
    tokenRules.address,
    wallets,
    1,
  );

  return {
    owner,
    worker,
    eip20TokenMock,
    organization,
    tokenRules,
    transferRule,
    tokenHolder,
    wallet1,
  };
};

/**
 * It returns an instance of tokenholder.
 */
module.exports.setupTokenHolder = async (token, tokenRules, wallets, required) => {

  return (await TokenHolder.new(token, tokenRules, wallets, required));

};


/**
 * It returns an instance of TokenRules by providing organization and
 * EIP20Token address.
 */
module.exports.tokenRules = async (organization, token) => {

  return (await TokenRules.new(organization.address, token.address));

};

/**
 * It returns an instance of TransferRule contract.
 *
 */
module.exports.transferRule = async (tokenRules) => {

  return (await TransferRule.new(tokenRules));

};

/**
 * It registers worker with expirationHeight and returns an instance of
 * Organization.
 */
module.exports.setupOrganization = async (accountProvider) => {

  const owner = accountProvider.get(),
    worker = accountProvider.get(),
    expirationHeight = 500;

  const organization = await Organization.new({ from: owner });
  await organization.setWorker(worker, expirationHeight);

  return { owner, organization, worker };

};

/**
 * Creates an EIP20 instance to be used during TokenRules::executeTransfers
 * function's testing with the following defaults:
 *      - conversionRate: 1
 *      - conversionRateDecimals: 1
 *      - symbol: 'OST'
 *      - name: 'Open Simple Token'
 *      - decimals: 1
 */
module.exports.createEIP20Token = async () => {
  const token = await EIP20TokenMock.new(
    1, 1, 'OST', 'Open Simple Token', 1,
  );

  return token;
};

/**
 * It generates executable data for 'TransferFrom' method.
 */
module.exports.generateTransferFromExecutable = async (from, to, amount) => {

  return web3.eth.abi.encodeFunctionCall(
    {

      name: 'transferFrom',
      type: 'function',
      inputs: [
        {
          type: 'address',
          name: '_from'
        },
        {
          type: 'address',
          name: '_to'
        },
        {
          type: 'uint256',
          name: '_amount'
        }
      ]
    },
    [from, to, amount]
  );

}

/**
 * It returns hash of the data as per EIP-1077.
 */
module.exports.getExecuteRuleExTxHash = async (
  tokenHolderAddress, ruleAddress, ruleData, nonce,
)  => {
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
      t: 'bytes4', v: await this.generateExecuteRuleCallPrefix(),
    },
    {
      t: 'uint8', v: 0,
    },
    {
      t: 'bytes32', v: '0x0',
    },
  );
}

/**
 * It provides call prefix of the executeRule method of tokenholder.
 */
module.exports.generateExecuteRuleCallPrefix = async () => {
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

/**
 * It provides signature parameters and the hash of the data.
 */
module.exports.getExecuteRuleExTxData = async (
  _tokenHolderAddress, _ruleAddress, _ruleData, _nonce, _ephemeralKey,
) => {
  const msgHash = await this.getExecuteRuleExTxHash(
    _tokenHolderAddress, _ruleAddress, _ruleData, _nonce,
  );

  const rsv = EthUtils.ecsign(
    EthUtils.toBuffer(msgHash),
    EthUtils.toBuffer(_ephemeralKey),
  );

  return { msgHash, rsv };
}
