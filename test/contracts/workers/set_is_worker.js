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
// Test: set_is_worker.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const workersUtils = require('./workers_utils.js'),
  Workers = artifacts.require('./Workers.sol'),
  web3 = require('../../lib/web3') ;

///
/// Test stories
///
/// fails to set worker if worker address is 0
/// fails to set worker if _deactivationHeight is equal to current block number
/// fails to set worker if _deactivationHeight is less than current block number
/// fails to set worker if sender is not opsAddress
/// pass to set worker if worker is not already set
/// pass to set worker if worker was already set
/// pass to set worker at higher deactivation height if worker was already set to a lower deactivation height
/// pass to set worker at lower deactivation height if worker was already set to a higher deactivation height
/// validate expiry

module.exports.perform = (accounts) => {
  const opsAddress = accounts[1],
    worker1Address = accounts[2],
    worker2Address = accounts[3],
    worker3Address = accounts[4],
    height1 = new workersUtils.bigNumber(500),
    height2 = new workersUtils.bigNumber(1000)
  ;

  var workers = null,
    deactivationHeight = null
  ;

  before(async () => {

    workers = await Workers.new();
    assert.ok(await workers.setOpsAddress(opsAddress));

  });


  it('fails to set worker if worker address is 0', async () => {

    await workersUtils.utils.expectThrow(workers.setWorker.call(0, height1, {from: opsAddress}));

  });


  it('fails to set worker if deactivation height is equal to current block number', async () => {

    let blockNumber = await web3.eth.getBlockNumber();
    deactivationHeight = blockNumber + 1;
    // calling this will not throw any execption
    assert.ok(await workers.setWorker.call(worker1Address, deactivationHeight, {from: opsAddress}));

    // Executing this will throw exception
    await workersUtils.utils.expectThrow(workers.setWorker(worker1Address, blockNumber, {from: opsAddress}));

    // Verify if the worker1 is not active
    assert.equal(await workers.isWorker.call(worker1Address), false);

  });


  it('fails to set worker if deactivation height is less than current block number', async () => {

    let blockNumber = await web3.eth.getBlockNumber();
    await workersUtils.utils.expectThrow(workers.setWorker.call(worker1Address, blockNumber - 1, {from: opsAddress}));
    await workersUtils.utils.expectThrow(workers.setWorker(worker1Address, blockNumber - 1, {from: opsAddress}));
    // Verify if the worker1 is not active
    assert.equal(await workers.isWorker.call(worker1Address), false);

  });


  it('pass to set worker if deactivation height is equal to current block number + 1', async () => {

    let blockNumber = await web3.eth.getBlockNumber();
    deactivationHeight = blockNumber + 2; //It is incremented by 2 becoz :- a. block.number returns the pending block number (which is 1 more than the latest block number, which is what is returned by getBlockNumber) and (b) the conditions of the setWorker function that we are testing here.
    assert.ok(await workers.setWorker.call(worker1Address, deactivationHeight, {from: opsAddress}));
    response = await workers.setWorker(worker1Address, deactivationHeight, {from: opsAddress});
    assert.equal(await workers.isWorker.call(worker1Address), true);
    workersUtils.checkWorkerSetEvent(response.logs[0], deactivationHeight, 1); // Changed to equate the value of remainingheight.
    workersUtils.utils.logResponse(response, 'Workers.setWorker: w1, blockNumber + 1');

  });


  it('fails to set worker if sender is not opsAddress', async () => {

    let blockNumber = await web3.eth.getBlockNumber();
    deactivationHeight = blockNumber + height1.toNumber();
    await workersUtils.utils.expectThrow(workers.setWorker.call(worker1Address, deactivationHeight, {from: accounts[5]}));

  });


  it('pass to set worker if worker is not already set', async () => {

    let blockNumber = await web3.eth.getBlockNumber();
    deactivationHeight = blockNumber + height1.toNumber();
    assert.ok(await workers.setWorker.call(worker1Address, deactivationHeight, {from: opsAddress}));
    response = await workers.setWorker(worker1Address, deactivationHeight, {from: opsAddress});
    assert.equal(await workers.isWorker.call(worker1Address), true);
    workersUtils.checkWorkerSetEvent(response.logs[0], deactivationHeight, height1.toNumber() - 1);
    workersUtils.utils.logResponse(response, 'Workers.setWorker: w1, ' + deactivationHeight);
    blockNumber = await web3.eth.getBlockNumber();
    deactivationHeight = blockNumber + height2.toNumber();
    assert.ok(await workers.setWorker.call(worker2Address, deactivationHeight, {from: opsAddress}));
    response = await workers.setWorker(worker2Address, deactivationHeight, {from: opsAddress});
    assert.equal(await workers.isWorker.call(worker2Address), true);
    workersUtils.checkWorkerSetEvent(response.logs[0], deactivationHeight, height2.toNumber() - 1);
    workersUtils.utils.logResponse(response, 'Workers.setWorker: w2, ' + deactivationHeight);

  });


  it('pass to set worker if worker was already set', async () => {

    let blockNumber = await web3.eth.getBlockNumber();
    deactivationHeight = blockNumber + height2.toNumber();
    assert.ok(await workers.setWorker.call(worker1Address, deactivationHeight, {from: opsAddress}));
    response = await workers.setWorker(worker1Address, deactivationHeight, {from: opsAddress});
    assert.equal(await workers.isWorker.call(worker1Address), true);
    workersUtils.checkWorkerSetEvent(response.logs[0], deactivationHeight, height2.toNumber() - 1);
    workersUtils.utils.logResponse(response, 'Workers.setWorker: w1, ' + deactivationHeight);

  });


  it('pass to set worker at lower deactivation height if worker was already set to a higher deactivation height', async () => {

    // update worker with lower deactivation height
    let blockNumber = await web3.eth.getBlockNumber();
    deactivationHeight = blockNumber + height1.toNumber();
    assert.ok(await workers.setWorker.call(worker1Address, deactivationHeight, {from: opsAddress}));
    response = await workers.setWorker(worker1Address, deactivationHeight, {from: opsAddress});
    assert.equal(await workers.isWorker.call(worker1Address), true);
    workersUtils.checkWorkerSetEvent(response.logs[0], deactivationHeight, height1.toNumber() - 1);
    workersUtils.utils.logResponse(response, 'Workers.setWorker: w1, ' + deactivationHeight);

  });


  it('validate expiry', async () => {

    // set a worker with expiration height of 30
    var height = 30;
    let blockNumber = await web3.eth.getBlockNumber();
    deactivationHeight = blockNumber + height + 1; //Incremented by 1 so that require(_deactivationHeight >= block.number) condition in the contract doesnt fail.It fails due to change in behavior of when web's call is used on contract method.
    assert.ok(await workers.setWorker.call(worker3Address, deactivationHeight, {from: opsAddress}));
    response = await workers.setWorker(worker3Address, deactivationHeight, {from: opsAddress});
    assert.equal(await workers.isWorker.call(worker3Address), true);
    for (var i = height - 1; i >= 0; i--) {
      // Perform random transaction to increase block number. In this case using removeWorker for worker1Address
      response = await workers.removeWorker(worker1Address, {from: opsAddress});
      assert.equal(await workers.isWorker.call(worker3Address), i > 0);
    }
    //Do one more time to confirm.
    response = await workers.removeWorker(worker1Address, {from: opsAddress});
    assert.equal(await workers.isWorker.call(worker3Address), false);

  });
}


