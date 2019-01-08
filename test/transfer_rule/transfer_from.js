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

const { AccountProvider } = require('../test_lib/utils.js');

const TransferRule = artifacts.require('TransferRule');
const TokenRulesSpy = artifacts.require('TokenRulesSpy');

contract('TransferRule::transferFrom', async (accounts) => {
    const accountProvider = new AccountProvider(accounts);

    it('Checks that TokenRules::executeTransfers() is called. '
        + 'with appropriate args.', async () => {
        const expectedFromAddress = accountProvider.get();

        const expectedToAddress = accountProvider.get();
        const expectedTransfersToLength = 1;

        const expectedAmount = 10;
        const expectedTransfersAmountLength = 1;

        const tokenRules = await TokenRulesSpy.new();

        const transferRule = await TransferRule.new(tokenRules.address);

        await transferRule.transferFrom(
            expectedFromAddress, expectedToAddress, expectedAmount,
        );

        const actualFromAddress = await tokenRules.recordedFrom.call();

        const actualToAddress = await tokenRules.recordedTransfersTo.call(0);
        const actualTransfersToLength = await tokenRules.recordedTransfersToLength.call();

        const actualAmount = await tokenRules.recordedTransfersAmount.call(0);
        const actualTransfersAmountLength = await tokenRules.recordedTransfersAmountLength.call();

        assert.strictEqual(
            actualFromAddress,
            expectedFromAddress,
        );

        assert.isOk(
            actualTransfersToLength.eqn(expectedTransfersToLength),
        );

        assert.strictEqual(
            actualToAddress,
            expectedToAddress,
        );

        assert.isOk(
            actualTransfersAmountLength.eqn(expectedTransfersAmountLength),
        );

        assert.isOk(
            actualAmount.eqn(expectedAmount),
        );
    });
});
