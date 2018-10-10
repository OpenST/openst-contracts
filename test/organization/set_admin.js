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


const utils = require('../test_lib/utils.js'),
  { AccountProvider } = require('../test_lib/utils.js'),
  { Event } = require('../test_lib/event_decoder');

const Organization = artifacts.require('Organization');

contract('Organization::setAdmin', async () => {

  contract('Negative Tests', async (accounts) => {
    const accountProvider = new AccountProvider(accounts),
      owner = accountProvider.get(),
      admin = accountProvider.get();
    let organization = null;

    beforeEach(async function () {
      organization = await Organization.new();
    });

    it('Reverts when caller is not owner/admin.', async () => {

      await utils.expectRevert(
        organization.setAdmin(
          admin,
          { from: accountProvider.get() },
        ),
        'Should revert as caller is not owner/admin.',
        'Only owner/admin is allowed to call.',
      );
    });

    it('Reverts when admin is same as owner.', async () => {

      await utils.expectRevert(
        organization.setAdmin(
          owner,
          { from: owner },
        ),
        'Should revert as owner is setting himself as admin address.',
        'Admin address can\'t be owner address.',
      );

    });

  });

  contract('Storage Tests', async (accounts) => {
    const accountProvider = new AccountProvider(accounts),
      owner = accountProvider.get(),
      admin = accountProvider.get();
    let organization = null;

    beforeEach(async function () {
      organization = await Organization.new();
    });

    it('Should pass when correct admin is passed by owner.', async () => {
      const admin = accountProvider.get();
      assert.ok(
        await organization.setAdmin(
          admin,
          { from: owner },
        )
      );

      assert.strictEqual(await organization.admin.call(), admin);
    });

    it('Should pass when correct admin is passed by admin.', async () => {
      assert.ok(
        await organization.setAdmin(
          accountProvider.get(),
          { from: admin },
        )
      );

      assert.strictEqual(await organization.admin.call(), admin);
    });

    it('Should pass when admin address is 0x.', async () => {
      assert.ok(
        await organization.setAdmin(
          utils.NULL_ADDRESS,
          { from: owner },
        )
      );

      assert.strictEqual(await organization.admin.call(), utils.NULL_ADDRESS);
    });

  });

  contract('Event Tests', async (accounts) => {
    const accountProvider = new AccountProvider(accounts),
      owner = accountProvider.get(),
      admin = accountProvider.get();
    let organization = null;

    beforeEach(async function () {
      organization = await Organization.new();
    });

    it('Verifies emitting of AdminAddressChanged event.', async () => {
      const transactionReceipt = await organization.setAdmin(
        admin,
        { from: owner },
      );

      const events = Event.decodeTransactionResponse(
        transactionReceipt,
      );

      assert.strictEqual(
        events.length,
        1,
        'AdminAddressChanged event should be emitted.',
      );

      Event.assertEqual(events[0], {
        name: 'AdminAddressChanged',
        args: {
          _newAdmin: admin,
        },
      });

    });

  });

});
