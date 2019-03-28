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

const web3 = require('../test_lib/web3.js');
const utils = require('../test_lib/utils.js');
const { TokenHolderUtils } = require('./utils.js');
const { Event } = require('../test_lib/event_decoder');
const { AccountProvider } = require('../test_lib/utils.js');

const sessionPublicKey1 = '0x62502C4DF73935D0D10054b0Fb8cC036534C6fb0';
const sessionPublicKey2 = '0xBB04e8665d3C53B7dB4E7e468E5B5813714ade82';

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

contract('TokenHolder::authorizeSession', async () => {
  contract('Negative Tests', async (accounts) => {
    const accountProvider = new AccountProvider(accounts);

    it('Reverts if non-owner address calls.', async () => {
      const {
        tokenHolder,
      } = await prepare(
        accountProvider,
        11 /* spendingLimit */,
        51 /* deltaExpirationHeight */,
        sessionPublicKey1,
      );

      const spendingLimit2 = 12;
      const deltaExpirationHeight2 = 52;
      await utils.expectRevert(
        tokenHolder.authorizeSession(
          sessionPublicKey2,
          spendingLimit2,
          (await web3.eth.getBlockNumber()) + deltaExpirationHeight2,
          {
            from: accountProvider.get(),
          },
        ),
        'Should revert as non-owner address calls.',
        'Only owner is allowed to call.',
      );
    });

    it('Reverts as session key to authorize is null.', async () => {
      const {
        tokenHolder,
        tokenHolderOwnerAddress,
      } = await prepare(
        accountProvider,
        11 /* spendingLimit */,
        51 /* deltaExpirationHeight */,
        sessionPublicKey1,
      );

      const spendingLimit2 = 12;
      const deltaExpirationHeight2 = 52;
      await utils.expectRevert(
        tokenHolder.authorizeSession(
          utils.NULL_ADDRESS,
          spendingLimit2,
          (await web3.eth.getBlockNumber()) + deltaExpirationHeight2,
          { from: tokenHolderOwnerAddress },
        ),
        'Should revert as session key to authorize is null.',
        'Key address is null.',
      );
    });

    it('Reverts if session key to authorize is authorized and active.', async () => {
      const spendingLimit1 = 11;
      const deltaExpirationHeight1 = 51;
      const {
        tokenHolder,
        tokenHolderOwnerAddress,
      } = await prepare(
        accountProvider,
        spendingLimit1,
        deltaExpirationHeight1,
        sessionPublicKey1,
      );

      await utils.expectRevert(
        tokenHolder.authorizeSession(
          sessionPublicKey1,
          spendingLimit1,
          (await web3.eth.getBlockNumber()) + deltaExpirationHeight1,
          { from: tokenHolderOwnerAddress },
        ),
        'Should revert as key to revoke was already revoked.',
        'Key exists.',
      );
    });

    it('Reverts if session key to authorize was authorized and revoked.', async () => {
      const spendingLimit1 = 11;
      const deltaExpirationHeight1 = 51;
      const {
        tokenHolder,
        tokenHolderOwnerAddress,
      } = await prepare(
        accountProvider,
        spendingLimit1,
        deltaExpirationHeight1,
        sessionPublicKey1,
      );

      await tokenHolder.revokeSession(
        sessionPublicKey1,
        { from: tokenHolderOwnerAddress },
      );

      await utils.expectRevert(
        tokenHolder.authorizeSession(
          sessionPublicKey1,
          spendingLimit1,
          (await web3.eth.getBlockNumber()) + deltaExpirationHeight1,
          { from: tokenHolderOwnerAddress },
        ),
        'Should revert as key to revoke was already revoked.',
        'Key exists.',
      );
    });

    it('Reverts if session key to authorize was authorized and expired.', async () => {
      const deltaExpirationHeight1 = 51;

      const {
        tokenHolder,
        tokenHolderOwnerAddress,
      } = await prepare(
        accountProvider,
        11 /* spendingLimit */,
        deltaExpirationHeight1,
        sessionPublicKey1,
      );

      for (let i = 0; i < deltaExpirationHeight1; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await utils.advanceBlock();
      }

      const spendingLimit2 = 12;
      const deltaExpirationHeight2 = 52;
      await utils.expectRevert(
        tokenHolder.authorizeSession(
          sessionPublicKey1,
          spendingLimit2,
          (await web3.eth.getBlockNumber()) + deltaExpirationHeight2,
          { from: tokenHolderOwnerAddress },
        ),
        'Should revert as key to revoke was already revoked.',
        'Key exists.',
      );
    });

    it('Reverts as expiration height is lte to the current block number.', async () => {
      const {
        tokenHolder,
        tokenHolderOwnerAddress,
      } = await prepare(
        accountProvider,
        10 /* spendingLimit */,
        50 /* deltaExpirationHeight */,
        sessionPublicKey1,
      );

      const spendingLimit2 = 12;
      await utils.expectRevert(
        tokenHolder.authorizeSession(
          sessionPublicKey2,
          spendingLimit2,
          (await web3.eth.getBlockNumber()),
          { from: tokenHolderOwnerAddress },
        ),
        'Should .',
        'Expiration height is lte to the current block height.',
      );
    });
  });

  contract('Events', async (accounts) => {
    const accountProvider = new AccountProvider(accounts);

    it('Emits SessionAuthorized event.', async () => {
      const {
        tokenHolder,
        tokenHolderOwnerAddress,
      } = await prepare(
        accountProvider,
        11 /* spendingLimit */,
        51 /* deltaExpirationHeight */,
        sessionPublicKey1,
      );

      const spendingLimit2 = 12;
      const deltaExpirationHeight2 = 52;
      const transactionResponse = await tokenHolder.authorizeSession(
        sessionPublicKey2,
        spendingLimit2,
        (await web3.eth.getBlockNumber()) + deltaExpirationHeight2,
        { from: tokenHolderOwnerAddress },
      );

      const events = Event.decodeTransactionResponse(
        transactionResponse,
      );

      assert.strictEqual(
        events.length,
        1,
      );

      // The only emitted event should be 'SessionAuthorized'.
      Event.assertEqual(events[0], {
        name: 'SessionAuthorized',
        args: {
          _sessionKey: sessionPublicKey2,
        },
      });
    });
  });

  contract('Storage', async (accounts) => {
    const accountProvider = new AccountProvider(accounts);

    it('Checks that key is stored correctly after authorization.', async () => {
      const {
        tokenHolder,
        tokenHolderOwnerAddress,
      } = await prepare(
        accountProvider,
        10 /* spendingLimit */,
        50 /* deltaExpirationHeight */,
        sessionPublicKey1,
      );

      let keyData = await tokenHolder.sessionKeys.call(sessionPublicKey2);

      assert.isOk(
        // TokenHolder.AuthorizationStatus.NOT_AUTHORIZED == 0
        keyData.session.eqn(0),
      );

      assert.isOk(
        keyData.spendingLimit.eqn(0),
      );

      assert.isOk(
        keyData.expirationHeight.eqn(0),
      );

      assert.isOk(
        keyData.nonce.eqn(0),
      );

      const spendingLimit2 = 12;
      const deltaExpirationHeight2 = 52;
      const expirationHeight2 = (await web3.eth.getBlockNumber())
                + deltaExpirationHeight2;
      await tokenHolder.authorizeSession(
        sessionPublicKey2,
        spendingLimit2,
        expirationHeight2,
        { from: tokenHolderOwnerAddress },
      );

      keyData = await tokenHolder.sessionKeys.call(sessionPublicKey2);

      assert.isOk(
        keyData.session.eqn(2),
      );

      assert.isOk(
        keyData.spendingLimit.eqn(spendingLimit2),
      );

      assert.isOk(
        keyData.expirationHeight.eqn(expirationHeight2),
      );

      assert.isOk(
        keyData.nonce.eqn(0),
      );
    });
  });
});
