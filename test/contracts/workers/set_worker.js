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
// Test: set_workers.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const workers_utils = require('./workers_utils.js');
const Workers       = artifacts.require('./Workers.sol');

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

module.exports.perform = (accounts) => {
  const opsAddress            = accounts[1],
        worker1Address        =  accounts[2],
        worker2Address        =  accounts[3],
        height1               = new workers_utils.bigNumber(500),
        height2               = new workers_utils.bigNumber(1000);
        
  before(async () => {

    workers = await Workers.new();
    assert.ok(await workers.setOpsAddress(opsAddress));    

  });


  it('fails to set worker if worker address is 0', async () => {

    await workers_utils.utils.expectThrow(workers.setWorker.call(0, height1, { from: opsAddress }));    

  });


  //it('pass to set worker if _deactivationHeight is equal to current block number', async () => {    

  //  await workers_utils.utils.expectThrow(workers.setWorker.call(worker1Address, web3.eth.blockNumber, { from: opsAddress }));    

  //});


  it('fails to set worker if _deactivationHeight is less than current block number', async () => {    

    await workers_utils.utils.expectThrow(workers.setWorker.call(worker1Address, web3.eth.blockNumber-1, { from: opsAddress }));    

  });


  it('fails to set worker if sender is not opsAddress', async () => {

    deactivationHeight = web3.eth.blockNumber + height1.toNumber();    
    await workers_utils.utils.expectThrow(workers.setWorker.call(worker1Address, deactivationHeight, { from: accounts[5] }));    

  });


  it('pass to set worker if worker is not already set', async () => {
    
    deactivationHeight = web3.eth.blockNumber + height1.toNumber();
    assert.ok(await workers.setWorker.call(worker1Address, deactivationHeight, { from: opsAddress }));
    response = await workers.setWorker(worker1Address, deactivationHeight, { from: opsAddress });
    assert.equal(await workers.isWorker.call(worker1Address), true);
    workers_utils.checkWorkerSetEvent(response.logs[0], deactivationHeight, height1.toNumber()-1);
    
    deactivationHeight = web3.eth.blockNumber + height2.toNumber();
    assert.ok(await workers.setWorker.call(worker2Address, deactivationHeight, { from: opsAddress }));
    response = await workers.setWorker(worker2Address, deactivationHeight, { from: opsAddress });
    assert.equal(await workers.isWorker.call(worker2Address), true);
    workers_utils.checkWorkerSetEvent(response.logs[0], deactivationHeight, height2.toNumber()-1);
    workers_utils.utils.logResponse(response, 'Worker.setWorker');

  });


  it('pass to set worker if worker was already set', async () => {
    
    deactivationHeight = web3.eth.blockNumber + height2.toNumber();
    assert.ok(await workers.setWorker.call(worker1Address, deactivationHeight, { from: opsAddress }));
    response = await workers.setWorker(worker1Address, deactivationHeight, { from: opsAddress });
    assert.equal(await workers.isWorker.call(worker1Address), true);
    workers_utils.checkWorkerSetEvent(response.logs[0], deactivationHeight, height2.toNumber()-1);
    workers_utils.utils.logResponse(response, 'Worker.setWorker(update)');

  });


  it('pass to set worker at lower deactivation height if worker was already set to a higher deactivation height', async () => {
       
    // remove existing workers
    assert.equal(await workers.removeWorker.call(worker1Address, { from: opsAddress }), true); 
    response = await workers.removeWorker(worker1Address, { from: opsAddress }); 
    assert.equal(await workers.isWorker.call(worker1Address), false);
    workers_utils.checkWorkerRemovedEvent(response.logs[0], worker1Address, true);          

    // set worker with higher deactivation height
    deactivationHeight = web3.eth.blockNumber + height2.toNumber();
    assert.ok(await workers.setWorker.call(worker1Address, deactivationHeight, { from: opsAddress }));
    response = await workers.setWorker(worker1Address, deactivationHeight, { from: opsAddress });
    assert.equal(await workers.isWorker.call(worker1Address), true);
    workers_utils.checkWorkerSetEvent(response.logs[0], deactivationHeight, height2.toNumber()-1);

    // update worker with lower deactivation height
    deactivationHeight = web3.eth.blockNumber + height1.toNumber();
    assert.ok(await workers.setWorker.call(worker1Address, deactivationHeight, { from: opsAddress }));
    response = await workers.setWorker(worker1Address, deactivationHeight, { from: opsAddress });
    assert.equal(await workers.isWorker.call(worker1Address), true);
    workers_utils.checkWorkerSetEvent(response.logs[0], deactivationHeight, height1.toNumber()-1);

  });

}


