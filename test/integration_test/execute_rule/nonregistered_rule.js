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
 * @dev  This is the integration test with non-registered rules.
 *
 *        Following steps are performed in the test :-
 *
 *        - EIP20TokenMock contract is deployed.
 *        - Organization contract is deployed and worker is set.
 *        - TokenRules contract is deployed.
 *          TransferRule contract is deployed and it is registered in TokenRules.
 *        - TokenHolder contract is deployed by providing the wallets and
 *           required confirmations.
 *        - Using EIP20TokenMock's setBalance method,tokens are provided to TH.
 *        - A contract i.e. TransferRule is deployed and is not registered in
 *          TokenRules
 *        - We generate executable data for TransferRule contract's(which was not
 *          registered in TokenRules)transferFrom method.
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
    totalBalance = 500,
    nonRegisteredRule,
    currentBlockNumber,
    expirationHeight,
    spendingLimit,
    transferFromExecutable,
    nextAvailableNonce,
    currentNonce,
    amountTransferred,
    to;

  describe('ExecuteRule integration test', async () => {

    it('Check non-registered rule address in TokenRules', async () => {

      accountProvider = new AccountsProvider(accounts);

      ( {
        tokenHolder,
        wallet1,
        eip20TokenMock,
        transferRule,
        tokenRules,
      } = await ExecuteRuleUtils.setup(accountProvider));

      await eip20TokenMock.setBalance(tokenHolder.address, totalBalance);

      ephemeralPrivateKey1 = '0xa8225c01ceeaf01d7bc7c1b1b929037bd4050967c5730c0b854263121b8399f3';
      ephemeralKeyAddress1 = '0x62502C4DF73935D0D10054b0Fb8cC036534C6fb0';

      currentBlockNumber = await web3.eth.getBlockNumber(),
        expirationHeight = currentBlockNumber + 50,
        spendingLimit = 200;

      await tokenHolder.submitAuthorizeSession(
        ephemeralKeyAddress1,
        spendingLimit,
        expirationHeight,
        { from: wallet1 },
      );

      keyData = await tokenHolder.ephemeralKeys(
        ephemeralKeyAddress1,
      );

      currentNonce = keyData.nonce,
        amountTransferred = 50;

      nextAvailableNonce = currentNonce.toNumber() + 1;
      to = accountProvider.get();

      transferFromExecutable = await ExecuteRuleUtils.generateTransferFromExecutable(
        tokenHolder.address,
        to,
        new BN(amountTransferred),
      );

      // It is not registered in TokenRules.
      nonRegisteredRule = await ExecuteRuleUtils.transferRule(tokenRules.address);
    
      assert.strictEqual(
          (await tokenRules.rulesByAddress(nonRegisteredRule.address)).exists,
          false,
      );
    
    });
    
    it('Should fail when non-registered rule calls executerule', async () => {
      
      const { rsv } = await ExecuteRuleUtils.getExecuteRuleExTxData(
        tokenHolder.address,
        nonRegisteredRule.address,
        transferFromExecutable,
        new BN(nextAvailableNonce),
        ephemeralPrivateKey1,
      );

      // 'to' address balance before calling executeRule method.
      assert.strictEqual(
        (await eip20TokenMock.balanceOf(to)).cmp(new BN(0)),
        0,
      );

      // 'tokenHolder' balance before calling executeRule method.
      assert.strictEqual(
        (await eip20TokenMock.balanceOf(tokenHolder.address)).cmp(
          new BN(totalBalance)),
        0,
      );

      const transactionResponse = await tokenHolder.executeRule(
        nonRegisteredRule.address,
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
      assert.strictEqual(events[0].args['_status'], null);

      // As the rule 'nonRegisteredRule' was not registered, transfer did not
      // take place. So, 'to' address and tokenholder has zero tokens and 500
      // tokens respectively i.e. same number of tokens as it were before
      // 'executeRule' method was called.
      assert.strictEqual(
        (await eip20TokenMock.balanceOf(to)).cmp(new BN(0)),
        0,
      );

      assert.strictEqual(
        (await eip20TokenMock.balanceOf(tokenHolder.address)).cmp(
          new BN(totalBalance)),
        0,
      );

    });

  });

});




