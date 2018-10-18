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

contract('Organization::setWorker', async (accounts) => {

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
        organization.removeWorker(
          worker,
          { from: accountProvider.get() },
        ),
        'Should revert as caller is not owner/admin.',
        'Only owner/admin is allowed to call.',
      );

    });

    it('Reverts when worker to be removed is not present.', async () => {

      await Utils.expectRevert(
        organization.removeWorker(
          accountProvider.get(),
          { from: owner },
        ),
        'Should revert as worker to be removed is not present.',
        'Worker to be removed is not present.',
      );

    });

  });

  describe('Successful execution', async () => {

    const accountProvider = new AccountProvider(accounts),
      owner = accountProvider.get(),
      worker = accountProvider.get();
    let organization = null,
      expirationHeight = null;

    beforeEach(async function () {
      organization = await Organization.new({ from: owner });
      expirationHeight = (await web3.eth.getBlockNumber()) + 10;
      await organization.setWorker(worker, expirationHeight, { from: owner })
    });

    it('Should pass when correct arguments are passed.', async () => {

      assert.ok(
        await organization.removeWorker(
          worker,
          { from: owner },
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
      owner = accountProvider.get(),
      worker = accountProvider.get();
    let organization = null,
      expirationHeight = null;

    beforeEach(async function () {
      organization = await Organization.new({ from: owner });
      expirationHeight = (await web3.eth.getBlockNumber()) + 10;
      await organization.setWorker(worker, expirationHeight, { from: owner })
    });

    it('Verifies emitting of removeWorker event.', async () => {

      const transactionReceipt = await organization.removeWorker(
        worker,
        { from: owner },
      );
      const events = Event.decodeTransactionResponse(
        transactionReceipt,
      );
      assert.strictEqual(
        events.length,
        1,
        'WorkerRemoved event should be emitted.',
      );

      Event.assertEqual(events[0], {
        name: 'WorkerRemoved',
        args: {
          _worker: worker
        },
      });

    });

  });

});
