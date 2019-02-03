// Copyright 2019 OpenST Ltd.
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

'use strict';

const TokenHolder = artifacts.require('TokenHolder');
const TokenRulesSpy = artifacts.require('TokenRulesSpy');
const UtilityTokenFake = artifacts.require('UtilityTokenFake');

const web3 = require('../test_lib/web3.js');

class TokenHolderUtils {
  static async createUtilityMockToken() {
    const utilityToken = await UtilityTokenFake.new(
      'OST', 'Open Simple Token', 1,
    );

    return { utilityToken };
  }

  static async createMockTokenRules() {
    const tokenRules = await TokenRulesSpy.new();

    return { tokenRules };
  }

  static async createTokenHolder(
    accountProvider,
    utilityTokenMock, tokenRulesMock,
  ) {
    const tokenHolderOwnerAddress = accountProvider.get();

    const tokenHolder = await TokenHolder.new();
    await tokenHolder.setup(
      utilityTokenMock.address,
      tokenRulesMock.address,
      tokenHolderOwnerAddress,
      [],
      [],
      [],
    );

    return {
      tokenHolderOwnerAddress,
      tokenHolder,
    };
  }

  static async authorizeSessionKey(
    tokenHolder, tokenHolderOwnerAddress,
    sessionPublicKeyToAuthorize, spendingLimit, deltaExpirationHeight,
  ) {
    const blockNumber = await web3.eth.getBlockNumber();

    await tokenHolder.authorizeSession(
      sessionPublicKeyToAuthorize,
      spendingLimit,
      blockNumber + deltaExpirationHeight,
      { from: tokenHolderOwnerAddress },
    );
  }
}

module.exports = {
  TokenHolderUtils,
};
