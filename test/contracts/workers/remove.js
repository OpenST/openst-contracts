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

const workersUtils = require('./workers_utils.js'),
  Workers = artifacts.require('./Workers.sol'),
  Web3 = require('web3'),
  web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
;

///
/// Test stories
///
/// fails to remove when sender is neither opsAddress nor adminAddress
/// successfully removes when sender is opsAddress
/// successfully removes when sender is adminAddress

module.exports.perform = (accounts) => {
  const opsAddress = accounts[1],
    adminAddress = accounts[2]
  ;

  var workers = null,
    response = null
  ;

  beforeEach(async () => {

    workers = await Workers.new();
    assert.ok(await workers.setOpsAddress(opsAddress));
    assert.ok(await workers.setAdminAddress(adminAddress));

  });

  it('fails to remove when sender is neither opsAddress nor adminAddress', async () => {

    await workersUtils.utils.expectThrow(workers.remove.call({from: accounts[3]}));

  });

  it('successfully removes when sender is opsAddress', async () => {

    // call remove
    assert.ok(await workers.remove.call({from: opsAddress}));
    response = await workers.remove({from: opsAddress});
    workersUtils.utils.logResponse(response, 'Workers.remove (ops)');

    // check if contract is removed
    let code = await web3.eth.getCode(workers.address);
    assert.equal(code, 0x0);

  });

  it('successfully removes when sender is adminAddress', async () => {

    // call remove from admin address
    assert.ok(await workers.remove.call({from: adminAddress}));
    response = await workers.remove({from: adminAddress});
    workersUtils.utils.logResponse(response, 'Workers.remove (admin)');

    // check if contract is removed
    let code = await web3.eth.getCode(workers.address);
    assert.equal(code, 0x0);

  });
}


