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

contract('SafeMath::div', async () => {
    it('Checks that that division works correctly.', async () => {
        const SafeMath = await SafeMathTest.new();

        const a = new BN(5678);
        const b = new BN(5678);

        const result = await SafeMath.div.call(a, b);

        assert(result.eq(a.div(b)));
    });

    it('Checks that division throws on zero division.', async () => {
        const SafeMath = await SafeMathTest.new();

        const a = new BN(5678);
        const b = new BN(0);

        await utils.expectRevert(SafeMath.div(a, b));
    });
});
