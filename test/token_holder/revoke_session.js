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
const { TokenHolderUtils } = require('./utils.js');
const { Event } = require('../test_lib/event_decoder');
const { AccountProvider } = require('../test_lib/utils.js');

const sessionPublicKey = '0x62502C4DF73935D0D10054b0Fb8cC036534C6fb0';

async function prepare(
  accountProvider,
  spendingLimit, deltaExpirationHeight,
  sessionPublicKeyToAuthorize,
) {
  const { utilityToken } = await TokenHolderUtils.createUtilityMockToken();

  const { tokenRules } = await TokenHolderUtils.createMockTokenRules();

  const {
    tokenHolderOwnerAddress,
    tokenHolder,
  } = await TokenHolderUtils.createTokenHolder(
    accountProvider,
    utilityToken, tokenRules,
    spendingLimit, deltaExpirationHeight,
    sessionPublicKeyToAuthorize,
  );

  await TokenHolderUtils.authorizeSessionKey(
    tokenHolder, tokenHolderOwnerAddress,
    sessionPublicKeyToAuthorize, spendingLimit, deltaExpirationHeight,
  );

  return {
    utilityToken,
    tokenRules,
    tokenHolderOwnerAddress,
    tokenHolder,
  };
}

contract('TokenHolder::revokeSession', async () => {
  contract('Negative Tests', async (accounts) => {
    const accountProvider = new AccountProvider(accounts);

    it('Reverts if non-owner address calls.', async () => {
      const {
        tokenHolder,
      } = await prepare(
        accountProvider,
        10 /* spendingLimit */,
        50 /* deltaExpirationHeight */,
        sessionPublicKey,
      );

      await utils.expectRevert(
        tokenHolder.revokeSession(
          sessionPublicKey,
          {
            from: accountProvider.get(),
          },
        ),
        'Should revert as non-owner address calls.',
        'Only owner is allowed to call.',
      );
    });

    it('Reverts if key to revoke does not exist.', async () => {
      const {
        tokenHolder,
        tokenHolderOwnerAddress,
      } = await prepare(
        accountProvider,
        10 /* spendingLimit */,
        50 /* deltaExpirationHeight */,
        sessionPublicKey,
      );

      const nonAuthorizedSessionKey = '0xADdB68e734D215D1fBFc44bBcaE42fAc2047DDec';

      await utils.expectRevert(
        tokenHolder.revokeSession(
          nonAuthorizedSessionKey,
          { from: tokenHolderOwnerAddress },
        ),
        'Should revert as key to revoke does not exist.',
        'Key is not authorized.',
      );
    });

    it('Reverts if key to revoke is already revoked.', async () => {
      const {
        tokenHolder,
        tokenHolderOwnerAddress,
      } = await prepare(
        accountProvider,
        10 /* spendingLimit */,
        50 /* deltaExpirationHeight */,
        sessionPublicKey,
      );

      await tokenHolder.revokeSession(
        sessionPublicKey,
        { from: tokenHolderOwnerAddress },
      );

      await utils.expectRevert(
        tokenHolder.revokeSession(
          sessionPublicKey,
          { from: tokenHolderOwnerAddress },
        ),
        'Should revert as key to revoke was already revoked.',
        'Key is not authorized.',
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
        sessionPublicKey,
      );

      const transactionResponse = await tokenHolder.revokeSession(
        sessionPublicKey,
        { from: tokenHolderOwnerAddress },
      );

      const events = Event.decodeTransactionResponse(
        transactionResponse,
      );

      assert.strictEqual(
        events.length,
        1,
      );

      // The only emitted event should be 'SessionRevoked'.
      Event.assertEqual(events[0], {
        name: 'SessionRevoked',
        args: {
          _sessionKey: sessionPublicKey,
        },
      });
    });
  });

  contract('Storage', async (accounts) => {
    const accountProvider = new AccountProvider(accounts);

    it('Checks that key is revoked after successfull revocation.', async () => {
      const {
        tokenHolder,
        tokenHolderOwnerAddress,
      } = await prepare(
        accountProvider,
        10 /* spendingLimit */,
        50 /* deltaExpirationHeight */,
        sessionPublicKey,
      );

      let keyData = await tokenHolder.sessionKeys.call(sessionPublicKey);

      assert.isOk(
        // TokenHolder.AuthorizationStatus.AUTHORIZED == 1
        keyData.status.eqn(1),
      );

      await tokenHolder.revokeSession(
        sessionPublicKey,
        { from: tokenHolderOwnerAddress },
      );

      keyData = await tokenHolder.sessionKeys.call(sessionPublicKey);

      assert.isOk(
        // TokenHolder.AuthorizationStatus.REVOKED == 2
        keyData.status.eqn(2),
      );
    });
  });
});
