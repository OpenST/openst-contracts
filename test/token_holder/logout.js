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
const { TokenHolderUtils } = require('./utils.js');
const { Event } = require('../test_lib/event_decoder');
const { AccountProvider } = require('../test_lib/utils.js');

async function prepare(
  accountProvider,
  spendingLimit, deltaExpirationHeight,
) {
  const { utilityToken } = await TokenHolderUtils.createUtilityMockToken();

  const { tokenRules } = await TokenHolderUtils.createMockTokenRules(
    utilityToken.address,
  );

  const authorizedSessionPublicKey = accountProvider.get();

  const {
    tokenHolderOwnerAddress,
    tokenHolder,
  } = await TokenHolderUtils.createTokenHolder(
    accountProvider,
    utilityToken, tokenRules,
    spendingLimit, deltaExpirationHeight,
    authorizedSessionPublicKey,
  );

  await TokenHolderUtils.authorizeSessionKey(
    tokenHolder, tokenHolderOwnerAddress,
    authorizedSessionPublicKey, spendingLimit, deltaExpirationHeight,
  );

  return {
    utilityToken,
    tokenRules,
    tokenHolderOwnerAddress,
    tokenHolder,
    authorizedSessionPublicKey,
  };
}

contract('TokenHolder::logout', async () => {
  contract('Negative Tests', async (accounts) => {
    const accountProvider = new AccountProvider(accounts);

    it('Reverts if is not called by owner.', async () => {
      const {
        tokenHolder,
      } = await prepare(
        accountProvider,
        10 /* spendingLimit */,
        50 /* deltaExpirationHeight */,
      );

      await utils.expectRevert(
        tokenHolder.logout(
          { from: accountProvider.get() },
        ),
        'Should revert as caller is not an owner.',
        'Only owner is allowed to call.',
      );
    });
  });

  contract('Events', async (accounts) => {
    const accountProvider = new AccountProvider(accounts);

    it('Emits SessionRevoked event.', async () => {
      const {
        tokenHolder,
        tokenHolderOwnerAddress,
      } = await prepare(
        accountProvider,
        10 /* spendingLimit */,
        50 /* deltaExpirationHeight */,
      );

      let transactionResponse = await tokenHolder.logout(
        { from: tokenHolderOwnerAddress },
      );

      let events = Event.decodeTransactionResponse(
        transactionResponse,
      );

      assert.strictEqual(
        events.length,
        1,
      );

      Event.assertEqual(events[0], {
        name: 'SessionsLoggedOut',
        args: {
          _sessionWindow: new BN(2),
        },
      });

      transactionResponse = await tokenHolder.logout(
        { from: tokenHolderOwnerAddress },
      );

      events = Event.decodeTransactionResponse(
        transactionResponse,
      );

      assert.strictEqual(
        events.length,
        1,
      );

      Event.assertEqual(events[0], {
        name: 'SessionsLoggedOut',
        args: {
          _sessionWindow: new BN(3),
        },
      });
    });
  });

  contract('Storage', async (accounts) => {
    const accountProvider = new AccountProvider(accounts);

    it('Checks that logout request is handled correctly.', async () => {
      const {
        tokenHolder,
        tokenHolderOwnerAddress,
      } = await prepare(
        accountProvider,
        10 /* spendingLimit */,
        50 /* deltaExpirationHeight */,
      );

      assert.isOk(
        (await tokenHolder.sessionWindow.call()).eqn(2),
      );

      await tokenHolder.logout(
        { from: tokenHolderOwnerAddress },
      );

      assert.isOk(
        (await tokenHolder.sessionWindow.call()).eqn(3),
      );
    });
  });
});
