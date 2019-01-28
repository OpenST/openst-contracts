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

const BN = require('bn.js');
const utils = require('../test_lib/utils');

const SafeMathTest = artifacts.require('SafeMathTest');

contract('SafeMath::sub', async () => {
    it('Checks correctness of substract.', async () => {
        const SafeMath = await SafeMathTest.new();

        const a = new BN(5678);
        const b = new BN(1234);

        const result = await SafeMath.sub.call(a, b);

        assert(result.eq(a.sub(b)));
    });

    it('Checks that throws if subtraction result is negative.', async () => {
        const SafeMath = await SafeMathTest.new();

        const a = new BN(1234);
        const b = new BN(5678);

        await utils.expectRevert(SafeMath.sub.call(a, b));
    });
});
