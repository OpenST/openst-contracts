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
// Test: constructor.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const workers_utils   = require('./workers_utils.js'),
      Workers         = artifacts.require('./Workers.sol');
      
///
/// Test stories
/// 
/// successfully deploys

module.exports.perform = () => {
  it('successfully deploys', async () => {
    const response = await Workers.new();
    workers_utils.utils.logTransaction(response.transactionHash, 'Workers.constructor');
  });
}
