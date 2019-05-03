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

const { AccountProvider } = require('../test_lib/utils');
const { Event } = require('../test_lib/event_decoder');
const Utils = require('../test_lib/utils.js');

const FirewalledRule = artifacts.require('FirewalledRule');

contract('FirewalledRule::disableFirewall', async () => {
  contract('Negative Tests', async (accounts) => {
    const accountProvider = new AccountProvider(accounts);

    it('Reverts as non-organization is calling.', async () => {
      const { organization } = await Utils.createOrganization(accountProvider);

      const firewalledRule = await FirewalledRule.new(organization.address);

      await Utils.expectRevert(
        firewalledRule.disableFirewall({ from: accountProvider.get() }),
        'Should revert as a non-organization is calling.',
        'Only the organization is allowed to call this method.',
      );
    });
  });

  contract('Positive Paths', async (accounts) => {
    const accountProvider = new AccountProvider(accounts);

    it('Checks that the firewall is disabled after the call.', async () => {
      const {
        organization,
        organizationOwner,
      } = await Utils.createOrganization(accountProvider);

      const firewalledRule = await FirewalledRule.new(organization.address);
      await firewalledRule.disableFirewall({ from: organizationOwner });

      assert.strictEqual(
        (await firewalledRule.firewallEnabled.call()),
        false,
      );
    });
  });

  contract('Events', async (accounts) => {
    const accountProvider = new AccountProvider(accounts);

    it('Emits FirewallDisabled.', async () => {
      const {
        organization,
        organizationOwner,
      } = await Utils.createOrganization(accountProvider);

      const firewalledRule = await FirewalledRule.new(organization.address);
      const response = await firewalledRule.disableFirewall(
        { from: organizationOwner },
      );

      const events = Event.decodeTransactionResponse(
        response,
      );

      assert.strictEqual(
        events.length,
        1,
      );

      Event.assertEqual(events[0], {
        name: 'FirewallDisabled',
        args: {},
      });
    });
  });
});
