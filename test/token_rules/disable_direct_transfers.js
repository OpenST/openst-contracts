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

const utils = require('../test_lib/utils.js');
const { AccountProvider } = require('../test_lib/utils');
const TokenRulesUtils = require('./utils.js');

async function prepare(accountProvider) {
  const {
    organizationWorker,
    tokenRules,
    token,
  } = await TokenRulesUtils.createTokenEconomy(accountProvider);

  return {
    organizationWorker,
    tokenRules,
    token,
  };
}

contract('TokenRules::disableDirectTransfers', async () => {
  contract('Negative Tests', async (accounts) => {
    const accountProvider = new AccountProvider(accounts);

    it('Reverts if a caller is not an organization worker.', async () => {
      const {
        tokenRules,
      } = await prepare(accountProvider);

      await utils.expectRevert(
        tokenRules.disableDirectTransfers(
          { from: accountProvider.get() },
        ),
        'Should revert as a caller is not an organization worker.',
        'Only whitelisted workers are allowed to call this method.',
      );
    });
  });

  contract('Execution Validity', async (accounts) => {
    const accountProvider = new AccountProvider(accounts);

    it('Checks that direct transfers are successfully disabled.', async () => {
      const {
        organizationWorker,
        tokenRules,
      } = await prepare(accountProvider);

      await tokenRules.enableDirectTransfers(
        { from: organizationWorker },
      );

      assert.isOk(
        await tokenRules.areDirectTransfersEnabled.call(),
      );

      await tokenRules.disableDirectTransfers(
        { from: organizationWorker },
      );

      assert.isNotOk(
        await tokenRules.areDirectTransfersEnabled.call(),
      );
    });
  });
});
