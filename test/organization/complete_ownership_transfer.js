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
  { Event } = require('../test_lib/event_decoder');

const Organization = artifacts.require('Organization');

contract('Organization::initiateOwnershipTransfer', async () => {

  contract('Negative Tests', async (accounts) => {
    const accountProvider = new AccountProvider(accounts),
      owner = accountProvider.get(),
      proposedOwner = accountProvider.get();
    let organization = null;

    beforeEach(async function () {
      organization = await Organization.new({ from: owner });
      await organization.initiateOwnershipTransfer(
        proposedOwner,
        { from: owner },
      )
    });

    it('Reverts when caller is not owner.', async () => {

      await Utils.expectRevert(
        organization.completeOwnershipTransfer({ from: accountProvider.get() },),
        'Should revert as caller is not proposedOwner.',
        'msg.sender is not proposed owner address.',
      );
    });

  });

  contract('Storage Tests', async (accounts) => {

    const accountProvider = new AccountProvider(accounts),
      owner = accountProvider.get(),
      proposedOwner = accountProvider.get();
    let organization = null;

    beforeEach(async function () {
      organization = await Organization.new({ from: owner });
      await organization.initiateOwnershipTransfer(
        proposedOwner,
        { from: owner },
      )
    });

    it('Should pass when caller is proposed owner.', async () => {
      assert.ok(
        await organization.completeOwnershipTransfer(
          { from: proposedOwner },
        )
      );

      assert.strictEqual(await organization.owner.call(), proposedOwner);
    });

  });

  contract('Event Tests', async (accounts) => {

    const accountProvider = new AccountProvider(accounts),
      owner = accountProvider.get(),
      proposedOwner = accountProvider.get();
    let organization = null;

    beforeEach(async function () {
      organization = await Organization.new({ from: owner });
      await organization.initiateOwnershipTransfer(
        proposedOwner,
        { from: owner },
      )
    });

    it('Verifies emitting of OwnershipTransferCompleted event.', async () => {
      const transactionReceipt = await organization.completeOwnershipTransfer(
        { from: proposedOwner },
      );

      const events = Event.decodeTransactionResponse(
        transactionReceipt,
      );

      assert.strictEqual(
        events.length,
        1,
        'OwnershipTransferCompleted event should be emitted.',
      );

      // The emitted event should be 'OwnershipTransferInitiated'.
      Event.assertEqual(events[0], {
        name: 'OwnershipTransferCompleted',
        args: {
          _previousOwner: owner,
          _newOwner: proposedOwner
        },
      });

    });

  });

});
