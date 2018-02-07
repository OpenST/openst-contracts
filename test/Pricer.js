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
// Test: Pricer.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const Pricer_utils               = require('./Pricer_utils.js'),
      Pricer_constructor         = require('./Pricer_constructor.js'),
      Pricer_properties          = require('./Pricer_properties.js'),
      Pricer_set_price_oracle    = require('./Pricer_set_price_oracle.js'),
      Pricer_unset_price_oracle  = require('./Pricer_unset_price_oracle.js'),
      Pricer_set_accepted_margin = require('./Pricer_set_accepted_margin.js');

contract('Pricer', function(accounts) {

  describe('Constructor', async () => Pricer_constructor.perform());
  describe('Properties', async () => Pricer_properties.perform(accounts));
  describe('SetPriceOracle', async () => Pricer_set_price_oracle.perform(accounts));
  describe('UnsetPriceOracle', async () => Pricer_unset_price_oracle.perform(accounts));
  describe('SetAcceptedMargin', async () => Pricer_set_accepted_margin.perform(accounts));
  after(async () => {
    Pricer_utils.utils.printGasStatistics();
    Pricer_utils.utils.clearReceipts();
  });
});
