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
// Test: base.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const workersUtils = require('./workers_utils.js'),
      setIsWorker     = require('./set_is_worker.js');
      removeWorker  = require('./remove_worker.js');
      remove        = require('./remove.js')
      ;
      
contract('Workers', function(accounts) {
  describe('Set/IsWorker', async () => setIsWorker.perform(accounts));
  describe('RemoveWorker', async () => removeWorker.perform(accounts));
  describe('Remove', async () => remove.perform(accounts));
  
  after(async () => {
    workersUtils.utils.printGasStatistics();
    workersUtils.utils.clearReceipts();
  });
});
