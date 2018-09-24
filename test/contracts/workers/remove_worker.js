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
// Test: remove_workers.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const workersUtils = require('./workers_utils.js'),
  Workers = artifacts.require('./Workers.sol'),
  web3 = require('../../test_lib/web3');

///
/// Test stories
///
/// fails to remove worker if sender is not opsAddress
/// fails to remove worker if worker was not set
/// pass to remove worker

module.exports.perform = (accounts) => {
  const opsAddress = accounts[1],
    worker1Address = accounts[2],
    worker2Address = accounts[3],
    worker3Address = accounts[4],
    height1 = new workersUtils.bigNumber(500),
    height2 = new workersUtils.bigNumber(1000);

  var workers = null,
    deactivationHeight = null;

  before(async () => {
    workers = await Workers.new();
    assert.ok(await workers.setOpsAddress(opsAddress));

    // set worker 1
    let blockNumber = await web3.eth.getBlockNumber();
    deactivationHeight = blockNumber + height1.toNumber();
    await workers.setWorker(worker1Address, deactivationHeight, { from: opsAddress });
    blockNumber = await web3.eth.getBlockNumber();
    // set worker 2
    deactivationHeight = blockNumber + height2.toNumber();
    await workers.setWorker(worker2Address, deactivationHeight, { from: opsAddress });
  });

  it('fails to remove worker if sender is not opsAddress', async () => {
    await workersUtils.utils.expectThrow(workers.removeWorker.call(worker1Address, { from: accounts[5] }));
  });

  it('fails to remove worker if worker was not set', async () => {
    assert.equal(await workers.removeWorker.call(worker3Address, { from: opsAddress }), false);
    response = await workers.removeWorker(worker3Address, { from: opsAddress });
    assert.equal(await workers.isWorker.call(worker3Address), false);
    workersUtils.checkWorkerRemovedEvent(response.logs[0], worker3Address, false);
    workersUtils.utils.logResponse(response, 'Workers.removeWorker (never set)');
  });

  it('pass to remove worker', async () => {
    assert.equal(await workers.removeWorker.call(worker1Address, { from: opsAddress }), true);
    response = await workers.removeWorker(worker1Address, { from: opsAddress });
    assert.equal(await workers.isWorker.call(worker1Address), false);
    workersUtils.checkWorkerRemovedEvent(response.logs[0], worker1Address, true);
    workersUtils.utils.logResponse(response, 'Workers.removeWorker (w1)');

    assert.equal(await workers.removeWorker.call(worker2Address, { from: opsAddress }), true);
    response = await workers.removeWorker(worker2Address, { from: opsAddress });
    assert.equal(await workers.isWorker.call(worker2Address), false);
    workersUtils.checkWorkerRemovedEvent(response.logs[0], worker2Address, true);
    workersUtils.utils.logResponse(response, 'Workers.removeWorker (w2)');

    assert.equal(await workers.removeWorker.call(worker2Address, { from: opsAddress }), false);
    response = await workers.removeWorker(worker2Address, { from: opsAddress });
    assert.equal(await workers.isWorker.call(worker2Address), false);
    workersUtils.checkWorkerRemovedEvent(response.logs[0], worker2Address, false);
    workersUtils.utils.logResponse(response, 'Workers.removeWorker (w1 again)');
  });
};
