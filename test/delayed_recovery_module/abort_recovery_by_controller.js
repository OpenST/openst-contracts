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

const EthUtils = require('ethereumjs-util');
const Utils = require('../test_lib/utils.js');
const { Event } = require('../test_lib/event_decoder.js');
const RecoveryModuleUtils = require('./utils.js');
const { AccountProvider } = require('../test_lib/utils.js');

async function prepare(accountProvider) {
  const {
    recoveryOwnerPrivateKey,
    recoveryControllerAddress,
    recoveryModule,
  } = await RecoveryModuleUtils.createRecoveryModule(accountProvider);

  const prevOwner = accountProvider.get();
  const oldOwner = accountProvider.get();
  const newOwner = accountProvider.get();

  const {
    recoveryHash,
    signature,
  } = RecoveryModuleUtils.signRecovery(
    recoveryModule.address,
    prevOwner,
    oldOwner,
    newOwner,
    recoveryOwnerPrivateKey,
  );

  await recoveryModule.initiateRecovery(
    prevOwner,
    oldOwner,
    newOwner,
    EthUtils.bufferToHex(signature.r),
    EthUtils.bufferToHex(signature.s),
    signature.v,
    { from: recoveryControllerAddress },
  );

  return {
    recoveryOwnerPrivateKey,
    recoveryControllerAddress,
    recoveryModule,
    prevOwner,
    oldOwner,
    newOwner,
    recoveryHash,
    signature,
  };
}

contract('DelayedRecoveryModule::abortRecoveryByController', async () => {
  contract('Negative Tests', async (accounts) => {
    const accountProvider = new AccountProvider(accounts);

    it('Reverts if called by non-controller address.', async () => {
      const {
        recoveryControllerAddress,
        recoveryModule,
        prevOwner,
        oldOwner,
        newOwner,
      } = await prepare(accountProvider);

      const nonControllerAddress = accountProvider.get();
      assert.notEqual(
        nonControllerAddress,
        recoveryControllerAddress,
      );

      await Utils.expectRevert(
        recoveryModule.abortRecoveryByController(
          prevOwner,
          oldOwner,
          newOwner,
          { from: nonControllerAddress },
        ),
        'Should revert as called by non-controller address.',
        'Only recovery controller is allowed to call.',
      );
    });

    it('Reverts if there is no active recovery process.', async () => {
      const {
        recoveryControllerAddress,
        recoveryModule,
      } = await RecoveryModuleUtils.createRecoveryModule(accountProvider);

      const prevOwner = accountProvider.get();
      const oldOwner = accountProvider.get();
      const newOwner = accountProvider.get();

      assert.strictEqual(
        (await recoveryModule.activeRecoveryInfo.call()).recoveryHash,
        Utils.NULL_BYTES32,
      );

      await Utils.expectRevert(
        recoveryModule.abortRecoveryByController(
          prevOwner,
          oldOwner,
          newOwner,
          { from: recoveryControllerAddress },
        ),
        'Should revert as there is no active recovery process.',
        'Hash of recovery to abort does not match with active recovery\'s hash.',
      );
    });

    it('Reverts if an abort request is not for the active one.', async () => {
      const {
        recoveryControllerAddress,
        recoveryModule,
        prevOwner,
        oldOwner,
        newOwner,
      } = await prepare(accountProvider);

      const anotherPrevOwner = accountProvider.get();
      const anotherOldOwner = accountProvider.get();
      const anotherNewOwner = accountProvider.get();

      await Utils.expectRevert(
        recoveryModule.abortRecoveryByController(
          anotherPrevOwner,
          oldOwner,
          newOwner,
          { from: recoveryControllerAddress },
        ),
        'Should revert as the abort request is not for the active recovery.',
        'Hash of recovery to abort does not match with active recovery\'s hash.',
      );

      await Utils.expectRevert(
        recoveryModule.abortRecoveryByController(
          prevOwner,
          anotherOldOwner,
          newOwner,
          { from: recoveryControllerAddress },
        ),
        'Should revert as the abort request is not for the active recovery.',
        'Hash of recovery to abort does not match with active recovery\'s hash.',
      );

      await Utils.expectRevert(
        recoveryModule.abortRecoveryByController(
          prevOwner,
          oldOwner,
          anotherNewOwner,
          { from: recoveryControllerAddress },
        ),
        'Should revert as the abort request is not for the active recovery.',
        'Hash of recovery to abort does not match with active recovery\'s hash.',
      );
    });
  });

  contract('Events', async (accounts) => {
    const accountProvider = new AccountProvider(accounts);

    it('Emits RecoveryAborted.', async () => {
      const {
        recoveryControllerAddress,
        recoveryModule,
        prevOwner,
        oldOwner,
        newOwner,
        recoveryHash,
      } = await prepare(accountProvider);

      const transactionResponse = await recoveryModule.abortRecoveryByController(
        prevOwner,
        oldOwner,
        newOwner,
        { from: recoveryControllerAddress },
      );

      const events = Event.decodeTransactionResponse(
        transactionResponse,
      );

      assert.strictEqual(
        events.length,
        1,
      );

      Event.assertEqual(events[0], {
        name: 'RecoveryAborted',
        args: {
          _recoveryHash: recoveryHash,
        },
      });
    });
  });

  contract('Storage', async (accounts) => {
    const accountProvider = new AccountProvider(accounts);

    it('Checks that recovery is aborted properly.', async () => {
      const {
        recoveryControllerAddress,
        recoveryModule,
        prevOwner,
        oldOwner,
        newOwner,
        recoveryHash,
      } = await prepare(accountProvider);

      let activeRecoveryInfo = await recoveryModule.activeRecoveryInfo.call();

      assert.strictEqual(
        activeRecoveryInfo.prevOwner,
        prevOwner,
      );

      assert.strictEqual(
        activeRecoveryInfo.oldOwner,
        oldOwner,
      );

      assert.strictEqual(
        activeRecoveryInfo.newOwner,
        newOwner,
      );

      assert.isNotOk(
        activeRecoveryInfo.initiationBlockHeight.eqn(0),
      );

      assert.strictEqual(
        activeRecoveryInfo.recoveryHash,
        recoveryHash,
      );

      await recoveryModule.abortRecoveryByController(
        prevOwner,
        oldOwner,
        newOwner,
        { from: recoveryControllerAddress },
      );

      activeRecoveryInfo = await recoveryModule.activeRecoveryInfo.call();

      assert.strictEqual(
        activeRecoveryInfo.prevOwner,
        Utils.NULL_ADDRESS,
      );

      assert.strictEqual(
        activeRecoveryInfo.oldOwner,
        Utils.NULL_ADDRESS,
      );

      assert.strictEqual(
        activeRecoveryInfo.newOwner,
        Utils.NULL_ADDRESS,
      );

      assert.isOk(
        activeRecoveryInfo.initiationBlockHeight.eqn(0),
      );

      assert.strictEqual(
        activeRecoveryInfo.recoveryHash,
        Utils.NULL_BYTES32,
      );
    });
  });
});
