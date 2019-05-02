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
const Utils = require('../test_lib/utils.js');

const FirewalledRuleCaller = artifacts.require('FirewalledRuleCaller');
const FirewalledRuleImplementation = artifacts.require('FirewalledRuleImplementation');

contract('FirewalledRule::firewalled', async () => {
  contract('Negative Tests', async (accounts) => {
    const accountProvider = new AccountProvider(accounts);

    it('Reverts as non-organization worker is calling.', async () => {
      const { organization } = await Utils.createOrganization(accountProvider);

      const firewalledRuleImplementation = await FirewalledRuleImplementation.new(
        organization.address,
      );
      const firewalledRuleCaller = await FirewalledRuleCaller.new(
        firewalledRuleImplementation.address,
      );

      await Utils.expectRevert(
        firewalledRuleCaller.callFirewalledFn({ from: accountProvider.get() }),
        'Should revert as a non-organization worker is calling.',
        'This method is firewalled. Transaction must originate from an organization worker.',
      );
    });
  });

  contract('Positive Paths', async (accounts) => {
    const accountProvider = new AccountProvider(accounts);

    it('Allows a call from a worker.', async () => {
      const {
        organization,
        organizationWorker,
      } = await Utils.createOrganization(accountProvider);

      const firewalledRuleImplementation = await FirewalledRuleImplementation.new(
        organization.address,
      );
      const firewalledRuleCaller = await FirewalledRuleCaller.new(
        firewalledRuleImplementation.address,
      );

      await firewalledRuleCaller.callFirewalledFn({ from: organizationWorker });
    });

    it('Allows a call from anyone after the firewall is disabled.', async () => {
      const {
        organization,
        organizationOwner,
      } = await Utils.createOrganization(accountProvider);

      const firewalledRuleImplementation = await FirewalledRuleImplementation.new(
        organization.address,
      );
      await firewalledRuleImplementation.disableFirewall({ from: organizationOwner });

      const firewalledRuleCaller = await FirewalledRuleCaller.new(
        firewalledRuleImplementation.address,
      );
      await firewalledRuleCaller.callFirewalledFn({ from: accountProvider.get() });
    });
  });
});
