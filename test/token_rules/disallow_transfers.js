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

const TokenRulesUtils = require('./utils.js');
const { AccountProvider } = require('../test_lib/utils');

contract('TokenRules::disallowTransfers', async (accounts) => {
  const accountProvider = new AccountProvider(accounts);
  it('Checks that transfer is disallowed.', async () => {
    const {
      tokenRules,
    } = await TokenRulesUtils.createTokenEconomy(accountProvider);

    const tokenHolder = accountProvider.get();

    await tokenRules.allowTransfers(
      { from: tokenHolder },
    );

    assert.isOk(
      await tokenRules.allowedTransfers.call(tokenHolder),
    );

    await tokenRules.disallowTransfers(
      { from: tokenHolder },
    );

    assert.isNotOk(
      await tokenRules.allowedTransfers.call(tokenHolder),
    );
  });
});
