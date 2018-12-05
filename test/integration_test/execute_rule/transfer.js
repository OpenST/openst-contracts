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
 * @dev  This is the integration test to perform BT transfers using transfer
 *        rule contract.
 *
 *        Following steps are performed in the test :-
 *
 *        - EIP20TokenMock contract is deployed.
 *        - Organization contract is deployed and worker is set.
 *        - TokenRules contract is deployed.
 *         TransferRule contract is deployed and it is registered in TokenRules.
 *        - TokenHolder contract is deployed by providing the wallets and
 *           required confirmations.
 *        - Validation of deployed contract and its parameters are done.
 *           Below verifications are done:
 *            - TransferRule registration in TokenRules.
 *            - TokenRules address and EIP20TokenMock address in TH.
 *        - Using EIP20TokenMock's setBalance method,tokens are provided to TH.
 *        - Authorization and Verification of Ephemeral key is done.
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
  BN = require('bn.js');

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
    totalBalance = 500;

  describe('ExecuteRule integration test', async () => {

    it('Validate the setup', async () => {

      accountProvider = new AccountsProvider(accounts);

      ( {
        tokenHolder,
        wallet1,
        eip20TokenMock,
        transferRule,
        tokenRules,
      } = await ExecuteRuleUtils.setup(accountProvider));

      await eip20TokenMock.setBalance(tokenHolder.address, totalBalance);

      // Verify added rule
      assert.strictEqual(
        (await tokenRules.rulesByAddress(transferRule.address)).exists,
        true,
      );

      assert.strictEqual((await tokenHolder.tokenRules()), tokenRules.address);

      assert.strictEqual((await tokenHolder.token()), eip20TokenMock.address);

    });

    it('Authorize an ephemeral key', async () => {

      ephemeralPrivateKey1 = '0xa8225c01ceeaf01d7bc7c1b1b929037bd4050967c5730c0b854263121b8399f3';
      ephemeralKeyAddress1 = '0x62502C4DF73935D0D10054b0Fb8cC036534C6fb0';

      let currentBlockNumber = await web3.eth.getBlockNumber(),
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

      // Verify the authorization of key
      assert.strictEqual((keyData.status).cmp(new BN(1)), 0);

      assert.strictEqual((keyData.expirationHeight).cmp(new BN(expirationHeight)), 0);

      assert.strictEqual((keyData.spendingLimit).cmp(new BN(spendingLimit)), 0);

    });

    it('Verifies successful execution of execute rule', async () => {

      let currentNonce = keyData.nonce,
        amountTransferred = 50;

      let nextAvailableNonce = currentNonce.toNumber() + 1;
      const to = accountProvider.get();

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

      let transactionResponse = await tokenHolder.executeRule(
        transferRule.address,
        transferFromExecutable,
        (currentNonce.toNumber() + 1),
        rsv.v,
        EthUtils.bufferToHex(rsv.r),
        EthUtils.bufferToHex(rsv.s),
      );

      await utils.logResponse(transactionResponse,"ExecuteRule");

      // Verify 'to' address balance
      assert.strictEqual(
        (await eip20TokenMock.balanceOf(to)).cmp(new BN(amountTransferred)),
        0,
      );

      // Verify tokenholder balance
      assert.strictEqual(
        (await eip20TokenMock.balanceOf(tokenHolder.address)).cmp(
          new BN(totalBalance - amountTransferred)),
        0,
      );

    });

    it('Prints gas used for execute rule execution', async () => {

      utils.printGasStatistics();

    });

  });

});

