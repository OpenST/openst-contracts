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

/**
 * @dev This is the integration test for failing the executeRule when tokenholder
 *      has insufficient balance.
 *      In the tests,TH has 200 BTs. But,transfer of 250 tokens
 *      is initiated. It will fail as TH doesn't have 250 tokens.
 *
 *        Following steps are performed in the test :-
 *
 *        - EIP20TokenMock contract is deployed.
 *        - Organization contract is deployed and worker is set.
 *        - TokenRules contract is deployed.
 *         TransferRule contract is deployed and it is registered in TokenRules.
 *        - TokenHolder contract is deployed by providing the wallets and
 *           required confirmations.
 *        - Using EIP20TokenMock's setBalance method,tokens are provided to TH.
 *        - We generate executable data for TransferRule contract's transferFrom
 *           method.
 *        - Relayer calls executeRule method of tokenholder contract.
 *           After it's execution below verifications are done:
 *            - RuleExecuted event.
 *            - tokenholder balance.
 *            - 'to' address balance.
 */
const EthUtils = require('ethereumjs-util'),
  utils = require('../../test_lib/utils'),
  AccountsProvider = utils.AccountProvider,
  ExecuteRuleUtils = require('./utils'),
  BN = require('bn.js'),
  { Event } = require('../../test_lib/event_decoder');

contract('TokenHolder::executeRule', async (accounts) => {

  let accountProvider,
    tokenHolder,
    wallet1,
    eip20TokenMock,
    transferRule,
    tokenRules,
    ephemeralPrivateKey1,
    ephemeralKeyAddress1,
    keyData,
    totalBalance = 200,
    worker;

  describe('ExecuteRule integration test', async () => {

    it('Should fail when tokenholder has insufficient balance', async () => {

      accountProvider = new AccountsProvider(accounts);

      ( {
        tokenHolder,
        wallet1,
        eip20TokenMock,
        transferRule,
        tokenRules,
        worker,
      } = await ExecuteRuleUtils.setup(accountProvider));

      await eip20TokenMock.setBalance(tokenHolder.address, totalBalance);

      ephemeralPrivateKey1 = '0xa8225c01ceeaf01d7bc7c1b1b929037bd4050967c5730c0b854263121b8399f3';
      ephemeralKeyAddress1 = '0x62502C4DF73935D0D10054b0Fb8cC036534C6fb0';

      let currentBlockNumber = await web3.eth.getBlockNumber(),
        expirationHeight = currentBlockNumber + 50,
        spendingLimit = 300;

      await tokenHolder.submitAuthorizeSession(
        ephemeralKeyAddress1,
        spendingLimit,
        expirationHeight,
        { from: wallet1 },
      );

      keyData = await tokenHolder.ephemeralKeys(
        ephemeralKeyAddress1,
      );

      let currentNonce = keyData.nonce,
        amountTransferred = 250;

      let nextAvailableNonce = currentNonce.toNumber() + 1;
      const to = accountProvider.get();

      // We are generating executable data to transfer 250 tokens.
      // But, tokenholder has total 200 tokens.
      const transferFromExecutable = await ExecuteRuleUtils.generateTransferFromExecutable(
        tokenHolder.address,
        to,
        new BN(amountTransferred),
      );

      const { rsv } = await ExecuteRuleUtils.getExecuteRuleExTxData(
        tokenHolder.address,
        transferRule.address,
        transferFromExecutable,
        new BN(nextAvailableNonce),
        ephemeralPrivateKey1,
      );

      const transactionResponse = await tokenHolder.executeRule(
        transferRule.address,
        transferFromExecutable,
        (currentNonce.toNumber() + 1),
        rsv.v,
        EthUtils.bufferToHex(rsv.r),
        EthUtils.bufferToHex(rsv.s),
      );

      const events = Event.decodeTransactionResponse(
        transactionResponse,
      );

      // We should check against false here, however current version of web3
      // returns null for false values in event log. After updating web3,
      // this test might fail and we should use false (as intended).
      assert.equal(events[0].args['_status'], null);

      assert.equal(
        (await eip20TokenMock.balanceOf(to)),
        0,
      );

      assert.equal(
        (await eip20TokenMock.balanceOf(tokenHolder.address)),
        totalBalance,
      );

    });

  });

});
