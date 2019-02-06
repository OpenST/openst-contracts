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
  } = await RecoveryModuleUtils.createRecoveryModule(
    accountProvider,
  );

  const prevOwner = accountProvider.get();
  const oldOwner = accountProvider.get();
  const newOwner = accountProvider.get();

  const {
    signature,
  } = RecoveryModuleUtils.signInitiateRecovery(
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
  };
}

contract('DelayedRecoveryModule::abortRecoveryByOwner', async () => {
  contract('Negative Tests', async (accounts) => {
    const accountProvider = new AccountProvider(accounts);

    it('Reverts if there is no active recovery process.', async () => {
      const {
        recoveryOwnerPrivateKey,
        recoveryModule,
      } = await RecoveryModuleUtils.createRecoveryModule(
        accountProvider,
      );

      const prevOwner = accountProvider.get();
      const oldOwner = accountProvider.get();
      const newOwner = accountProvider.get();

      const {
        signature,
      } = RecoveryModuleUtils.signAbortRecovery(
        recoveryModule.address, prevOwner, oldOwner, newOwner, recoveryOwnerPrivateKey,
      );

      assert.isOk(
        (await recoveryModule.activeRecoveryInfo.call()).executionBlockHeight.eqn(0),
      );

      await Utils.expectRevert(
        recoveryModule.abortRecoveryByOwner(
          prevOwner,
          oldOwner,
          newOwner,
          EthUtils.bufferToHex(signature.r),
          EthUtils.bufferToHex(signature.s),
          signature.v,
          { from: accountProvider.get() },
        ),
        'Should revert as there is no active recovery process.',
        'There is no active recovery.',
      );
    });

    it('Reverts if an abort request is not for the active one.', async () => {
      const {
        recoveryOwnerPrivateKey,
        recoveryModule,
        prevOwner,
        oldOwner,
        newOwner,
      } = await prepare(accountProvider);

      const anotherPrevOwner = accountProvider.get();
      const anotherOldOwner = accountProvider.get();
      const anotherNewOwner = accountProvider.get();

      assert.strictEqual(
        (await recoveryModule.activeRecoveryInfo.call()).prevOwner,
        prevOwner,
      );

      assert.strictEqual(
        (await recoveryModule.activeRecoveryInfo.call()).oldOwner,
        oldOwner,
      );

      assert.strictEqual(
        (await recoveryModule.activeRecoveryInfo.call()).newOwner,
        newOwner,
      );

      const {
        signature: signature1,
      } = RecoveryModuleUtils.signAbortRecovery(
        recoveryModule.address, anotherPrevOwner, oldOwner, newOwner, recoveryOwnerPrivateKey,
      );

      await Utils.expectRevert(
        recoveryModule.abortRecoveryByOwner(
          anotherPrevOwner,
          oldOwner,
          newOwner,
          EthUtils.bufferToHex(signature1.r),
          EthUtils.bufferToHex(signature1.s),
          signature1.v,
          { from: accountProvider.get() },
        ),
        'Should revert as the abort request is not for the active recovery.',
        'The execution request\'s data does not match with the active one.',
      );

      const {
        signature: signature2,
      } = RecoveryModuleUtils.signAbortRecovery(
        recoveryModule.address, prevOwner, anotherOldOwner, newOwner, recoveryOwnerPrivateKey,
      );

      await Utils.expectRevert(
        recoveryModule.abortRecoveryByOwner(
          prevOwner,
          anotherOldOwner,
          newOwner,
          EthUtils.bufferToHex(signature2.r),
          EthUtils.bufferToHex(signature2.s),
          signature2.v,
          { from: accountProvider.get() },
        ),
        'Should revert as the abort request is not for the active recovery.',
        'The execution request\'s data does not match with the active one.',
      );

      const {
        signature: signature3,
      } = RecoveryModuleUtils.signAbortRecovery(
        recoveryModule.address, prevOwner, oldOwner, anotherNewOwner, recoveryOwnerPrivateKey,
      );

      await Utils.expectRevert(
        recoveryModule.abortRecoveryByOwner(
          prevOwner,
          oldOwner,
          anotherNewOwner,
          EthUtils.bufferToHex(signature3.r),
          EthUtils.bufferToHex(signature3.s),
          signature3.v,
          { from: accountProvider.get() },
        ),
        'Should revert as the abort request is not for the active recovery.',
        'The execution request\'s data does not match with the active one.',
      );
    });

    it('Reverts if an abort request is signed by an invalid key.', async () => {
      const {
        recoveryOwnerPrivateKey,
        recoveryModule,
        prevOwner,
        oldOwner,
        newOwner,
      } = await prepare(accountProvider);

      const privateKey = '0x038764453ef1dbdf9cfb3923f95d22a8974a1aa2f7351737b46d9ea25aaba50a';

      assert.notEqual(
        recoveryOwnerPrivateKey,
        privateKey,
      );

      const {
        signature,
      } = RecoveryModuleUtils.signAbortRecovery(
        recoveryModule.address, prevOwner, oldOwner, newOwner, privateKey,
      );

      await Utils.expectRevert(
        recoveryModule.abortRecoveryByOwner(
          prevOwner,
          oldOwner,
          newOwner,
          EthUtils.bufferToHex(signature.r),
          EthUtils.bufferToHex(signature.s),
          signature.v,
          { from: accountProvider.get() },
        ),
        'Should revert as the abort request is signed by invalid key.',
        'Invalid signature for recovery owner.',
      );
    });
  });

  contract('Events', async (accounts) => {
    const accountProvider = new AccountProvider(accounts);

    it('Emits RecoveryAborted.', async () => {
      const {
        recoveryOwnerPrivateKey,
        recoveryModule,
        prevOwner,
        oldOwner,
        newOwner,
      } = await prepare(accountProvider);

      const {
        signature,
      } = RecoveryModuleUtils.signAbortRecovery(
        recoveryModule.address, prevOwner, oldOwner, newOwner, recoveryOwnerPrivateKey,
      );

      const transactionResponse = await recoveryModule.abortRecoveryByOwner(
        prevOwner,
        oldOwner,
        newOwner,
        EthUtils.bufferToHex(signature.r),
        EthUtils.bufferToHex(signature.s),
        signature.v,
        { from: accountProvider.get() },
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
          _prevOwner: prevOwner,
          _oldOwner: oldOwner,
          _newOwner: newOwner,
        },
      });
    });
  });

  contract('Storage', async (accounts) => {
    const accountProvider = new AccountProvider(accounts);

    it('Checks that recovery is aborted properly.', async () => {
      const {
        recoveryOwnerPrivateKey,
        recoveryModule,
        prevOwner,
        oldOwner,
        newOwner,
      } = await prepare(accountProvider);

      const {
        signature,
      } = RecoveryModuleUtils.signAbortRecovery(
        recoveryModule.address, prevOwner, oldOwner, newOwner, recoveryOwnerPrivateKey,
      );

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
        activeRecoveryInfo.executionBlockHeight.eqn(0),
      );

      await recoveryModule.abortRecoveryByOwner(
        prevOwner,
        oldOwner,
        newOwner,
        EthUtils.bufferToHex(signature.r),
        EthUtils.bufferToHex(signature.s),
        signature.v,
        { from: accountProvider.get() },
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
        activeRecoveryInfo.executionBlockHeight.eqn(0),
      );
    });
  });
});
