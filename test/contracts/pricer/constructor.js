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

const pricerUtils = require('./pricer_utils.js'),
  Pricer = artifacts.require('./Pricer.sol'),
  EIP20TokenMock = artifacts.require('./EIP20TokenMock.sol');

///
/// Test stories
///
/// fails to deploy if brandedToken is null
/// fails to deploy if baseCurrency is empty
/// successfully deploys

module.exports.perform = () => {
  var token = null,
    response = null;

  before(async () => {
    token = await EIP20TokenMock.new(1, 0, pricerUtils.currencies.ost, 'name', 18);
  });

  it('fails to deploy if brandedToken is null', async () => {
    await pricerUtils.utils.expectThrow(Pricer.new(0, pricerUtils.currencies.ost));
  });

  it('fails to deploy if baseCurrency is empty', async () => {
    await pricerUtils.utils.expectThrow(Pricer.new(token.address, ''));
  });

  it('successfully deploys', async () => {
    response = await Pricer.new(token.address, pricerUtils.currencies.ost);
    pricerUtils.utils.logTransaction(response.transactionHash, 'Pricer.constructor');
  });
};
