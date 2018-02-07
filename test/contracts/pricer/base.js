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
// Test: base.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const pricer_utils                               = require('./pricer_utils.js'),
      constructor                                = require('./constructor.js'),
      properties                                 = require('./properties.js'),
      set_price_oracle                           = require('./set_price_oracle.js'),
      unset_price_oracle                         = require('./unset_price_oracle.js'),
      set_accepted_margin                        = require('./set_accepted_margin.js'),
      get_price_point                            = require('./get_price_point.js'),
      get_price_point_and_calculated_amounts     = require('./get_price_point_and_calculated_amounts.js'),
      pay                                        = require('./pay.js');

contract('Pricer', function(accounts) {
  // TODO: include PricerMock that wraps getBTAmountFromCurrencyValue and isPricePointInRange
  //  by public functions to enable testing OR make them public functions
  describe('Constructor', async () => constructor.perform());
  describe('Properties', async () => properties.perform(accounts));
  describe('SetPriceOracle', async () => set_price_oracle.perform(accounts));
  describe('UnsetPriceOracle', async () => unset_price_oracle.perform(accounts));
  describe('SetAcceptedMargin', async () => set_accepted_margin.perform(accounts));
  describe('GetPricePoint', async () => get_price_point.perform(accounts));
  describe('GetPricePointAndCalculatedAmounts', async () => get_price_point_and_calculated_amounts.perform(accounts));
  describe('Pay', async () => pay.perform(accounts));
  after(async () => {
    pricer_utils.utils.printGasStatistics();
    pricer_utils.utils.clearReceipts();
  });
});
