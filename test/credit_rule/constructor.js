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

const Utils = require('../test_lib/utils');
const { AccountProvider } = require('../test_lib/utils');

const CreditRule = artifacts.require('CreditRule');

contract('CreditRule::constructor', async () => {
  contract('Negative Tests', async (accounts) => {
    const accountProvider = new AccountProvider(accounts);

    it('Reverts if the credit budget holder\'s address is null.', async () => {
      await Utils.expectRevert(
        CreditRule.new(
          Utils.NULL_ADDRESS, // credit budget holder's address
          accountProvider.get(), // token rules's address
        ),
        'Should revert as the credit budget holder\'s address is null.',
        'Budget holder\'s address is null.',
      );
    });

    it('Reverts if the token rules\'s address is null.', async () => {
      await Utils.expectRevert(
        CreditRule.new(
          accountProvider.get(), // credit budget holder's address
          Utils.NULL_ADDRESS, // token rules's address
        ),
        'Should revert as the token rules\'s address is null.',
        'Token rules\'s address is null.',
      );
    });
  });

  contract('Storage', async (accounts) => {
    const accountProvider = new AccountProvider(accounts);
    it('Checks that passed arguments are set correctly.', async () => {
      const creditBudgetHolder = accountProvider.get();
      const tokenRules = accountProvider.get();

      const creditRule = await CreditRule.new(
        creditBudgetHolder,
        tokenRules,
      );

      assert.strictEqual(
        (await creditRule.budgetHolder.call()),
        creditBudgetHolder,
      );

      assert.strictEqual(
        (await creditRule.tokenRules.call()),
        tokenRules,
      );
    });
  });
});
