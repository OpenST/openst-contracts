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

const FirewalledRule = artifacts.require('FirewalledRule');

contract('FirewalledRule::constructor', async () => {
  contract('Storage', async (accounts) => {
    const accountProvider = new AccountProvider(accounts);

    it('Checks that the firewall is enabled by default.', async () => {
      const { organization } = await Utils.createOrganization(accountProvider);
      const firewalledRule = await FirewalledRule.new(organization.address);

      assert.strictEqual(
        (await firewalledRule.firewallEnabled.call()),
        true,
      );
    });
  });
});
