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

        const tokenRules = await TokenRulesSpy.new(accountProvider.get());

        const transferRule = await TransferRule.new(tokenRules.address);

        await transferRule.transferFrom(
            expectedFromAddress, expectedToAddress, expectedAmount,
        );

        const transactionsLength = await tokenRules.transactionsLength.call();
        assert.isOk(
            transactionsLength.eqn(1),
        );

        assert.strictEqual(
            await tokenRules.fromTransaction.call(0),
            expectedFromAddress,
        );

        const transfersToTransaction = await tokenRules.transfersToTransaction.call(0);
        assert.strictEqual(
            transfersToTransaction.length,
            expectedTransfersToLength,
        );
        assert.strictEqual(
            transfersToTransaction[0],
            expectedToAddress,
        );

        const transfersAmountTransaction = await tokenRules.transfersAmountTransaction.call(0);
        assert.strictEqual(
            transfersAmountTransaction.length,
            expectedTransfersAmountLength,
        );
        assert.isOk(
            (transfersAmountTransaction[0]).eqn(expectedAmount),
        );
    });
});
