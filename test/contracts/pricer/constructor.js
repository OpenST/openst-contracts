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

const pricer_utils   = require('./pricer_utils.js'),
      Pricer         = artifacts.require('./Pricer.sol'),
      EIP20TokenMock = artifacts.require('./EIP20TokenMock.sol');

///
/// Test stories
/// 
/// fails to deploy if brandedToken is null
/// fails to deploy if baseCurrency is empty
/// successfully deploys

module.exports.perform = () => {
  var token    = null;
  var response = null;

  before(async () => {
    token = await EIP20TokenMock.new(1, pricer_utils.currencies.ost, 'name', 18);
  });

  it('fails to deploy if brandedToken is null', async () => {
    await pricer_utils.utils.expectThrow(Pricer.new(0, pricer_utils.currencies.ost));
  });

  it('fails to deploy if baseCurrency is empty', async () => {
    await pricer_utils.utils.expectThrow(Pricer.new(token.address, ''));
  });

  it('successfully deploys', async () => {
    response = await Pricer.new(token.address, pricer_utils.currencies.ost);
    pricer_utils.utils.logTransaction(response.transactionHash, 'Pricer.constructor');
  });
}
