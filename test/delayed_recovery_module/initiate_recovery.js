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
const web3 = require('../test_lib/web3.js');
const { Event } = require('../test_lib/event_decoder.js');
const RecoveryModuleUtils = require('./utils.js');
const { AccountProvider } = require('../test_lib/utils.js');

contract('DelayedRecoveryModule::initiateRecovery', async () => {
  contract('Negative Tests', async (accounts) => {
    const accountProvider = new AccountProvider(accounts);

    it('Reverts if non-recovery controller calls.', async () => {
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
      } = RecoveryModuleUtils.signInitiateRecovery(
        recoveryModule.address,
        prevOwner,
        oldOwner,
        newOwner,
        recoveryOwnerPrivateKey,
      );

      await Utils.expectRevert(
        recoveryModule.initiateRecovery(
          prevOwner,
          oldOwner,
          newOwner,
          EthUtils.bufferToHex(signature.r),
          EthUtils.bufferToHex(signature.s),
          signature.v,
          {
            from: accountProvider.get(), // not a recovery controller's address
          },
        ),
        'Should revert as non-recovery controller\'s address calls.',
        'Only recovery controller is allowed to call.',
      );
    });

    it('Reverts if there is an active recovery process.', async () => {
      const {
        recoveryOwnerPrivateKey,
        recoveryControllerAddress,
        recoveryModule,
      } = await RecoveryModuleUtils.createRecoveryModule(
        accountProvider,
      );

      const prevOwner1 = accountProvider.get();
      const oldOwner1 = accountProvider.get();
      const newOwner1 = accountProvider.get();

      const {
        signature: signature1,
      } = RecoveryModuleUtils.signInitiateRecovery(
        recoveryModule.address,
        prevOwner1,
        oldOwner1,
        newOwner1,
        recoveryOwnerPrivateKey,
      );

      await recoveryModule.initiateRecovery(
        prevOwner1,
        oldOwner1,
        newOwner1,
        EthUtils.bufferToHex(signature1.r),
        EthUtils.bufferToHex(signature1.s),
        signature1.v,
        { from: recoveryControllerAddress },
      );

      await Utils.expectRevert(
        recoveryModule.initiateRecovery(
          prevOwner1,
          oldOwner1,
          newOwner1,
          EthUtils.bufferToHex(signature1.r),
          EthUtils.bufferToHex(signature1.s),
          signature1.v,
          {
            from: recoveryControllerAddress,
          },
        ),
        'Should revert as there is an active recovery process.',
        'There is an active recovery.',
      );

      const prevOwner2 = accountProvider.get();
      const oldOwner2 = accountProvider.get();
      const newOwner2 = accountProvider.get();

      const {
        signature: signature2,
      } = RecoveryModuleUtils.signInitiateRecovery(
        recoveryModule.address,
        prevOwner2,
        oldOwner2,
        newOwner2,
        recoveryOwnerPrivateKey,
      );

      await Utils.expectRevert(
        recoveryModule.initiateRecovery(
          prevOwner2,
          oldOwner2,
          newOwner2,
          EthUtils.bufferToHex(signature2.r),
          EthUtils.bufferToHex(signature2.s),
          signature2.v,
          {
            from: recoveryControllerAddress,
          },
        ),
        'Should revert as there is an active recovery process.',
        'There is an active recovery.',
      );
    });

    it('Reverts if recovery message is not signed by owner.', async () => {
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

      const privateKey = '0x038764453ef1dbdf9cfb3923f95d22a8974a1aa2f7351737b46d9ea25aaba50a';

      assert.notStrictEqual(
        recoveryOwnerPrivateKey,
        privateKey,
      );

      const {
        signature,
      } = RecoveryModuleUtils.signInitiateRecovery(
        recoveryModule.address,
        prevOwner,
        oldOwner,
        newOwner,
        privateKey,
      );

      await Utils.expectRevert(
        recoveryModule.initiateRecovery(
          prevOwner,
          oldOwner,
          newOwner,
          EthUtils.bufferToHex(signature.r),
          EthUtils.bufferToHex(signature.s),
          signature.v,
          { from: recoveryControllerAddress },
        ),
        'Should revert as recovery message is not signed by the recovery owner.',
        'Invalid signature for recovery owner.',
      );
    });
  });

  contract('Events', async (accounts) => {
    const accountProvider = new AccountProvider(accounts);

    it('Emits RecoveryInitiated.', async () => {
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

      const transactionResponse = await recoveryModule.initiateRecovery(
        prevOwner,
        oldOwner,
        newOwner,
        EthUtils.bufferToHex(signature.r),
        EthUtils.bufferToHex(signature.s),
        signature.v,
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
        name: 'RecoveryInitiated',
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

    it('Checks that recovery is initiated properly.', async () => {
      const {
        recoveryOwnerPrivateKey,
        recoveryControllerAddress,
        recoveryBlockDelay,
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
      const blockNumber = (await web3.eth.getBlockNumber());

      const activeRecoveryInfo = await recoveryModule.activeRecoveryInfo.call();

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

      assert.isOk(
        (activeRecoveryInfo.executionBlockHeight).eqn(blockNumber + recoveryBlockDelay),
      );
    });
  });
});
