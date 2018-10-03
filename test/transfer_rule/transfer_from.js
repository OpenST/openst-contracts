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

const TokenRules = artifacts.require('TokenRules');
const TransferRule = artifacts.require('TransferRule');
const tokenRulesMock = artifacts.require('TokenRulesMock');

contract('TransferRule::transferFrom', async () => {
	contract('Negative tests for input parameters:', async (accounts) => {
		
		const accountProvider = new AccountProvider(accounts);
		
		it('Reverts when Token rules address is incorrect.', async () => {
			
			const fromUser = accountProvider.get();
			const toUser = accountProvider.get();
			const amount = 10;
			const incorrectTokenRulesAddress = accountProvider.get();
			
			const transferRuleInstance = await TransferRule.new(incorrectTokenRulesAddress);
			await utils.expectRevert(transferRuleInstance.transferFrom.call(fromUser, toUser, amount));
			
		});
		
	contract('Storage', async (accounts) => {
		
			const accountProvider = new AccountProvider(accounts);
			
			it('Validates successful transfer.', async () => {
				
				const fromUser = accountProvider.get();
				const toUser = accountProvider.get();
				const amount = 10;
				
				const tokenRulesMockInstance = await tokenRulesMock.new();
				
				const transferRuleInstance = await TransferRule.new(tokenRulesMockInstance.address);
				assert.equal(await transferRuleInstance.transferFrom.call(fromUser, toUser, amount), true, 'transferFrom method failed');
				await transferRuleInstance.transferFrom(fromUser, toUser, amount);
				
				assert.equal(await tokenRulesMockInstance.from.call(), fromUser,"From address not set correctly");
				assert.equal(await tokenRulesMockInstance.transferTo.call(0), toUser,"To address not set correctly");
				assert.equal(await tokenRulesMockInstance.transferAmount.call(0), amount,"Amount is not set correctly");
				
				
			});
		});
	});
});