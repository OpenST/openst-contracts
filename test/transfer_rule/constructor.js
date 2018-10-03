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

const TokenRules = artifacts.require('TokenRules');

const TransferRule = artifacts.require('TransferRule');
const EIP20TokenMock = artifacts.require('EIP20TokenMock');
const TokenRulesPassingGlobalConstraint = artifacts.require('TokenRulesPassingGlobalConstraint');
const { AccountProvider } = require('../test_lib/utils.js');

contract('TransferRule::constructor', async () => {
	contract('Negative testing for input parameters:', async (accounts) => {
		
		it('fails when tokenrules address is null.', async () => {
			const accountProvider = new AccountProvider(accounts);
			const organization = accountProvider.get();
			const constraint = await TokenRulesPassingGlobalConstraint.new();
			const fromUser = accountProvider.get();
			const token = await EIP20TokenMock.new(
				1, 1, 'OST', 'Open Simple Token', 1
			);
			
			token.setBalance(fromUser, 100);
			
			const tokenRulesInstance = await TokenRules.new(organization, token.address);
			
			await tokenRulesInstance.allowTransfers({from: fromUser});
			await tokenRulesInstance.addGlobalConstraint(constraint.address, {from: organization});
			
			await utils.expectRevert(TransferRule.new(''),'Should revert as token rule address is null',
				'Token rules address is null.');
			
		});
		
		contract('Positive test cases', async (accounts) => {
			it('Validates that passed arguments are set correctly.', async () => {
				const accountProvider = new AccountProvider(accounts);
				const organization = accountProvider.get();
				const constraint = await TokenRulesPassingGlobalConstraint.new();
				const ruleName = 'A';
				const fromUser = accountProvider.get();
				const token = await EIP20TokenMock.new(
					1, 1, 'OST', 'Open Simple Token', 1,
				);
				token.setBalance(fromUser, 100);
				
				const tokenRulesInstance = await TokenRules.new(organization, token.address);
				
				await tokenRulesInstance.allowTransfers({from: fromUser});
				await tokenRulesInstance.addGlobalConstraint(constraint.address, {from: organization});
				
				const transferRuleInstance = await TransferRule.new(tokenRulesInstance.address);
				
			});
		});
	});
});