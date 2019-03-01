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
const web3 = require('../test_lib/web3.js');
const Utils = require('../test_lib/utils');
const PricerRuleUtils = require('./utils.js');
const { AccountProvider } = require('../test_lib/utils');

async function prepare(accountProvider, config = {}, eip20TokenConfig = {}) {
  const r = await PricerRuleUtils.createTokenEconomy(accountProvider, config, eip20TokenConfig);

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
  eip20TokenDecimals, amount, price, conversionRate, conversionRateDecimals,
) {
  const requiredPriceOracleDecimalsBN = (new BN(10)).pow(new BN(eip20TokenDecimals));
  const conversionRateDecimalsBN = (new BN(10)).pow(conversionRateDecimals);
  return ((requiredPriceOracleDecimalsBN
    .mul(amount)
    .mul(conversionRate))
    .div(price))
    .div(conversionRateDecimalsBN);
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
        requiredPriceOracleDecimals,
      } = await prepare(accountProvider);

      // $0.002 = 0.002*10^18(in contract)
      const acceptanceMargin = (0.002 * (10 ** requiredPriceOracleDecimals))
        .toString();
      await pricerRule.setAcceptanceMargin(
        web3.utils.stringToHex(quoteCurrencyCode),
        acceptanceMargin,
        { from: organizationWorker },
      );

      await Utils.expectRevert(
        pricerRule.pay(
          fromAddress,
          [accountProvider.get()], // 'to' addresses
          ['2'], // amounts
          web3.utils.stringToHex(quoteCurrencyCode),
          new BN(priceOracleInitialPrice).add(new BN(acceptanceMargin)).add(new BN(1)),
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
          new BN(priceOracleInitialPrice).sub(new BN(acceptanceMargin).add(new BN(1))),
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

    it('Checks that TokenRules executeTransfers is called with requiredPriceOracleDecimals = 18 and eip20TokenDecimals = 18.', async () => {
      const config = {
        requiredPriceOracleDecimals: 18,
      };
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
        eip20TokenDecimals,
      } = await prepare(accountProvider, config);

      // $0.02 = 0.02*10^18(in contract)
      const oraclePrice = (0.02 * (10 ** requiredPriceOracleDecimals))
        .toString();
      await priceOracle.setPrice(
        oraclePrice,
        (await web3.eth.getBlockNumber()) + 10000,
      );
      // $1 = 1*10^18(in contract)
      const acceptanceMargin = (1 * (10 ** requiredPriceOracleDecimals))
        .toString();
      await pricerRule.setAcceptanceMargin(
        web3.utils.stringToHex(quoteCurrencyCode),
        acceptanceMargin,
        { from: organizationWorker },
      );

      const to1 = accountProvider.get();
      const to2 = accountProvider.get();
      // Amount1 to transfer: $20 = 20*10^18(in contract)
      const amount1BN = (20 * (10 ** requiredPriceOracleDecimals)).toString();
      // Amount2 to transfer: $10 = 10*10^18(in contract)
      const amount2BN = (10 * (10 ** requiredPriceOracleDecimals)).toString();

      const intendedPrice = oraclePrice; // intendedPriceBN is Current PriceOracle price

      await pricerRule.pay(
        fromAddress,
        [to1, to2], // 'to' addresses
        [amount1BN, amount2BN], // amounts
        web3.utils.stringToHex(quoteCurrencyCode),
        intendedPrice,
        { from: accountProvider.get() },
      );
      const convertedAmount1BN = convertPayCurrencyToToken(
        eip20TokenDecimals,
        new BN(amount1BN),
        new BN(oraclePrice),
        new BN(conversionRate),
        new BN(conversionRateDecimals),
      );
      const convertedAmount2BN = convertPayCurrencyToToken(
        eip20TokenDecimals,
        new BN(amount2BN),
        new BN(oraclePrice),
        new BN(conversionRate),
        new BN(conversionRateDecimals),
      );
      const actualFromAddress = await tokenRules.recordedFrom.call();

      const actualToAddress1 = await tokenRules.recordedTransfersTo.call(0);
      const actualToAddress2 = await tokenRules.recordedTransfersTo.call(1);
      const actualTransfersToLength = await tokenRules.recordedTransfersToLength.call();

      const tenPowerEIP20TokenDecimals = (new BN(10)).pow(new BN(eip20TokenDecimals));
      // 1000 BTs = 1000*10^18 BTWei
      const expectedTransferAmount1 = new BN(1000).mul(tenPowerEIP20TokenDecimals);
      // 500 BTs = 500*10^18 BTWei
      const expectedTransferAmount2 = new BN(500).mul(tenPowerEIP20TokenDecimals);
      const transferredAmount1 = await tokenRules.recordedTransfersAmount.call(0);
      const transferredAmount2 = await tokenRules.recordedTransfersAmount.call(1);

      const actualTransfersAmountLength = await tokenRules.recordedTransfersAmountLength.call();

      assert.strictEqual(
        actualFromAddress,
        fromAddress,
      );

      assert.isOk(
        actualTransfersToLength.eqn(2),
      );

      assert.strictEqual(
        actualToAddress1,
        to1,
      );

      assert.strictEqual(
        actualToAddress2,
        to2,
      );

      assert.isOk(
        actualTransfersAmountLength.eqn(2),
      );

      assert.isOk(
        transferredAmount1.eq(expectedTransferAmount1),
      );

      assert.isOk(
        expectedTransferAmount1.eq(convertedAmount1BN),
      );

      assert.isOk(
        transferredAmount2.eq(expectedTransferAmount2),
      );

      assert.isOk(
        expectedTransferAmount2.eq(convertedAmount2BN),
      );
    });

    it('Checks that TokenRules executeTransfers is called with requiredPriceOracleDecimals = 5 and eip20TokenDecimals = 18.', async () => {
      const config = {
        requiredPriceOracleDecimals: 5,
      };
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
        eip20TokenDecimals,
      } = await prepare(accountProvider, config);

      // $0.02 = 0.02*10^5(in contract)
      const oraclePrice = (0.02 * (10 ** requiredPriceOracleDecimals))
        .toString();
      await priceOracle.setPrice(
        oraclePrice,
        (await web3.eth.getBlockNumber()) + 10000,
      );
      // $1 = 1*10^5(in contract)
      const acceptanceMargin = (1 * (10 ** requiredPriceOracleDecimals))
        .toString();
      await pricerRule.setAcceptanceMargin(
        web3.utils.stringToHex(quoteCurrencyCode),
        acceptanceMargin,
        { from: organizationWorker },
      );

      const to1 = accountProvider.get();
      const to2 = accountProvider.get();
      // Amount1 to transfer: $20 = 20*10^5(in contract)
      const amount1BN = (20 * (10 ** requiredPriceOracleDecimals)).toString();
      // Amount2 to transfer: $10 = 10*10^5(in contract)
      const amount2BN = (10 * (10 ** requiredPriceOracleDecimals)).toString();
      // intendedPriceBN being passed is current PriceOracle price
      const intendedPrice = oraclePrice;

      await pricerRule.pay(
        fromAddress,
        [to1, to2], // 'to' addresses
        [amount1BN, amount2BN], // amounts
        web3.utils.stringToHex(quoteCurrencyCode),
        intendedPrice,
        { from: accountProvider.get() },
      );
      const convertedAmount1BN = convertPayCurrencyToToken(
        eip20TokenDecimals,
        new BN(amount1BN),
        new BN(oraclePrice),
        new BN(conversionRate),
        new BN(conversionRateDecimals),
      );
      const convertedAmount2BN = convertPayCurrencyToToken(
        eip20TokenDecimals,
        new BN(amount2BN),
        new BN(oraclePrice),
        new BN(conversionRate),
        new BN(conversionRateDecimals),
      );
      const actualFromAddress = await tokenRules.recordedFrom.call();

      const actualToAddress1 = await tokenRules.recordedTransfersTo.call(0);
      const actualToAddress2 = await tokenRules.recordedTransfersTo.call(1);
      const actualTransfersToLength = await tokenRules.recordedTransfersToLength.call();

      // Number of bt needs to be transferred for a payment shouldn’t depend on
      // requiredPriceOracleDecimals.
      // requiredPriceOracleDecimals simply decides minimum value in currency(say USD)
      // that can be transferred.
      // 1000 BTs = 1000*10^18 BTWei
      const tenPowerEIP20TokenDecimals = (new BN(10)).pow(new BN(eip20TokenDecimals));
      const expectedTransferAmount1 = new BN(1000).mul(tenPowerEIP20TokenDecimals);
      // 500 BTs = 500*10^18 BTWei
      const expectedTransferAmount2 = new BN(500).mul(tenPowerEIP20TokenDecimals);
      const transferredAmount1 = await tokenRules.recordedTransfersAmount.call(0);
      const transferredAmount2 = await tokenRules.recordedTransfersAmount.call(1);

      const actualTransfersAmountLength = await tokenRules.recordedTransfersAmountLength.call();

      assert.strictEqual(
        actualFromAddress,
        fromAddress,
      );

      assert.isOk(
        actualTransfersToLength.eqn(2),
      );

      assert.strictEqual(
        actualToAddress1,
        to1,
      );

      assert.strictEqual(
        actualToAddress2,
        to2,
      );

      assert.isOk(
        actualTransfersAmountLength.eqn(2),
      );

      assert.isOk(
        expectedTransferAmount1.eq(convertedAmount1BN),
      );

      assert.isOk(
        transferredAmount1.eq(expectedTransferAmount1),
      );

      assert.isOk(
        expectedTransferAmount2.eq(convertedAmount2BN),
      );

      assert.isOk(
        transferredAmount2.eq(expectedTransferAmount2),
      );
    });

    it('Checks that TokenRules executeTransfers is called with requiredPriceOracleDecimals = 18 and eip20TokenDecimals = 5.', async () => {
      const config = {
        requiredPriceOracleDecimals: 18,
      };
      const eip20TokenConfig = {
        symbol: 'OST',
        name: 'Open Simple Token',
        decimals: 5,
      };
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
        eip20TokenDecimals,
      } = await prepare(accountProvider, config, eip20TokenConfig);

      // $0.02 = 0.02*10^18(in contract)
      const oraclePrice = (0.02 * (10 ** requiredPriceOracleDecimals))
        .toString();
      await priceOracle.setPrice(
        oraclePrice,
        (await web3.eth.getBlockNumber()) + 10000,
      );
      // $1 = 1*10^18(in contract)
      const acceptanceMargin = (1 * (10 ** requiredPriceOracleDecimals))
        .toString();
      await pricerRule.setAcceptanceMargin(
        web3.utils.stringToHex(quoteCurrencyCode),
        acceptanceMargin,
        { from: organizationWorker },
      );

      const to1 = accountProvider.get();
      const to2 = accountProvider.get();
      // Amount1 to transfer: $20 = 20*10^18(in contract)
      const amount1BN = (20 * (10 ** requiredPriceOracleDecimals)).toString();
      // Amount2 to transfer: $10 = 10*10^18(in contract)
      const amount2BN = (10 * (10 ** requiredPriceOracleDecimals)).toString();

      const intendedPrice = oraclePrice; // intendedPriceBN is Current PriceOracle price

      await pricerRule.pay(
        fromAddress,
        [to1, to2], // 'to' addresses
        [amount1BN, amount2BN], // amounts
        web3.utils.stringToHex(quoteCurrencyCode),
        intendedPrice,
        { from: accountProvider.get() },
      );
      const convertedAmount1BN = convertPayCurrencyToToken(
        eip20TokenDecimals,
        new BN(amount1BN),
        new BN(oraclePrice),
        new BN(conversionRate),
        new BN(conversionRateDecimals),
      );
      const convertedAmount2BN = convertPayCurrencyToToken(
        eip20TokenDecimals,
        new BN(amount2BN),
        new BN(oraclePrice),
        new BN(conversionRate),
        new BN(conversionRateDecimals),
      );
      const actualFromAddress = await tokenRules.recordedFrom.call();

      const actualToAddress1 = await tokenRules.recordedTransfersTo.call(0);
      const actualToAddress2 = await tokenRules.recordedTransfersTo.call(1);
      const actualTransfersToLength = await tokenRules.recordedTransfersToLength.call();

      const tenPowerEIP20TokenDecimal = (new BN(10)).pow(new BN(eip20TokenDecimals));
      // 1000 BTs = 1000*10^5 BTWei
      const expectedTransferAmount1 = new BN(1000).mul(tenPowerEIP20TokenDecimal);
      // 500 BTs = 500*10^5 BTWei
      const expectedTransferAmount2 = new BN(500).mul(tenPowerEIP20TokenDecimal);
      const transferredAmount1 = await tokenRules.recordedTransfersAmount.call(0);
      const transferredAmount2 = await tokenRules.recordedTransfersAmount.call(1);

      const actualTransfersAmountLength = await tokenRules.recordedTransfersAmountLength.call();

      assert.strictEqual(
        actualFromAddress,
        fromAddress,
      );

      assert.isOk(
        actualTransfersToLength.eqn(2),
      );

      assert.strictEqual(
        actualToAddress1,
        to1,
      );

      assert.strictEqual(
        actualToAddress2,
        to2,
      );

      assert.isOk(
        actualTransfersAmountLength.eqn(2),
      );

      assert.isOk(
        transferredAmount1.eq(expectedTransferAmount1),
      );

      assert.isOk(
        expectedTransferAmount1.eq(convertedAmount1BN),
      );

      assert.isOk(
        transferredAmount2.eq(expectedTransferAmount2),
      );

      assert.isOk(
        expectedTransferAmount2.eq(convertedAmount2BN),
      );
    });
  });
});
