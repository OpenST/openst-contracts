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

const web3 = require('../test_lib/web3.js');
const Utils = require('../test_lib/utils.js');
const { AccountProvider } = require('../test_lib/utils');

const CreditRule = artifacts.require('CreditRule');
const TokenRulesSpy = artifacts.require('TokenRulesSpy');
const EIP20TokenFake = artifacts.require('EIP20TokenFake');
const TokenHolder = artifacts.require('TokenHolder');
const CustomRuleWithCredit = artifacts.require('CustomRuleWithCredit');

const budgetHolderSessionPublicKey = '0xBbfd1BF77dA692abc82357aC001415b98d123d17';
const budgetHolderSessionPrivateKey = '0x6817f551bbc3e12b8fe36787ab192c921390d6176a3324ed02f96935a370bc41';
const tokenHolderSessionPublicKey = '0x62502C4DF73935D0D10054b0Fb8cC036534C6fb0';
const tokenHolderSessionPrivateKey = '0xa8225c01ceeaf01d7bc7c1b1b929037bd4050967c5730c0b854263121b8399f3';

async function prepare(
    accountProvider,
    budgetHolderInitialBalance,
    tokenHolderInitialBalance,
) {
    const token = await EIP20TokenFake.new(
        'OST', 'Open Simple Token', 1,
    );

    const tokenRules = await TokenRulesSpy.new(token.address);

    const budgetHolderOwnerAddress = accountProvider.get();

    const budgetHolder = await TokenHolder.new(
        token.address, tokenRules.address, budgetHolderOwnerAddress,
    );

    await token.increaseBalance(budgetHolder.address, budgetHolderInitialBalance);

    const budgetHolderSessionKeySpendingLimit = 33;
    const budgetHolderSessionKeyExpirationDelta = 300;

    await budgetHolder.authorizeSession(
        budgetHolderSessionPublicKey,
        budgetHolderSessionKeySpendingLimit,
        (await web3.eth.getBlockNumber()) + budgetHolderSessionKeyExpirationDelta,
        { from: budgetHolderOwnerAddress },
    );

    const tokenHolderOwnerAddress = accountProvider.get();

    const tokenHolder = await TokenHolder.new(
        token.address, tokenRules.address, tokenHolderOwnerAddress,
    );

    await token.increaseBalance(tokenHolder.address, tokenHolderInitialBalance);

    const tokenHolderSessionKeySpendingLimit = 22;
    const tokenHolderSessionKeyExpirationDelta = 200;

    await tokenHolder.authorizeSession(
        tokenHolderSessionPublicKey,
        tokenHolderSessionKeySpendingLimit,
        (await web3.eth.getBlockNumber()) + tokenHolderSessionKeyExpirationDelta,
        { from: tokenHolderOwnerAddress },
    );

    const creditRule = await CreditRule.new(
        budgetHolder.address, tokenRules.address,
    );

    const customRule = await CustomRuleWithCredit.new(creditRule.address);

    return {
        token,
        tokenRules,
        budgetHolderOwnerAddress,
        budgetHolder,
        budgetHolderSessionKeySpendingLimit,
        budgetHolderSessionKeyExpirationDelta,
        tokenHolderOwnerAddress,
        tokenHolder,
        tokenHolderSessionKeySpendingLimit,
        tokenHolderSessionKeyExpirationDelta,
        creditRule,
        customRule,
    };
}

function generateTokenHolderExecuteRuleCallPrefix() {
    return web3.eth.abi.encodeFunctionSignature({
        name: 'executeRule',
        type: 'function',
        inputs: [
            {
                type: 'address', name: '',
            },
            {
                type: 'bytes', name: '',
            },
            {
                type: 'uint256', name: '',
            },
            {
                type: 'uint8', name: '',
            },
            {
                type: 'bytes32', name: '',
            },
            {
                type: 'bytes32', name: '',
            },
        ],
    });
}

