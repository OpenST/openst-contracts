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
// Test: pricer_utils.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const Utils = require('../../lib/utils.js'),
  BigNumber = require('bignumber.js'),
  Workers = artifacts.require('./Workers.sol');

/// @dev Export common requires
module.exports.utils = Utils;
module.exports.bigNumber = BigNumber;

function checkWorkerSetEvent(event, deactivationHeight, remainingHeight) {
  assert.equal(event.event, 'WorkerSet');
  assert.equal(event.args._deactivationHeight.toNumber(), deactivationHeight);
  assert.equal(event.args._remainingHeight.toNumber(), remainingHeight);
}
module.exports.checkWorkerSetEvent = checkWorkerSetEvent;

function checkWorkerRemovedEvent(event, worker, existed) {
  assert.equal(event.event, 'WorkerRemoved');
  assert.equal(event.args._worker, worker);
  assert.equal(event.args._existed, existed);
}
module.exports.checkWorkerRemovedEvent = checkWorkerRemovedEvent;
