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
const rulesUtils = require('./utils');
const TokenRules = artifacts.require('TokenRules');
const TransferRule = artifacts.require('TransferRule');
const EIP20TokenMock = artifacts.require('EIP20TokenMock');
const TokenRulesPassingGlobalConstraint = artifacts.require('TokenRulesPassingGlobalConstraint');

contract('TransferRule::transferFrom', async () => {
	contract('Negative testing for input parameters:', async (accounts) => {
		
		// it('Token rules address is incorrect', async () => {
		//
		// 	const organization = accounts[0];
		// 	const constraint = await TokenRulesPassingGlobalConstraint.new();
		// 	const ruleName = 'A';
		// 	const entity1 = accounts[1];
		// 	const entity2 = accounts[4];
		// 	const ruleAbi = `Rule abi of ${ruleName}`;
		// 	const amount = 10;
		// 	const token = await EIP20TokenMock.new(
		// 		1, 1, 'OST', 'Open Simple Token', 1,
		// 	);
		// 	token.setBalance(entity1, 100);
		//
		// 	const tokenRulesInstance = await TokenRules.new(organization, token.address);
		//
		// 	await tokenRulesInstance.allowTransfers({from: entity1});
		// 	await tokenRulesInstance.addGlobalConstraint(constraint.address, {from: organization});
		//
		// 	const transferRuleInstance = await TransferRule.new(accounts[6]);
		// 	await tokenRulesInstance.registerRule(
		// 		ruleName,
		// 		transferRuleInstance.address,
		// 		ruleAbi,
		// 		{
		// 			from: organization
		// 		}
		// 	);
		//
		// 	utils.expectRevert(transferRuleInstance.transferFrom(entity1, entity2, amount));
		//
		// });
		
	contract('Positive test cases', async (accounts) => {
			it('Transfer done', async () => {
				const organization = accounts[0];
				const constraint = await TokenRulesPassingGlobalConstraint.new();
				const ruleName = 'A';
				const entity1 = accounts[1];
				const entity2 = accounts[4];
				const ruleAbi = `Rule abi of ${ruleName}`;
				const token = await EIP20TokenMock.new(
					1, 1, 'OST', 'Open Simple Token', 1,
				);
				const amount = 10;
				await token.setBalance(entity1, 100);
				
				const tokenRulesInstance = await TokenRules.new(organization, token.address);
				
				await tokenRulesInstance.allowTransfers({from: entity1});
				await tokenRulesInstance.addGlobalConstraint(constraint.address, {from: organization});
				
				const transferRuleInstance = await TransferRule.new(tokenRulesInstance.address);
				await tokenRulesInstance.registerRule(
					ruleName,
					transferRuleInstance.address,
					ruleAbi,
					{
						from: organization
					}
				);
				await token.approve(tokenRulesInstance.address, 20, {from:entity1});
				await transferRuleInstance.transferFrom(entity1, entity2, amount);
				assert.equal((await token.balanceOf(entity2)).toString(), amount,'Amount not transferred');
				
			});
		});
	});
});