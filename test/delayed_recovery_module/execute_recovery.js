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
    recoveryBlockDelay,
    moduleManager,
    recoveryModule,
    prevOwner,
    oldOwner,
    newOwner,
    recoveryHash,
    signature,
  };
}


function generateMockRuleFailFunctionData(value) {
  return web3.eth.abi.encodeFunctionCall(
    {
      name: 'fail',
      type: 'function',
      inputs: [
        {
          type: 'address',
          name: 'value',
        },
      ],
    },
    [value],
  );
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
      } = RecoveryModuleUtils.signRecovery(
        recoveryModule.address, prevOwner, oldOwner, newOwner, recoveryOwnerPrivateKey,
      );

      assert.strictEqual(
        (await recoveryModule.activeRecoveryInfo.call()).recoveryHash,
        Utils.NULL_BYTES32,
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
        'Hash of recovery to execute does not match with active recovery\'s hash.',
      );
    });

    it('Reverts if the execute request is not for the active one.', async () => {
      const {
        recoveryControllerAddress,
        recoveryOwnerPrivateKey,
        recoveryBlockDelay,
        recoveryModule,
      } = await prepare(accountProvider);

      for (let i = 0; i < recoveryBlockDelay; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await Utils.advanceBlock();
      }

      const anotherPrevOwner = accountProvider.get();
      const anotherOldOwner = accountProvider.get();
      const anotherNewOwner = accountProvider.get();

      const {
        recoveryHash,
        signature,
      } = RecoveryModuleUtils.signRecovery(
        recoveryModule.address,
        anotherPrevOwner,
        anotherOldOwner,
        anotherNewOwner,
        recoveryOwnerPrivateKey,
      );

      assert.notStrictEqual(
        recoveryHash,
        (await recoveryModule.activeRecoveryInfo.call()).recoveryHash,
      );

      await Utils.expectRevert(
        recoveryModule.executeRecovery(
          anotherPrevOwner,
          anotherOldOwner,
          anotherNewOwner,
          EthUtils.bufferToHex(signature.r),
          EthUtils.bufferToHex(signature.s),
          signature.v,
          { from: recoveryControllerAddress },
        ),
        'Should revert as the execute request is not for the active recovery.',
        'Hash of recovery to execute does not match with active recovery\'s hash.',
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

      assert.notStrictEqual(
        recoveryOwnerPrivateKey,
        privateKey,
      );

      const {
        recoveryHash,
        signature,
      } = RecoveryModuleUtils.signRecovery(
        recoveryModule.address, prevOwner, oldOwner, newOwner, privateKey,
      );

      assert.strictEqual(
        recoveryHash,
        (await recoveryModule.activeRecoveryInfo.call()).recoveryHash,
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
        recoveryControllerAddress,
        recoveryBlockDelay,
        signature,
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
        recoveryHash,
        signature,
      } = RecoveryModuleUtils.signRecovery(
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
          _recoveryHash: recoveryHash,
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
        recoveryHash,
        signature,
      } = RecoveryModuleUtils.signRecovery(
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

      assert.strictEqual(
        activeRecoveryInfo.recoveryHash,
        recoveryHash,
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

      assert.strictEqual(
        activeRecoveryInfo.recoveryHash,
        Utils.NULL_BYTES32,
      );
    });
  });
});