async function checkTransactions(
    tokenRulesSpy,
    creditBudgetHolderAddr,
    creditAmount,
    userTokenHolderAddr,
    beneficiaries,
    amounts,
) {
    const transactionsLength = await tokenRulesSpy.transactionsLength.call();

    // Transactions count registered in TokenRulesSpy should be 2:
    //      - transfers from CreditBudgetHolder to UserTokenHolder
    //      - transfers from UserTokenHolder instance to beneficiaries
    assert.isOk(
        transactionsLength.eqn(2),
    );

    // First transfer (crediting) is from CreditBudgetHolder to UserTokenHolder.
    assert.strictEqual(
        await tokenRulesSpy.fromTransaction.call(0),
        creditBudgetHolderAddr,
    );

    // UserTokenHolder address is the only beneficiary for the first transfer.
    const firstTransfersToTransaction = await tokenRulesSpy.transfersToTransaction.call(0);
    assert.strictEqual(
        firstTransfersToTransaction.length,
        1,
    );
    assert.strictEqual(
        firstTransfersToTransaction[0],
        userTokenHolderAddr,
    );

    // UserTokenHolder credited amount is calculated, by:
    //      min(sum(amounts), creditAmount)
    const firstTransfersAmountTransaction = await tokenRulesSpy.transfersAmountTransaction.call(0);
    assert.strictEqual(
        firstTransfersAmountTransaction.length,
        1,
    );
    assert.isOk(
        (firstTransfersAmountTransaction[0]).eqn(
            Math.min(
            // Calculates sum of the amounts elements.
                amounts.reduce((accumulator, currentValue) => accumulator + currentValue),
                creditAmount,
            ),
        ),
    );

    // Second transfers is from UserTokenHolder to the beneficiaries.
    assert.strictEqual(
        await tokenRulesSpy.fromTransaction.call(1),
        userTokenHolderAddr,
    );

    const secondTransfersToTransaction = await tokenRulesSpy.transfersToTransaction.call(1);
    assert.strictEqual(
        secondTransfersToTransaction.length,
        beneficiaries.length,
    );

    for (let i = 0; i < secondTransfersToTransaction.length; i += 1) {
        assert.strictEqual(
            secondTransfersToTransaction[i],
            beneficiaries[i],
        );
    }

    const secondTransfersAmountTransaction = await tokenRulesSpy.transfersAmountTransaction.call(1);
    assert.strictEqual(
        secondTransfersAmountTransaction.length,
        amounts.length,
    );

    for (let i = 0; i < secondTransfersAmountTransaction.length; i += 1) {
        assert.isOk(
            (secondTransfersAmountTransaction[i]).eqn(
                amounts[i],
            ),
        );
    }
}

contract('Credit::execute_transfers', async () => {
    contract('Happy Path', async (accounts) => {
        const accountProvider = new AccountProvider(accounts);

        it('Checks that passed arguments are set correctly.', async () => {
            const {
                tokenRules,
                budgetHolder,
                tokenHolder,
                creditRule,
                customRule,
            } = await prepare(
                accountProvider,
                222, // budgetHolderInitialBalance
                111, // tokenHolderInitialBalance
            );

            const beneficiaryAddress = accountProvider.get();
            const amount = 11;

            const customRuleWithCreditPayFunctionData = customRule.contract.methods.pay(
                beneficiaryAddress, amount,
            ).encodeABI();

            const tokenHolderSessionKeyData = await tokenHolder.sessionKeys.call(
                tokenHolderSessionPublicKey,
            );

            const {
                exTxSignature: customRuleExTxSignature,
            } = await Utils.generateExTx(
                tokenHolder.address,
                customRule.address,
                customRuleWithCreditPayFunctionData,
                tokenHolderSessionKeyData.nonce.toNumber(),
                generateTokenHolderExecuteRuleCallPrefix(),
                tokenHolderSessionPrivateKey,
            );

            const tokenHolderExecuteRuleFunctionData = tokenHolder.contract.methods.executeRule(
                customRule.address,
                customRuleWithCreditPayFunctionData,
                tokenHolderSessionKeyData.nonce.toNumber(),
                customRuleExTxSignature.r,
                customRuleExTxSignature.s,
                customRuleExTxSignature.v,
            ).encodeABI();

            const creditAmount = 5;

            const creditRuleExecuteRuleFunctionData = creditRule.contract.methods.executeRule(
                creditAmount,
                tokenHolder.address,
                tokenHolderExecuteRuleFunctionData,
            ).encodeABI();

            const budgetHolderSessionKeyData = await budgetHolder.sessionKeys.call(
                budgetHolderSessionPublicKey,
            );

            const {
                exTxSignature: tokenHolderExecuteRuleExTxSignature,
            } = await Utils.generateExTx(
                budgetHolder.address,
                creditRule.address,
                creditRuleExecuteRuleFunctionData,
                budgetHolderSessionKeyData.nonce.toNumber(),
                generateTokenHolderExecuteRuleCallPrefix(),
                budgetHolderSessionPrivateKey,
            );

            await budgetHolder.executeRule(
                creditRule.address,
                creditRuleExecuteRuleFunctionData,
                budgetHolderSessionKeyData.nonce.toNumber(),
                tokenHolderExecuteRuleExTxSignature.r,
                tokenHolderExecuteRuleExTxSignature.s,
                tokenHolderExecuteRuleExTxSignature.v,
            );

            await checkTransactions(
                tokenRules,
                budgetHolder.address,
                creditAmount,
                tokenHolder.address,
                [beneficiaryAddress],
                [amount],
            );
        });
    });
});
