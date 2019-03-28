// Copyright 2019 OpenST Ltd.
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

'use strict';

const BN = require('bn.js');
const utils = require('../test_lib/utils');

const SafeMathLibraryDouble = artifacts.require('SafeMathLibraryDouble');

contract('SafeMath::mul', async () => {
  it('Checks that multiplication of non-zero args works correctly.', async () => {
    const SafeMath = await SafeMathLibraryDouble.new();

    const a = new BN(1234);
    const b = new BN(5678);

    const result = await SafeMath.mul.call(a, b);

    assert(result.eq(a.mul(b)));
  });

  it('Checks that multiplication of a zero arg works correctly.', async () => {
    const SafeMath = await SafeMathLibraryDouble.new();

    const a = new BN(0);
    const b = new BN(5678);

    const result = await SafeMath.mul.call(a, b);

    assert(result.eq(a.mul(b)));
  });

  it('Checks that multiplication throws on overflow.', async () => {
    const SafeMath = await SafeMathLibraryDouble.new();

    const a = utils.MAX_UINT256;
    const b = new BN(2);

    await utils.expectRevert(SafeMath.mul(a, b));
  });
});
