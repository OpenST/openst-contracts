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

const BN = require('bn.js');
const web3 = require('../test_lib/web3.js');
const Utils = require('../test_lib/utils');
const PricerRuleUtils = require('./utils.js');
const { AccountProvider } = require('../test_lib/utils');

async function prepare(accountProvider) {
    const r = await PricerRuleUtils.createTokenEconomy(accountProvider);

    r.fromAddress = accountProvider.get();

    await r.pricerRule.addPriceOracle(
        r.priceOracle.address,
        { from: r.organizationWorker },
    );

    r.tokenRules.allowTransfers(
        { from: r.fromAddress },
    );

    r.spendingLimit = 1000000;

    r.token.approve(
        r.tokenRules.address,
        r.spendingLimit,
        { from: r.fromAddress },
    );

    return r;
}

function convertPayCurrencyToToken(
    amount, price, conversionRate, conversionRateDecimals,
) {
    const conversionRateDecimalsBN = (new BN(10)).pow(conversionRateDecimals);
    return ((amount.mul(conversionRate)).div(price)).div(conversionRateDecimalsBN);
}

contract('PricerRule::pay', async () => {
    contract('Negative Tests', async (accounts) => {
        const accountProvider = new AccountProvider(accounts);

        it('Reverts as a \'from\' address is null.', async () => {
            const {
                pricerRule,
                quoteCurrencyCode,
                priceOracleInitialPrice,
            } = await prepare(accountProvider);

            await Utils.expectRevert(
                pricerRule.pay(
                    Utils.NULL_ADDRESS,
                    [accountProvider.get()], // 'to' addresses
                    [1], // amounts
                    web3.utils.stringToHex(quoteCurrencyCode),
                    priceOracleInitialPrice,
                    { from: accountProvider.get() },
                ),
                'Should revert as address to send amounts is null.',
                'From address is null.',
            );
        });

        it('Reverts as a addresses and amounts arrays\' sizes are not equal.', async () => {
            const {
                pricerRule,
                quoteCurrencyCode,
                priceOracleInitialPrice,
                fromAddress,
            } = await prepare(accountProvider);

            await Utils.expectRevert(
                pricerRule.pay(
                    fromAddress,
                    [], // 'to' addresses
                    [1], // amounts
                    web3.utils.stringToHex(quoteCurrencyCode),
                    priceOracleInitialPrice,
                    { from: accountProvider.get() },
                ),
                'Should revert as a addresses and amounts arrays\' sizes are not equal.',
                '\'to\' and \'amount\' transfer arrays\' lengths are not equal.',
            );

            await Utils.expectRevert(
                pricerRule.pay(
                    fromAddress,
                    [accountProvider.get()], // 'to' addresses
                    [], // amounts
                    web3.utils.stringToHex(quoteCurrencyCode),
                    priceOracleInitialPrice,
                    { from: accountProvider.get() },
                ),
                'Should revert as a addresses and amounts arrays\' sizes are not equal.',
                '\'to\' and \'amount\' transfer arrays\' lengths are not equal.',
            );
        });

        it('Reverts as an intended price is not in acceptable margin.', async () => {
            const {
                organizationWorker,
                pricerRule,
                quoteCurrencyCode,
                priceOracleInitialPrice,
                fromAddress,
            } = await prepare(accountProvider);

            const acceptanceMargin = 5;
            await pricerRule.setAcceptanceMargin(
                web3.utils.stringToHex(quoteCurrencyCode),
                acceptanceMargin,
                { from: organizationWorker },
            );

            await Utils.expectRevert(
                pricerRule.pay(
                    fromAddress,
                    [accountProvider.get()], // 'to' addresses
                    [2], // amounts
                    web3.utils.stringToHex(quoteCurrencyCode),
                    priceOracleInitialPrice + acceptanceMargin + 1,
                    { from: accountProvider.get() },
                ),
                'Should revert as n intended price is not in the acceptable margin.',
                'Intended price is not in the acceptable margin wrt current price.',
            );

            assert.isOk(
                priceOracleInitialPrice - (acceptanceMargin + 1) >= 0,
            );

            await Utils.expectRevert(
                pricerRule.pay(
                    fromAddress,
                    [accountProvider.get()], // 'to' addresses
                    [2], // amounts
                    web3.utils.stringToHex(quoteCurrencyCode),
                    priceOracleInitialPrice - (acceptanceMargin + 1),
                    { from: accountProvider.get() },
                ),
                'Should revert as n intended price is not in the acceptable margin.',
                'Intended price is not in the acceptable margin wrt current price.',
            );
        });

        it('Reverts if an price oracle throws an exception on price request.', async () => {
            const {
                pricerRule,
                quoteCurrencyCode,
                priceOracleInitialPrice,
                priceOracle,
                fromAddress,
            } = await prepare(accountProvider);

            const deltaExpirationHeight = 10;
            await priceOracle.setPrice(
                priceOracleInitialPrice,
                (await web3.eth.getBlockNumber()) + deltaExpirationHeight,
            );

            for (let i = 0; i < deltaExpirationHeight; i += 1) {
                // eslint-disable-next-line no-await-in-loop
                await Utils.advanceBlock();
            }

            await Utils.expectRevert(
                pricerRule.pay(
                    fromAddress,
                    [accountProvider.get()], // 'to' addresses
                    [2], // amounts
                    web3.utils.stringToHex(quoteCurrencyCode),
                    priceOracleInitialPrice,
                    { from: accountProvider.get() },
                ),
                'Should revert as the price oracle throws an exception on price request.',
                'Price expiration height is lte to the current block height.',
            );
        });

        it('Reverts if an price oracle returns 0 price.', async () => {
            const {
                pricerRule,
                quoteCurrencyCode,
                priceOracleInitialPrice,
                priceOracle,
                fromAddress,
            } = await prepare(accountProvider);

            await priceOracle.setPrice(
                0,
                (await web3.eth.getBlockNumber()) + 10000,
            );

            await Utils.expectRevert(
                pricerRule.pay(
                    fromAddress,
                    [accountProvider.get()], // 'to' addresses
                    [2], // amounts
                    web3.utils.stringToHex(quoteCurrencyCode),
                    priceOracleInitialPrice,
                    { from: accountProvider.get() },
                ),
                'Should revert as the price oracle returns 0 as price.',
                'Base currency price in pay currency is 0.',
            );
        });
    });

    contract('Positive Paths', async (accounts) => {
        const accountProvider = new AccountProvider(accounts);

        it('Checks that TokenRules executeTransfers is called.', async () => {
            const {
                organizationWorker,
                tokenRules,
                conversionRate,
                conversionRateDecimals,
                requiredPriceOracleDecimals,
                pricerRule,
                quoteCurrencyCode,
                priceOracle,
                fromAddress,
            } = await prepare(accountProvider);

            const oraclePriceBN = new BN(4 * (10 ** requiredPriceOracleDecimals));
            await priceOracle.setPrice(
                oraclePriceBN.toNumber(),
                (await web3.eth.getBlockNumber()) + 10000,
            );


            const acceptanceMarginBN = new BN(3 * (10 ** requiredPriceOracleDecimals));
            await pricerRule.setAcceptanceMargin(
                web3.utils.stringToHex(quoteCurrencyCode),
                acceptanceMarginBN.toNumber(),
                { from: organizationWorker },
            );

            const to1 = accountProvider.get();
            const to2 = accountProvider.get();
            const amount1BN = new BN(11 * (10 ** requiredPriceOracleDecimals));
            const amount2BN = new BN(7 * (10 ** requiredPriceOracleDecimals));

            const intendedPriceBN = oraclePriceBN.add(acceptanceMarginBN);

            await pricerRule.pay(
                fromAddress,
                [to1, to2], // 'to' addresses
                [amount1BN.toNumber(), amount2BN.toNumber()], // amounts
                web3.utils.stringToHex(quoteCurrencyCode),
                intendedPriceBN.toNumber(),
                { from: accountProvider.get() },
            );

            const convertedAmount1BN = convertPayCurrencyToToken(
                amount1BN, oraclePriceBN, new BN(conversionRate), new BN(conversionRateDecimals),
            );
            const convertedAmount2BN = convertPayCurrencyToToken(
                amount2BN, oraclePriceBN, new BN(conversionRate), new BN(conversionRateDecimals),
            );

            const transactionsLength = await tokenRules.transactionsLength.call();
            assert.isOk(
                transactionsLength.eqn(1),
            );

            assert.strictEqual(
                await tokenRules.fromTransaction.call(0),
                fromAddress,
            );

            const transfersToTransaction = await tokenRules.transfersToTransaction.call(0);
            assert.strictEqual(
                transfersToTransaction.length,
                2,
            );
            assert.strictEqual(
                transfersToTransaction[0],
                to1,
            );
            assert.strictEqual(
                transfersToTransaction[1],
                to2,
            );

            const transfersAmountTransaction = await tokenRules.transfersAmountTransaction.call(0);
            assert.strictEqual(
                transfersAmountTransaction.length,
                2,
            );
            assert.isOk(
                (transfersAmountTransaction[0]).eq(convertedAmount1BN),
            );
            assert.isOk(
                (transfersAmountTransaction[1]).eq(convertedAmount2BN),
            );
        });
    });
});
