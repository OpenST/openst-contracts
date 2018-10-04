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

const web3 = require('../test_lib/web3.js');
const utils = require('../test_lib/utils.js');
const { AccountProvider } = require('../test_lib/utils.js');

const TransferRule = artifacts.require('TransferRule');
const tokenRulesMock = artifacts.require('TokenRulesMock');


contract('TransferRule::constructor', async () => {
	contract('Negative tests for input parameters:', async (accounts) => {
		
		const accountProvider = new AccountProvider(accounts);
		
		it('fails when tokenrules address is null.', async () => {
			
			await utils.expectRevert(TransferRule.new(utils.NULL_ADDRESS),
				'Should revert as token rule address is null',
				'Token rules address is null.');
			
		});
		
		contract('Positive test cases', async (accounts) => {
			it('sucessfully initializes when passed arguments are set correctly.', async () => {
				
				const tokenRulesMockInstance = await tokenRulesMock.new();
				
				assert.ok(await TransferRule.new(tokenRulesMockInstance.address));
				
			});
		});
	});
});