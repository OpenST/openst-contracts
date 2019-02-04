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

const NEW_RECOVERY_OWNER_ADDRESS = '0x798c2Eaa13BaD12215ba71A3b71471042945B6fE';
const NEW_RECOVERY_OWNER_PRIVATE_KEY = '0xe8c25ebc30640eaf59b72753fef330e5bc5f7b0afa542584ede77f88a7529962';

contract('DelayedRecoveryModule::resetRecoveryOwner', async () => {
  contract('Negative Tests', async (accounts) => {
    const accountProvider = new AccountProvider(accounts);

    it('Reverts if non-recovery controller calls.', async () => {
      const {
        recoveryOwnerAddress,
        recoveryOwnerPrivateKey,
        recoveryModule,
      } = await RecoveryModuleUtils.createRecoveryModule(
        accountProvider,
      );

      const {
        signature,
      } = RecoveryModuleUtils.signResetRecoveryOwner(
        recoveryModule.address,
        recoveryOwnerAddress,
        NEW_RECOVERY_OWNER_ADDRESS,
        recoveryOwnerPrivateKey,
      );

      await Utils.expectRevert(
        recoveryModule.resetRecoveryOwner(
          NEW_RECOVERY_OWNER_ADDRESS,
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

    it('Reverts if a new recovery owner address is null.', async () => {
      const {
        recoveryOwnerAddress,
        recoveryOwnerPrivateKey,
        recoveryControllerAddress,
        recoveryModule,
      } = await RecoveryModuleUtils.createRecoveryModule(
        accountProvider,
      );

      const {
        signature,
      } = RecoveryModuleUtils.signResetRecoveryOwner(
        recoveryModule.address,
        recoveryOwnerAddress,
        Utils.NULL_ADDRESS,
        recoveryOwnerPrivateKey,
      );

      await Utils.expectRevert(
        recoveryModule.resetRecoveryOwner(
          Utils.NULL_ADDRESS,
          EthUtils.bufferToHex(signature.r),
          EthUtils.bufferToHex(signature.s),
          signature.v,
          { from: recoveryControllerAddress },
        ),
        'Should revert as the new recovery owner address is null.',
        'New recovery owner\'s address is null.',
      );
    });

    it('Reverts if the message is not signed by the current owner key.', async () => {
      const {
        recoveryOwnerAddress,
        recoveryOwnerPrivateKey,
        recoveryControllerAddress,
        recoveryModule,
      } = await RecoveryModuleUtils.createRecoveryModule(
        accountProvider,
      );

      const privateKey = '0x038764453ef1dbdf9cfb3923f95d22a8974a1aa2f7351737b46d9ea25aaba50a';

      assert.notStrictEqual(
        recoveryOwnerPrivateKey,
        privateKey,
      );

      const {
        signature,
      } = RecoveryModuleUtils.signResetRecoveryOwner(
        recoveryModule.address,
        recoveryOwnerAddress,
        NEW_RECOVERY_OWNER_ADDRESS,
        privateKey,
      );

      await Utils.expectRevert(
        recoveryModule.resetRecoveryOwner(
          NEW_RECOVERY_OWNER_ADDRESS,
          EthUtils.bufferToHex(signature.r),
          EthUtils.bufferToHex(signature.s),
          signature.v,
          { from: recoveryControllerAddress },
        ),
        'Should revert as the message is not signed by the recovery owner.',
        'The recovery owner does not sign the message.',
      );
    });
  });

  contract('Events', async (accounts) => {
    const accountProvider = new AccountProvider(accounts);

    it('Emits ResetRecoveryOwner.', async () => {
      const {
        recoveryOwnerAddress,
        recoveryOwnerPrivateKey,
        recoveryControllerAddress,
        recoveryModule,
      } = await RecoveryModuleUtils.createRecoveryModule(
        accountProvider,
      );

      const {
        signature,
      } = RecoveryModuleUtils.signResetRecoveryOwner(
        recoveryModule.address,
        recoveryOwnerAddress,
        NEW_RECOVERY_OWNER_ADDRESS,
        recoveryOwnerPrivateKey,
      );

      const transactionResponse = await recoveryModule.resetRecoveryOwner(
        NEW_RECOVERY_OWNER_ADDRESS,
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
        name: 'ResetRecoveryOwner',
        args: {
          _oldRecoveryOwner: recoveryOwnerAddress,
          _newRecoveryOwner: NEW_RECOVERY_OWNER_ADDRESS,
        },
      });
    });
  });

  contract('Storage', async (accounts) => {
    const accountProvider = new AccountProvider(accounts);

    it('Checks that resetting recovery owner\'s address is done properly.', async () => {
      const {
        recoveryOwnerAddress,
        recoveryOwnerPrivateKey,
        recoveryControllerAddress,
        recoveryModule,
      } = await RecoveryModuleUtils.createRecoveryModule(
        accountProvider,
      );

      const {
        signature,
      } = RecoveryModuleUtils.signResetRecoveryOwner(
        recoveryModule.address,
        recoveryOwnerAddress,
        NEW_RECOVERY_OWNER_ADDRESS,
        recoveryOwnerPrivateKey,
      );

      assert.strictEqual(
        await recoveryModule.recoveryOwner.call(),
        recoveryOwnerAddress,
      );

      await recoveryModule.resetRecoveryOwner(
        NEW_RECOVERY_OWNER_ADDRESS,
        EthUtils.bufferToHex(signature.r),
        EthUtils.bufferToHex(signature.s),
        signature.v,
        { from: recoveryControllerAddress },
      );

      assert.strictEqual(
        await recoveryModule.recoveryOwner.call(),
        NEW_RECOVERY_OWNER_ADDRESS,
      );
    });
  });
});
