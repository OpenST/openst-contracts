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
const EthUtils = require('ethereumjs-util');
const Utils = require('../test_lib/utils.js');
const web3 = require('../test_lib/web3.js');
const { Event } = require('../test_lib/event_decoder.js');
const RecoveryModuleUtils = require('./utils.js');
const { AccountProvider } = require('../test_lib/utils.js');

async function prepare(accountProvider) {
  const {
    recoveryOwnerPrivateKey,
    recoveryControllerAddress,
    recoveryBlockDelay,
    moduleManager,
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
    recoveryBlockDelay,
    moduleManager,
    recoveryModule,
    prevOwner,
    oldOwner,
    newOwner,
  };
}

function generateSwapOwnerData(
  prevOwner, oldOwner, newOwner,
) {
  return web3.eth.abi.encodeFunctionCall(
    {
      name: 'swapOwner',
      type: 'function',
      inputs: [
        {
          type: 'address',
          name: 'prevOwner',
        },
        {
          type: 'address',
          name: 'oldOwner',
        },
        {
          type: 'address',
          name: 'newOwner',
        },
      ],
    },
    [prevOwner, oldOwner, newOwner],
  );
}

contract('DelayedRecoveryModule::executeRecovery', async () => {
  contract('Negative Tests', async (accounts) => {
    const accountProvider = new AccountProvider(accounts);

    it('Reverts if a caller is not a controller.', async () => {
      const {
        recoveryOwnerPrivateKey,
        recoveryBlockDelay,
        recoveryModule,
      } = await RecoveryModuleUtils.createRecoveryModule(
        accountProvider,
      );

      for (let i = 0; i < recoveryBlockDelay; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await Utils.advanceBlock();
      }

      const prevOwner = accountProvider.get();
      const oldOwner = accountProvider.get();
      const newOwner = accountProvider.get();

      const {
        signature,
      } = RecoveryModuleUtils.signExecuteRecovery(
        recoveryModule.address, prevOwner, oldOwner, newOwner, recoveryOwnerPrivateKey,
      );

      assert.isNotOk(
        (await recoveryModule.activeRecoveryInfo.call()).initiated,
      );

      await Utils.expectRevert(
        recoveryModule.executeRecovery(
          prevOwner,
          oldOwner,
          newOwner,
          EthUtils.bufferToHex(signature.r),
          EthUtils.bufferToHex(signature.s),
          signature.v,
          { from: accountProvider.get() },
        ),
        'Should revert as a caller is not a controller.',
        'Only recovery controller is allowed to call.',
      );
    });

    it('Reverts if there is no active recovery process.', async () => {
      const {
        recoveryControllerAddress,
        recoveryOwnerPrivateKey,
        recoveryBlockDelay,
        recoveryModule,
      } = await RecoveryModuleUtils.createRecoveryModule(
        accountProvider,
      );

      for (let i = 0; i < recoveryBlockDelay; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await Utils.advanceBlock();
      }

      const prevOwner = accountProvider.get();
      const oldOwner = accountProvider.get();
      const newOwner = accountProvider.get();

      const {
        signature,
      } = RecoveryModuleUtils.signExecuteRecovery(
        recoveryModule.address, prevOwner, oldOwner, newOwner, recoveryOwnerPrivateKey,
      );

      assert.isNotOk(
        (await recoveryModule.activeRecoveryInfo.call()).initiated,
      );

      await Utils.expectRevert(
        recoveryModule.executeRecovery(
          prevOwner,
          oldOwner,
          newOwner,
          EthUtils.bufferToHex(signature.r),
          EthUtils.bufferToHex(signature.s),
          signature.v,
          { from: recoveryControllerAddress },
        ),
        'Should revert as there is no active recovery process.',
        'There is no active recovery.',
      );
    });

    it('Reverts if the execute request is not for the active one.', async () => {
      const {
        recoveryControllerAddress,
        recoveryOwnerPrivateKey,
        recoveryBlockDelay,
        recoveryModule,
        prevOwner,
        oldOwner,
        newOwner,
      } = await prepare(accountProvider);

      for (let i = 0; i < recoveryBlockDelay; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await Utils.advanceBlock();
      }

      const anotherPrevOwner = accountProvider.get();
      const anotherOldOwner = accountProvider.get();
      const anotherNewOwner = accountProvider.get();

      const {
        signature: signature1,
      } = RecoveryModuleUtils.signExecuteRecovery(
        recoveryModule.address,
        anotherPrevOwner,
        oldOwner,
        newOwner,
        recoveryOwnerPrivateKey,
      );

      await Utils.expectRevert(
        recoveryModule.executeRecovery(
          anotherPrevOwner,
          oldOwner,
          newOwner,
          EthUtils.bufferToHex(signature1.r),
          EthUtils.bufferToHex(signature1.s),
          signature1.v,
          { from: recoveryControllerAddress },
        ),
        'Should revert as the execute request is not for the active recovery.',
        'The execution request\'s data does not match with the active one.',
      );

      const {
        signature: signature2,
      } = RecoveryModuleUtils.signExecuteRecovery(
        recoveryModule.address,
        prevOwner,
        anotherOldOwner,
        newOwner,
        recoveryOwnerPrivateKey,
      );

      await Utils.expectRevert(
        recoveryModule.executeRecovery(
          prevOwner,
          anotherOldOwner,
          newOwner,
          EthUtils.bufferToHex(signature2.r),
          EthUtils.bufferToHex(signature2.s),
          signature2.v,
          { from: recoveryControllerAddress },
        ),
        'Should revert as the execute request is not for the active recovery.',
        'The execution request\'s data does not match with the active one.',
      );

      const {
        signature: signature3,
      } = RecoveryModuleUtils.signExecuteRecovery(
        recoveryModule.address,
        prevOwner,
        oldOwner,
        anotherNewOwner,
        recoveryOwnerPrivateKey,
      );

      await Utils.expectRevert(
        recoveryModule.executeRecovery(
          prevOwner,
          oldOwner,
          anotherNewOwner,
          EthUtils.bufferToHex(signature3.r),
          EthUtils.bufferToHex(signature3.s),
          signature3.v,
          { from: recoveryControllerAddress },
        ),
        'Should revert as the execute request is not for the active recovery.',
        'The execution request\'s data does not match with the active one.',
      );
    });

    it('Reverts if the execute request is signed by invalid key.', async () => {
      const {
        recoveryControllerAddress,
        recoveryOwnerPrivateKey,
        recoveryBlockDelay,
        recoveryModule,
        prevOwner,
        oldOwner,
        newOwner,
      } = await prepare(accountProvider);

      for (let i = 0; i < recoveryBlockDelay; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await Utils.advanceBlock();
      }

      const privateKey = '0x038764453ef1dbdf9cfb3923f95d22a8974a1aa2f7351737b46d9ea25aaba50a';

      assert.notEqual(
        recoveryOwnerPrivateKey,
        privateKey,
      );

      const {
        signature,
      } = RecoveryModuleUtils.signExecuteRecovery(
        recoveryModule.address, prevOwner, oldOwner, newOwner, privateKey,
      );

      await Utils.expectRevert(
        recoveryModule.executeRecovery(
          prevOwner,
          oldOwner,
          newOwner,
          EthUtils.bufferToHex(signature.r),
          EthUtils.bufferToHex(signature.s),
          signature.v,
          { from: recoveryControllerAddress },
        ),
        'Should revert as the execute request is signed by invalid key.',
        'The recovery owner does not sign the message.',
      );
    });

    it('Reverts if required number of blocks to recover was not progressed.', async () => {
      const {
        recoveryOwnerPrivateKey,
        recoveryControllerAddress,
        recoveryBlockDelay,
        recoveryModule,
        prevOwner,
        oldOwner,
        newOwner,
      } = await prepare(accountProvider);

      const activeRecoveryInfo = await recoveryModule.activeRecoveryInfo.call();

      const blockNumber = (await web3.eth.getBlockNumber());

      const delta = new BN(activeRecoveryInfo.initiationBlockHeight)
        .add(new BN(recoveryBlockDelay))
        .sub(new BN(blockNumber))
        .sub(new BN(1));

      assert.isNotOk(
        delta.isNeg(),
      );

      for (let i = 0; i < delta; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await Utils.advanceBlock();
      }

      const {
        signature,
      } = RecoveryModuleUtils.signExecuteRecovery(
        recoveryModule.address, prevOwner, oldOwner, newOwner, recoveryOwnerPrivateKey,
      );

      await Utils.expectRevert(
        recoveryModule.executeRecovery(
          prevOwner,
          oldOwner,
          newOwner,
          EthUtils.bufferToHex(signature.r),
          EthUtils.bufferToHex(signature.s),
          signature.v,
          { from: recoveryControllerAddress },
        ),
        'Should revert as required number of blocks to recover was not progressed.',
        'Required number of blocks to recover was not progressed.',
      );
    });

    it('Reverts if ModuleManager fails to execute.', async () => {
      const {
        moduleManager,
        recoveryOwnerPrivateKey,
        recoveryControllerAddress,
        recoveryBlockDelay,
        recoveryModule,
        prevOwner,
        oldOwner,
        newOwner,
      } = await prepare(accountProvider);

      for (let i = 0; i < recoveryBlockDelay; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await Utils.advanceBlock();
      }

      const {
        signature,
      } = RecoveryModuleUtils.signExecuteRecovery(
        recoveryModule.address, prevOwner, oldOwner, newOwner, recoveryOwnerPrivateKey,
      );

      moduleManager.makeFail();

      await Utils.expectRevert(
        recoveryModule.executeRecovery(
          prevOwner,
          oldOwner,
          newOwner,
          EthUtils.bufferToHex(signature.r),
          EthUtils.bufferToHex(signature.s),
          signature.v,
          { from: recoveryControllerAddress },
        ),
        'Should revert as the module manager fails to execute.',
        'Recovery execution failed.',
      );
    });
  });

  contract('Events', async (accounts) => {
    const accountProvider = new AccountProvider(accounts);

    it('Emits RecoveryExecuted.', async () => {
      const {
        recoveryControllerAddress,
        recoveryOwnerPrivateKey,
        recoveryBlockDelay,
        recoveryModule,
        prevOwner,
        oldOwner,
        newOwner,
      } = await prepare(accountProvider);

      for (let i = 0; i < recoveryBlockDelay; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await Utils.advanceBlock();
      }

      const {
        signature,
      } = RecoveryModuleUtils.signExecuteRecovery(
        recoveryModule.address, prevOwner, oldOwner, newOwner, recoveryOwnerPrivateKey,
      );

      const transactionResponse = await recoveryModule.executeRecovery(
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
        name: 'RecoveryExecuted',
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

    it('Checks that recovery is executed properly.', async () => {
      const {
        recoveryControllerAddress,
        recoveryOwnerPrivateKey,
        recoveryBlockDelay,
        moduleManager,
        recoveryModule,
        prevOwner,
        oldOwner,
        newOwner,
      } = await prepare(accountProvider);

      for (let i = 0; i < recoveryBlockDelay; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await Utils.advanceBlock();
      }

      const {
        signature,
      } = RecoveryModuleUtils.signExecuteRecovery(
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
        activeRecoveryInfo.initiationBlockHeight.eqn(0),
      );

      assert.isOk(
        activeRecoveryInfo.initiated,
      );

      await recoveryModule.executeRecovery(
        prevOwner,
        oldOwner,
        newOwner,
        EthUtils.bufferToHex(signature.r),
        EthUtils.bufferToHex(signature.s),
        signature.v,
        { from: recoveryControllerAddress },
      );

      assert.strictEqual(
        await moduleManager.recordedTo.call(),
        moduleManager.address,
      );

      assert.isOk(
        (await moduleManager.recordedValue.call()).eqn(0),
      );

      assert.strictEqual(
        await moduleManager.recordedData.call(),
        generateSwapOwnerData(prevOwner, oldOwner, newOwner),
      );

      assert.isOk(
        (await moduleManager.recordedOperation.call()).eqn(0),
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

      assert.isNotOk(
        activeRecoveryInfo.initiated,
      );
    });
  });
});
