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

contract('SafeMath::mod', async () => {
  contract('Correct Cases', async () => {
    it('Checks correctness when dividend is smaller than divisor.', async () => {
      const SafeMath = await SafeMathLibraryDouble.new();

      const a = new BN(284);
      const b = new BN(5678);

      const result = await SafeMath.mod.call(a, b);

      assert(result.eq(a.mod(b)));
    });

    it('Check correctness when dividend is equal to divisor.', async () => {
      const SafeMath = await SafeMathLibraryDouble.new();

      const a = new BN(5678);
      const b = new BN(5678);

      const result = await SafeMath.mod.call(a, b);

      assert(result.eq(a.mod(b)));
    });

    it('Checks correctness when dividend is larger than divisor.', async () => {
      const SafeMath = await SafeMathLibraryDouble.new();

      const a = new BN(7000);
      const b = new BN(5678);

      const result = await SafeMath.mod.call(a, b);

      assert(result.eq(a.mod(b)));
    });

    it('Checks correctness when dividend is a multiple of divisor.', async () => {
      const SafeMath = await SafeMathLibraryDouble.new();

      const a = new BN(17034); // 17034 == 5678 * 3
      const b = new BN(5678);

      const result = await SafeMath.mod.call(a, b);

      assert(result.eq(a.mod(b)));
    });
  });

  it('Checks that modulus reverts on zero division.', async () => {
    const SafeMath = await SafeMathLibraryDouble.new();

    const a = new BN(5678);
    const b = new BN(0);

    await utils.expectRevert(SafeMath.mod(a, b));
  });
});
