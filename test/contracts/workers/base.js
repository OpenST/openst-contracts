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

const workers_utils = require('./workers_utils.js'),
      constructor   = require('./constructor.js');
      setWorker     = require('./set_worker.js');
      removeWorker  = require('./remove_worker.js');
      isWorker      = require('./is_worker.js');
      remove        = require('./remove.js');
      
contract('Workers', function(accounts) {
  describe('Constructor', async () => constructor.perform());
  describe('setWorker', async () => setWorker.perform(accounts));
  describe('removeWorker', async () => removeWorker.perform(accounts));
  describe('isWorker', async () => isWorker.perform(accounts));
  describe('remove', async () => remove.perform(accounts));
  
  after(async () => {
    workers_utils.utils.printGasStatistics();
    workers_utils.utils.clearReceipts();
  });
});
