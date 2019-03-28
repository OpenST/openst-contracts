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

const BN = require('bn.js');
const utils = require('../test_lib/utils.js');
const { AccountProvider } = require('../test_lib/utils');
const TokenRulesUtils = require('./utils.js');

async function happyPath(accountProvider) {
  const {
    tokenRules,
    organizationAddress,
    token,
    worker,
  } = await TokenRulesUtils.createTokenEconomy(accountProvider);

  const tokenHolder = accountProvider.get();
  const spendingLimit = 100;
  await token.increaseBalance(tokenHolder, 100);
  await token.approve(
    tokenRules.address,
    spendingLimit,
    { from: tokenHolder },
  );

  await tokenRules.allowTransfers(
    { from: tokenHolder },
  );

  const transferTo0 = accountProvider.get();
  const transferAmount0 = 1;

  const transfersTo = [transferTo0];
  const transfersAmount = [transferAmount0];

  return {
    tokenRules,
    organizationAddress,
    token,
    tokenHolder,
    transfersTo,
    transfersAmount,
    worker,
  };
}

contract('TokenRules::directTransfers', async () => {
  contract('Negative Tests', async (accounts) => {
    const accountProvider = new AccountProvider(accounts);

    it('Reverts if caller\'s account has not allowed transfers.', async () => {
      const {
        tokenRules,
        tokenHolder,
        transfersTo,
        transfersAmount,
      } = await happyPath(accountProvider);

      await tokenRules.disallowTransfers(
        { from: tokenHolder },
      );

      await utils.expectRevert(
        tokenRules.directTransfers(
          transfersTo,
          transfersAmount,
          { from: tokenHolder },
        ),
        'Should revert as caller\'s account has not allowed transfers.',
        'Transfers from the address are not allowed.',
      );
    });

    it('Reverts if transfersTo and transferAmount array lengths are not equal.', async () => {
      const {
        tokenRules,
        tokenHolder,
      } = await happyPath(accountProvider);

      const transferTo0 = accountProvider.get();
      const transfersTo = [transferTo0];
      const transfersAmount = [];

      await utils.expectRevert(
        tokenRules.directTransfers(
          transfersTo,
          transfersAmount,
          { from: tokenHolder },
        ),
        'Should revert as transfers "to" and "amount" arrays length '
                + 'are not equal.',
        '\'to\' and \'amount\' transfer arrays\' lengths are not equal.',
      );
    });
  });

  contract('Execution Validity', async (accounts) => {
    const accountProvider = new AccountProvider(accounts);

    it('Checks that token transferFrom function is called.', async () => {
      const {
        tokenRules,
        token,
        tokenHolder,
        transfersTo,
        transfersAmount,
      } = await happyPath(accountProvider);

      // For test validity perspective array should not be empty.
      assert(transfersTo.length !== 0);

      const tokenHolderInitialBalance = await token.balanceOf(tokenHolder);
      const transfersToInitialBalances = [];
      let transfersAmountSum = new BN(0);
      for (let i = 0; i < transfersTo.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        const initialBalance = await token.balanceOf.call(transfersTo[i]);
        transfersToInitialBalances.push(initialBalance);

        transfersAmountSum = transfersAmountSum.add(new BN(transfersAmount[i]));
      }

      // For test validity perspective, we should not fail in this case.
      assert(tokenHolderInitialBalance.gte(transfersAmountSum));

      await tokenRules.directTransfers(
        transfersTo,
        transfersAmount,
        { from: tokenHolder },
      );

      assert.strictEqual(
        (await token.balanceOf(tokenHolder)).cmp(
          tokenHolderInitialBalance.sub(transfersAmountSum),
        ),
        0,
      );

      for (let i = 0; i < transfersTo.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        const balance = await token.balanceOf.call(transfersTo[i]);

        assert.strictEqual(
          balance.cmp(
            transfersToInitialBalances[i].add(
              new BN(transfersAmount[i]),
            ),
          ),
          0,
        );
      }
    });

    it('Checks that at the end TokenRules disallow transfers.', async () => {
      const {
        tokenRules,
        tokenHolder,
        transfersTo,
        transfersAmount,
      } = await happyPath(accountProvider);

      await tokenRules.allowTransfers(
        { from: tokenHolder },
      );

      await tokenRules.directTransfers(
        transfersTo,
        transfersAmount,
        { from: tokenHolder },
      );

      assert.isNotOk(
        await tokenRules.allowedTransfers.call(tokenHolder),
      );
    });
  });
});
