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

const Utils = require('../test_lib/utils.js');
const DelayedRecoveryModuleUtils = require('./utils.js');
const web3 = require('../test_lib/web3.js');
const { AccountProvider } = require('../test_lib/utils.js');

const DelayedRecoveryModule = artifacts.require('DelayedRecoveryModule');

contract('DelayedRecoveryModule::setup', async () => {
  contract('Negative Tests', async (accounts) => {
    const accountProvider = new AccountProvider(accounts);

    it('Reverts if recovery owner\'s address is null.', async () => {
      const recoveryModule = await DelayedRecoveryModule.new();

      await Utils.expectRevert(
        recoveryModule.setup(
          Utils.NULL_ADDRESS, // recovery owner's address
          accountProvider.get(), // recovery controller's address
          DelayedRecoveryModuleUtils.BLOCK_RECOVERY_DELAY, // recovery block delays
        ),
        'Should revert as recovery owner\'s address is null.',
        'Recovery owner\'s address is null.',
      );
    });

    it('Reverts if recovery controllers\'s address is null.', async () => {
      const recoveryModule = await DelayedRecoveryModule.new();

      await Utils.expectRevert(
        recoveryModule.setup(
          accountProvider.get(), // recovery owner's address
          Utils.NULL_ADDRESS, // recovery controller's address
          DelayedRecoveryModuleUtils.BLOCK_RECOVERY_DELAY, // recovery block delays
        ),
        'Should revert as recovery controlers\'s address is null.',
        'Recovery controller\'s address is null.',
      );
    });

    it('Reverts if called second time.', async () => {
      const recoveryModule = await DelayedRecoveryModule.new();

      await recoveryModule.setup(
        accountProvider.get(), // recovery owner's address
        accountProvider.get(), // recovery controller's address
        DelayedRecoveryModuleUtils.BLOCK_RECOVERY_DELAY, // recovery block delays
      );

      await Utils.expectRevert(
        recoveryModule.setup(
          accountProvider.get(), // recovery owner's address
          accountProvider.get(), // recovery controller's address
          DelayedRecoveryModuleUtils.BLOCK_RECOVERY_DELAY, // recovery block delays
        ),
        'Should revert as setup is called second time.',
        'Domain separator was already set.',
      );
    });
  });

  contract('Storage', async (accounts) => {
    const accountProvider = new AccountProvider(accounts);

    it('Checks that passed arguments are set correctly.', async () => {
      const recoveryModule = await DelayedRecoveryModule.new();

      const recoveryOwner = accountProvider.get();
      const recoveryController = accountProvider.get();
      const recoveryBlockDelay = DelayedRecoveryModuleUtils.BLOCK_RECOVERY_DELAY;

      const moduleManager = accountProvider.get();

      await recoveryModule.setup(
        recoveryOwner,
        recoveryController,
        recoveryBlockDelay,
        {
          from: moduleManager,
        },
      );

      assert.strictEqual(
        await recoveryModule.domainSeparator.call(),
        DelayedRecoveryModuleUtils.hashRecoveryModuleDomainSeparator(
          recoveryModule.address,
        ),
      );

      assert.strictEqual(
        await recoveryModule.recoveryOwner.call(),
        recoveryOwner,
      );

      assert.strictEqual(
        await recoveryModule.recoveryController.call(),
        recoveryController,
      );

      assert.isOk(
        (await recoveryModule.recoveryBlockDelay.call()).eqn(
          recoveryBlockDelay,
        ),
      );

      assert.strictEqual(
        await recoveryModule.manager.call(),
        moduleManager,
      );

      const activeRecoveryInfo = await recoveryModule.activeRecoveryInfo.call();

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
        (activeRecoveryInfo.initiationBlockHeight).eqn(0),
      );

      assert.isNotOk(
        activeRecoveryInfo.initiated,
      );
    });

    it('Checks storage elements order to assure reserved '
        + 'slot for proxy is valid.', async () => {
      const recoveryModule = await DelayedRecoveryModule.new();

      const recoveryOwner = accountProvider.get();
      const recoveryController = accountProvider.get();
      const recoveryBlockDelay = DelayedRecoveryModuleUtils.BLOCK_RECOVERY_DELAY;

      await recoveryModule.setup(
        recoveryOwner,
        recoveryController,
        recoveryBlockDelay,
      );


      assert.strictEqual(
        (await web3.eth.getStorageAt(recoveryModule.address, 0)),
        '0x00',
      );
    });
  });
});
