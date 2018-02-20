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
// Test: constructor.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const airdropUtils  = require('./airdrop_utils.js'),
      Airdrop        = artifacts.require('./Airdrop.sol'),
      EIP20TokenMock = artifacts.require('./EIP20TokenMock.sol')
      ;

///
/// Test stories
/// 
/// fails to deploy if workers is null
/// fails to deploy if airdropBudgetHolder is null
/// successfully deploys

module.exports.perform = (accounts) => {
  const workers             = accounts[2],
        airdropBudgetHolder = accounts[3]
        ;

  var token = null;

  before(async () => {
    token = await EIP20TokenMock.new(1, airdropUtils.currencies.ost, 'name', 18);
  });

  it('fails to deploy if workers is null', async () => {
    await airdropUtils.utils.expectThrow(Airdrop.new(token.address, airdropUtils.currencies.ost, 0, airdropBudgetHolder));
  });

  it('fails to deploy if airdropBudgetHolder is null', async () => {
    await airdropUtils.utils.expectThrow(Airdrop.new(token.address, airdropUtils.currencies.ost, workers, 0));
  });

  it('successfully deploys', async () => {
    var airdrop = await Airdrop.new(token.address, airdropUtils.currencies.ost, workers, airdropBudgetHolder);
    assert.equal(await airdrop.workers.call(), workers);
    assert.equal(await airdrop.airdropBudgetHolder.call(), airdropBudgetHolder);
    airdropUtils.utils.logTransaction(airdrop.transactionHash, 'Airdrop.constructor');
  });
}