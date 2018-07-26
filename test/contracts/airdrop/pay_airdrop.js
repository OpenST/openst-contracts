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
//
// ----------------------------------------------------------------------------
// Test: pay_airdrop.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const airdropUtils = require('./airdrop_utils.js');

///
/// Test stories
///
/// fails to airdrop and pay if msg.sender is not an active worker
/// fails to airdrop and pay if spender is null
/// fails to airdrop and pay if beneficiary data is not valid
/// fails to airdrop and pay if unable to perfrom airdrop transfer to spender
/// fails to airdrop and pay if unable to perform transfers
/// successfully airdrops and pays
/// when currency is not empty
///   fails to airdrop and pay if unable to validate margin and calculate BT amount
///   successfully airdrops and pays

module.exports.perform = (accounts) => {
  const opsAddress = accounts[1],
    worker = accounts[2],
    airdropBudgetHolder = accounts[3],
    beneficiary = accounts[4],
    transferAmount = new airdropUtils.bigNumber(5 * 10 ** 18),
    commissionBeneficiary = accounts[5],
    commissionAmount = new airdropUtils.bigNumber(1.25 * 10 ** 18),
    spender = accounts[6],
    airdropAmount = new airdropUtils.bigNumber(10 * 10 ** 18);

  var contracts = null,
    token = null,
    airdrop = null,
    response = null;

  before(async () => {
    contracts = await airdropUtils.deployAirdrop(artifacts, accounts);
    token = contracts.token;
    airdrop = contracts.airdrop;

    await token.setBalance(airdropBudgetHolder, airdropAmount);
  });

  it('fails to airdrop and pay if msg.sender is not an active worker', async () => {
    await airdropUtils.utils.expectThrow(
      airdrop.payAirdrop.call(
        beneficiary,
        transferAmount,
        commissionBeneficiary,
        commissionAmount,
        '',
        0,
        spender,
        airdropAmount,
        { from: opsAddress }
      )
    );
  });

  it('fails to airdrop and pay if spender is null', async () => {
    await airdropUtils.utils.expectThrow(
      airdrop.payAirdrop.call(
        beneficiary,
        transferAmount,
        commissionBeneficiary,
        commissionAmount,
        '',
        0,
        0,
        airdropAmount,
        { from: worker }
      )
    );
  });

  it('fails to airdrop and pay if isValidBeneficiaryData returns false', async () => {
    // transferAmount == 0
    await airdropUtils.utils.expectThrow(
      airdrop.payAirdrop.call(beneficiary, 0, commissionBeneficiary, commissionAmount, '', 0, spender, airdropAmount, {
        from: worker
      })
    );
  });

  it('fails to airdrop and pay if unable to perfrom airdrop transfer to spender', async () => {
    await airdropUtils.utils.expectThrow(
      airdrop.payAirdrop.call(
        beneficiary,
        transferAmount,
        commissionBeneficiary,
        commissionAmount,
        '',
        0,
        spender,
        airdropAmount,
        { from: worker }
      )
    );
  });

  it('fails to airdrop and pay if unable to perform transfers', async () => {
    await token.approve(airdrop.address, airdropAmount, { from: airdropBudgetHolder });
    await airdropUtils.utils.expectThrow(
      airdrop.payAirdrop.call(
        beneficiary,
        transferAmount,
        commissionBeneficiary,
        commissionAmount,
        '',
        0,
        spender,
        airdropAmount,
        { from: worker }
      )
    );
  });

  it('successfully airdrops and pays', async () => {
    await token.approve(airdrop.address, transferAmount.plus(commissionAmount), { from: spender });
    var returns = await airdrop.payAirdrop.call(
      beneficiary,
      transferAmount,
      commissionBeneficiary,
      commissionAmount,
      '',
      0,
      spender,
      airdropAmount,
      { from: worker }
    );
    var totalPaid = returns[0],
      airdropUsed = returns[1];
    assert.equal(totalPaid.toNumber(), transferAmount.plus(commissionAmount).toNumber());

    response = await airdrop.payAirdrop(
      beneficiary,
      transferAmount,
      commissionBeneficiary,
      commissionAmount,
      '',
      0,
      spender,
      airdropAmount,
      { from: worker }
    );
    assert.equal(await token.balanceOf.call(spender), 0);
    // Airdrop only uses as much of the airdrop amount as required to cover total paid
    assert.equal(
      (await token.allowance.call(airdropBudgetHolder, airdrop.address)).toNumber(),
      airdropAmount.minus(totalPaid).toNumber()
    );
    assert.equal((await token.balanceOf.call(beneficiary)).toNumber(), transferAmount.toNumber());
    assert.equal((await token.balanceOf.call(commissionBeneficiary)).toNumber(), commissionAmount.toNumber());
    // transferAmount == tokenAmount when currency is null
    // commissionAmount == commissionTokenAmount when currency is null
    checkAirdropPaymentEvent(
      response.logs[0],
      beneficiary,
      transferAmount,
      commissionBeneficiary,
      commissionAmount,
      '',
      0,
      spender,
      airdropUsed
    );
    airdropUtils.utils.logResponse(response, 'Airdrop.payAirdrop: ' + totalPaid);
  });

  context('when currency is not empty', async () => {
    before(async () => {
      // reset balances and approvals
      await token.setBalance(airdropBudgetHolder, airdropAmount);
      await token.setBalance(spender, 0);
      await token.setBalance(beneficiary, 0);
      await token.setBalance(commissionBeneficiary, 0);
      await token.approve(airdrop.address, airdropAmount, { from: airdropBudgetHolder });
    });

    it('fails to airdrop and pay if unable to validate margin and calculate BT amount', async () => {
      // intendedPricePoint == 0
      await airdropUtils.utils.expectThrow(
        airdrop.payAirdrop.call(
          beneficiary,
          transferAmount,
          commissionBeneficiary,
          commissionAmount,
          airdropUtils.currencies.abc,
          0,
          spender,
          airdropAmount,
          { from: worker }
        )
      );
    });

    it('successfully airdrops and pays', async () => {
      response = await airdrop.getPricePointAndCalculatedAmounts.call(
        transferAmount,
        commissionAmount,
        airdropUtils.currencies.abc
      );
      var intendedPricePoint = response[0];
      var tokenAmount = response[1];
      var commissionTokenAmount = response[2];
      await token.approve(airdrop.address, tokenAmount.plus(commissionTokenAmount), { from: spender });

      var returns = await airdrop.payAirdrop.call(
        beneficiary,
        transferAmount,
        commissionBeneficiary,
        commissionAmount,
        airdropUtils.currencies.abc,
        intendedPricePoint,
        spender,
        airdropAmount,
        { from: worker }
      );
      var totalPaid = returns[0],
        airdropUsed = returns[1];
      assert.equal(totalPaid.toNumber(), tokenAmount.plus(commissionTokenAmount).toNumber());

      response = await airdrop.payAirdrop(
        beneficiary,
        transferAmount,
        commissionBeneficiary,
        commissionAmount,
        airdropUtils.currencies.abc,
        intendedPricePoint,
        spender,
        airdropAmount,
        { from: worker }
      );
      assert.equal(await token.balanceOf.call(spender), 0);
      // Airdrop only uses as much of the airdrop amount as required to cover total paid
      assert.equal(
        (await token.allowance.call(airdropBudgetHolder, airdrop.address)).toNumber(),
        airdropAmount.minus(totalPaid).toNumber()
      );
      assert.equal((await token.balanceOf.call(beneficiary)).toNumber(), tokenAmount.toNumber());
      assert.equal((await token.balanceOf.call(commissionBeneficiary)).toNumber(), commissionTokenAmount.toNumber());
      checkAirdropPaymentEvent(
        response.logs[0],
        beneficiary,
        tokenAmount,
        commissionBeneficiary,
        commissionTokenAmount,
        airdropUtils.currencies.abc,
        intendedPricePoint,
        spender,
        airdropUsed
      );
      airdropUtils.utils.logResponse(response, 'Airdrop.payAirdrop (currency): ' + totalPaid);
    });
  });
};

function checkAirdropPaymentEvent(
  event,
  _beneficiary,
  _tokenAmount,
  _commissionBeneficiary,
  _commissionTokenAmount,
  _currency,
  _actualPricePoint,
  _spender,
  _airdropUsed
) {
  assert.equal(event.event, 'AirdropPayment');
  assert.equal(event.args._beneficiary, _beneficiary);
  assert.equal(event.args._tokenAmount.toNumber(), _tokenAmount);
  assert.equal(event.args._commissionBeneficiary, _commissionBeneficiary);
  assert.equal(event.args._commissionTokenAmount.toNumber(), _commissionTokenAmount);
  if (_currency) {
    assert.equal(web3.toAscii(event.args._currency), _currency);
  }
  assert.equal(event.args._actualPricePoint.toNumber(), _actualPricePoint);
  assert.equal(event.args._spender, _spender);
  assert.equal(event.args._airdropUsed.toNumber(), _airdropUsed);
}
