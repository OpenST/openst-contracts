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
const web3 = require('../test_lib/web3.js');
const { Event } = require('../test_lib/event_decoder');
const { AccountProvider } = require('../test_lib/utils.js');

const ProxyContract = artifacts.require('Proxy');
const ProxyFactory = artifacts.require('ProxyFactory');
const MasterCopySpy = artifacts.require('MasterCopySpy');

function generateSetupFunctionData(balance) {
  const masterCopySpy = new web3.eth.Contract(MasterCopySpy.abi);
  return masterCopySpy.methods.setup(balance).encodeABI();
}


contract('ProxyFactory::createProxy', async (accounts) => {
  const accountProvider = new AccountProvider(accounts);

  contract('Negative Tests', async () => {
    it('Reverts if master copy address is null.', async () => {
      const proxyFactory = await ProxyFactory.new();

      await Utils.expectRevert(
        proxyFactory.createProxy(
          Utils.NULL_ADDRESS,
          '0x',
        ),
        'Should revert as the master copy address is null.',
        'Master copy address is null.',
      );
    });
  });

  contract('Proxy', async () => {
    it('Checks that proxy constructor with master copy address is called.', async () => {
      const proxyFactory = await ProxyFactory.new();

      const masterCopy = accountProvider.get();

      const proxyAddress = await proxyFactory.createProxy.call(
        masterCopy,
        '0x',
      );
      await proxyFactory.createProxy(
        masterCopy,
        '0x',
      );

      const proxy = await ProxyContract.at(proxyAddress);

      assert.strictEqual(
        await proxy.masterCopy.call(),
        masterCopy,
      );
    });

    it('Checks that if "data" is non-empty appropriate function on proxy is called.', async () => {
      const proxyFactory = await ProxyFactory.new();

      const initialBalance = 22;
      const masterCopy = await MasterCopySpy.new(initialBalance);

      const initialBalanceInSetupCall = 11;
      const setupData = await generateSetupFunctionData(
        initialBalanceInSetupCall,
      );

      const proxyAddress = await proxyFactory.createProxy.call(
        masterCopy.address,
        setupData,
      );
      await proxyFactory.createProxy(
        masterCopy.address,
        setupData,
      );

      const proxy = await MasterCopySpy.at(proxyAddress);

      assert.isOk(
        (await proxy.remainingBalance.call()).eqn(initialBalanceInSetupCall),
      );
    });
  });

  contract('Events', async () => {
    it('Checks that ProxyCreated event is emitted on success.', async () => {
      const proxyFactory = await ProxyFactory.new();

      const initialBalance = 22;
      const masterCopy = await MasterCopySpy.new(initialBalance);

      const initialBalanceInSetupCall = 11;
      const setupData = generateSetupFunctionData(
        initialBalanceInSetupCall,
      );


      const proxyAddress = await proxyFactory.createProxy.call(
        masterCopy.address,
        setupData,
      );
      const transactionResponse = await proxyFactory.createProxy(
        masterCopy.address,
        setupData,
      );

      const events = Event.decodeTransactionResponse(
        transactionResponse,
      );

      assert.strictEqual(
        events.length,
        1,
      );

      Event.assertEqual(events[0], {
        name: 'ProxyCreated',
        args: {
          _proxy: proxyAddress,
        },
      });
    });
  });
});
