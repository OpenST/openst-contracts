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
//
// ----------------------------------------------------------------------------
// Test: remove.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const web3 = require('../../lib/web3'),
	BigNumber = require('bignumber.js'),
	Hasher = artifacts.require('./Hasher.sol'),
	brandedToken = artifacts.require('./BrandedToken.sol');
	tokenHolder = artifacts.require('./TokenHolder.sol');

module.exports.perform = (accounts) => {
	const openSTProtocol = accounts[0],
		conversionRateDecimals = 5,
		conversionRate = new BigNumber(10 * 10 ** conversionRateDecimals),
		chainIDValue = 3,
		chainIDUtility = 1410,
		symbol = 'symbol',
		name = 'name',
		organizationAddress = accounts[1],
		token = null;
	let tokenHolderInstance,newAccount,blockNumber;
	beforeEach(async () => {
		
		const hasher = await Hasher.new();
		const tokenRules = accounts[0];
		const valueToken = accounts[1];
		brandedTokenInstance = await brandedToken.new(
			valueToken,
			symbol,
			name,
			18,
			chainIDValue,
			chainIDUtility,
			conversionRate,
			conversionRateDecimals,
			organizationAddress,
			{ from: openSTProtocol }
		);
	
	});
	
	it('should deploy token holder with two requirements', async () => {
		
		tokenHolderInstance = await tokenHolder.new(brandedTokenInstance.address, accounts[3], accounts[1], 2, [accounts[7],accounts[6]]);
		
		assert.equal(await tokenHolderInstance.isWallet(accounts[6]),true);
		assert.equal(await tokenHolderInstance.isWallet(accounts[4]),false);
	});
	
	it('should authorizeSession for an ephemeral key with two requirements ', async () => {
		
		newAccount = web3.eth.accounts.create(web3.utils.randomHex(32));
		let transactionId = await tokenHolderInstance.authorizeSession.call(newAccount.address, 100, await web3.eth.getBlockNumber() + 50,{from: accounts[7]});
	
		blockNumber = await web3.eth.getBlockNumber();
		
		// Transaction proposed and requirement achieved is 1.
		await tokenHolderInstance.authorizeSession(newAccount.address, 100, blockNumber + 50,{from: accounts[7]});
		assert.equal(await tokenHolderInstance.isRequirementAchieved(transactionId),false);
		
		// Transaction proposed and final requirement will be achieved.
		await tokenHolderInstance.authorizeSession(newAccount.address, 100, blockNumber + 50,{from: accounts[6]});
		assert.equal(await tokenHolderInstance.isRequirementAchieved(transactionId),true);
	});
	
	it('should verify ephemeral keys ', async () => {
		
		let ephemeralKeyData = await tokenHolderInstance.ephemeralKeys(newAccount.address);
		
		// checking whether ephemeral key is present
		assert(ephemeralKeyData[0].toNumber() > 0);
		assert.isTrue(ephemeralKeyData[0].toNumber() > 0);
		
		
	});
	
	
};
