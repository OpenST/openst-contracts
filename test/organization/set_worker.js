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
      worker = accountProvider.get(),
      expirationHeightDelta = 10;

    let organization = null,
      expirationHeight = 0;

    beforeEach(async function () {
      organization = await Organization.new({ from: owner });
      expirationHeight = (await web3.eth.getBlockNumber())+10;
    });

    it('Reverts when caller is not owner/admin.', async () => {

      await Utils.expectRevert(
        organization.setWorker(
          worker,
          expirationHeight,
          { from: accountProvider.get() },
        ),
        'Should revert as caller is not owner/admin.',
        'Only owner/admin is allowed to call.',
      );
    });

    it('Reverts when worker address is null.', async () => {

      await Utils.expectRevert(
        organization.setWorker(
          Utils.NULL_ADDRESS,
          expirationHeight,
          { from: owner },
        ),
        'Should revert when worker address is null.',
        'Worker address is null.',
      );

    });

    it('Reverts when expiration height is expired.', async () => {

      const blockNumber = await web3.eth.getBlockNumber();
      const expirationHeight = blockNumber + expirationHeightDelta;
      for (let i = 0; i < expirationHeightDelta; i += 1) {
        await Utils.advanceBlock();
      }

      // Checking that key has expired.
      assert.isOk(
        (await organization.workers.call(worker)) <=
        (await web3.eth.getBlockNumber()),
      );
      await Utils.expectRevert(
        organization.setWorker(
          worker,
          expirationHeight,
          { from: owner },
        ),
        'Should revert as worker has expired.',
        'Expiration height is lte to the current block height.',
      );

    });

  });

  describe('Storage Tests', async () => {

    const accountProvider = new AccountProvider(accounts),
      owner = accountProvider.get(),
      worker = accountProvider.get();
    let organization = null,
      expirationHeight = null;

    beforeEach(async function () {
      organization = await Organization.new({ from: owner });
      expirationHeight = (await web3.eth.getBlockNumber()) + 10;
    });

    it('Should pass when correct arguments are passed.', async () => {
      assert.ok(
        await organization.setWorker(
          worker,
          expirationHeight,
          { from: owner },
        )
      );
      assert.equal(
        (await organization.workers.call(worker)).toString(10),
        new BN(expirationHeight).toString(10)
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
    });

    it('Verifies emitting of WorkerAdded event.', async () => {

      const transactionReceipt = await organization.setWorker(
        worker,
        expirationHeight,
        { from: owner },
      );
      const events = Event.decodeTransactionResponse(
        transactionReceipt,
      );
      assert.strictEqual(
        events.length,
        1,
        'WorkerAdded event should be emitted.',
      );

      let currentBlockNumber = await web3.eth.getBlockNumber();
      let remainingHeight = expirationHeight - currentBlockNumber;
      Event.assertEqual(events[0], {
        name: 'WorkerAdded',
        args: {
          _worker: worker,
          _expirationHeight: new BN(expirationHeight),
          _remainingHeight: new BN(remainingHeight)
        },
      });

    });

  });

});
