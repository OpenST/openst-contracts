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
  { AccountProvider } = require('../test_lib/utils.js');

const Organization = artifacts.require('Organization'),
  Organized = artifacts.require('Organized');

contract('Organized::constructor', async (accounts) => {

  describe('Negative Tests', async () => {

    const accountProvider = new AccountProvider(accounts),
      owner = accountProvider.get();
    let organization = null;

    beforeEach(async function () {
      organization = await Organization.new({ from: owner });
    });

    it('Reverts when organization address is null.', async () => {

      await Utils.expectRevert(
        Organized.new(Utils.NULL_ADDRESS, { from: owner }),
        'Should revert as organization contract address is null.',
        'Organization contract address is null.',
      );

    });

  });

  describe('Storage Tests', async () => {

    const accountProvider = new AccountProvider(accounts),
      owner = accountProvider.get();
    let organization = null,
      organized = null;

    beforeEach(async function () {
      organization = await Organization.new({ from: owner });
      organized = await Organized.new(organization.address, { from: owner });
    });

    it('Checks that organization address is set correctly.', async () => {
      assert.equal(
        await organized.organization.call(),
        organization.address
      );
    });

  });

});
