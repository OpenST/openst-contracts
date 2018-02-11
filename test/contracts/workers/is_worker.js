// Copyright 2017 OST.com Ltd.
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
// Test: is_workers.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const workers_utils = require('./workers_utils.js');
const Workers       = artifacts.require('./Workers.sol');

///
/// Test stories
///
/// returns false when worker was not set
/// returns true when worker was is set and not reached deactivationHeight
/// validate expiry

module.exports.perform = (accounts) => {
  const opsAddress          = accounts[1],
        worker1Address       =  accounts[2],
        worker2Address       =  accounts[3],
        worker3Address       =  accounts[4],
        height1  = new workers_utils.bigNumber(50),
        height2  = new workers_utils.bigNumber(40);
        
  before(async () => {
    workers = await Workers.new();
    assert.ok(await workers.setOpsAddress(opsAddress));    

    // set worker 1
    deactivationHeight = web3.eth.blockNumber + height1.toNumber();
    assert.ok(await workers.setWorker.call(worker1Address, deactivationHeight, { from: opsAddress }));
    response = await workers.setWorker(worker1Address, deactivationHeight, { from: opsAddress });
    assert.equal(await workers.isWorker.call(worker1Address), true);
    workers_utils.checkWorkerSetEvent(response.logs[0], deactivationHeight, height1.toNumber()-1);
    
    // set worker 2
    deactivationHeight = web3.eth.blockNumber + height2.toNumber();
    assert.ok(await workers.setWorker.call(worker2Address, deactivationHeight, { from: opsAddress }));
    response = await workers.setWorker(worker2Address, deactivationHeight, { from: opsAddress });
    assert.equal(await workers.isWorker.call(worker2Address), true);
    workers_utils.checkWorkerSetEvent(response.logs[0], deactivationHeight, height2.toNumber()-1);    

  });

  it('returns false when worker was not set', async () => {

    assert.equal(await workers.isWorker.call(worker3Address), false);

  });

  it('returns true when worker was is set and not reached deactivationHeight', async () => {

    assert.equal(await workers.isWorker.call(worker1Address), true);
    assert.equal(await workers.isWorker.call(worker2Address), true);

  });

  it('validate expiry', async () => {

    // set a worker with expiration height of 30
    height = 30;
    deactivationHeight = web3.eth.blockNumber + height;
    assert.ok(await workers.setWorker.call(worker3Address, deactivationHeight, { from: opsAddress }));
    response = await workers.setWorker(worker3Address, deactivationHeight, { from: opsAddress });
    assert.equal(await workers.isWorker.call(worker3Address), true);
    workers_utils.checkWorkerSetEvent(response.logs[0], deactivationHeight, height-1);        
    for (var i = height-1; i >= 0; i--) {
        // Perform random transaction to increase block number. In this case using removeWorker for worker1Address
        response = await workers.removeWorker(worker1Address, { from: opsAddress }); 
        assert.equal(await workers.isWorker.call(worker3Address), i>0);        
    }
    //Do one more time to confirm.
    response = await workers.removeWorker(worker1Address, { from: opsAddress }); 
    assert.equal(await workers.isWorker.call(worker3Address), false);

  });

}


