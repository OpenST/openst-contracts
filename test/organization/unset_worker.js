// Copyright 2018 OpenST Ltd.
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


const Utils = require('../test_lib/utils.js'),
  { AccountProvider } = require('../test_lib/utils.js'),
  { Event } = require('../test_lib/event_decoder'),
  web3 = require('../test_lib/web3.js'),
  BN = require('bn.js');

const Organization = artifacts.require('Organization');

contract('Organization::unsetWorker', async (accounts) => {

  describe('Negative Tests', async () => {
    const accountProvider = new AccountProvider(accounts),
      owner = accountProvider.get(),
      worker = accountProvider.get();

    let organization = null;

    beforeEach(async function () {
      organization = await Organization.new({ from: owner });
    });

    it('Reverts when caller is not owner/admin.', async () => {

      await Utils.expectRevert(
        organization.unsetWorker(
          worker,
          { from: accountProvider.get() },
        ),
        'Should revert as caller is not owner/admin.',
        'Only owner/admin is allowed to call.',
      );

    });

  });

  describe('Successful execution', async () => {

    const accountProvider = new AccountProvider(accounts),
      owner = accountProvider.get(),
      admin = accountProvider.get(),
      worker = accountProvider.get();
    let organization = null;

    beforeEach(async function () {
      organization = await Organization.new({ from: owner });
      expirationHeight = (await web3.eth.getBlockNumber()) + 10;
      await organization.setWorker(worker, expirationHeight, {from: owner});
    });

    it('Should pass when owner unsets/deactivates a worker.', async () => {

      assert.ok(
        await organization.unsetWorker(
          worker,
          { from: owner },
        )
      );
      assert.equal(
        (await organization.workers.call(worker)).toString(10),
        (new BN(0)).toString(0)
      );

    });

    it('Should pass when admin unsets/deactivates a worker.', async () => {
      await organization.setAdmin(admin, { from: owner });
      assert.ok(
        await organization.unsetWorker(
          worker,
          { from: admin },
        )
      );
      assert.equal(
        (await organization.workers.call(worker)).toString(10),
        (new BN(0)).toString(0)
      );

    });

  });

  describe('Event Tests', async () => {

    const accountProvider = new AccountProvider(accounts),
      owner = accountProvider.get();
    let organization = null,
      expirationHeight = null;

    beforeEach(async function () {
      organization = await Organization.new({ from: owner });
      expirationHeight = (await web3.eth.getBlockNumber()) + 10;
    });

    it('Verifies emitting of unsetWorker event when worker is present.', async () => {
      let worker = accountProvider.get();
      await organization.setWorker(worker, expirationHeight, { from: owner });
      const transactionReceipt = await organization.unsetWorker(
        worker,
        { from: owner },
      );
      const events = Event.decodeTransactionResponse(
        transactionReceipt,
      );
      assert.strictEqual(
        events.length,
        1,
        'WorkerUnset event should be emitted.',
      );

      Event.assertEqual(events[0], {
        name: 'WorkerUnset',
        args: {
          _worker: worker,
          _wasSet: true
        },
      });

    });

  });

});
