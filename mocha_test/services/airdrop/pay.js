/* global describe, it */

const chai = require('chai')
  , assert = chai.assert;

const rootPrefix = "../../.."
  , constants = require(rootPrefix + '/mocha_test/lib/constants')
  , BigNumber = require('bignumber.js')
  , utils = require(rootPrefix+'/mocha_test/lib/utils')
  , airdrop = require(rootPrefix + '/lib/contract_interact/airdrop')
  , workers = require(rootPrefix + '/lib/contract_interact/workers')
  , workersContract = new workers(constants.workersContractAddress, constants.chainId)
  , airdropOstUsd = new airdrop(constants.airdropOstUsdAddress, constants.chainId)
  , mockToken = require(rootPrefix + '/lib/contract_interact/EIP20TokenMock')
  , TC5 = new mockToken(constants.TC5Address)
  , btHelper = require(rootPrefix + '/lib/contract_interact/branded_token')
  , brandedTokenObject = new btHelper(constants.TC5Address, constants.chainId)
  , web3RpcProvider = require(rootPrefix + '/lib/web3/providers/rpc')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
;

const airdropKlass = require(rootPrefix + '/app/models/airdrop')
  , airdropModel = new airdropKlass()
  , airdropManager = require(rootPrefix + '/lib/airdrop_management/base')
;

async function getAmountFromCache(address) {
  console.log("========getAmountFromCache===== for address: "+address);
  const response = await brandedTokenObject.getBalanceFromCache(address);
  console.log(response);
  return new BigNumber(response.data.response);
};

describe('Airdrop Pay', function() {

  it('should pass the initial checks', async function() {
    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    assert.isDefined(constants.deployer);
    assert.isDefined(constants.ops);
    assert.isDefined(constants.account1);
    assert.notEqual(constants.deployer, constants.ops);
    assert.notEqual(constants.deployer, constants.account1);
    assert.notEqual(constants.ops, constants.account1);

    const currentBlockNumber = await web3RpcProvider.eth.getBlockNumber()
      , deactivationHeight = new BigNumber(currentBlockNumber).plus(10000)
    ;
    // set worker
    const setWorkerResponse = await workersContract.setWorker(
      constants.ops,
      constants.opsPassphrase,
      constants.workerAccount1,
      deactivationHeight.toNumber(),
      constants.gasUsed,
      constants.optionsReceipt);

    // verify if the transaction receipt is valid
    utils.verifyTransactionReceipt(setWorkerResponse);

    // Set Price Oracle
    const spoResponse = await airdropOstUsd.setPriceOracle(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyUSD,
      constants.priceOracles.OST.USD,
      constants.gasUsed,
      constants.optionsReceipt);

    // verify if the transaction receipt is valid
    utils.verifyTransactionReceipt(spoResponse);

    // verify if the transaction has was actually mined
    await utils.verifyIfMined(airdropOstUsd, spoResponse.data.transaction_hash);

    // set accepted margin
    const amResponse = await airdropOstUsd.setAcceptedMargin(
      constants.ops,
      constants.opsPassphrase,
      constants.currencyUSD,
      50,
      constants.gasUsed,
      constants.optionsReceipt);

    // verify if the transaction receipt is valid
    utils.verifyTransactionReceipt(amResponse);

    // verify if the transaction has was actually mined
    await utils.verifyIfMined(airdropOstUsd, amResponse.data.transaction_hash);

    // verify if its set
    const amResult = await airdropOstUsd.acceptedMargins(constants.currencyUSD);
    assert.equal(amResult.isSuccess(), true);
    assert.equal(50, amResult.data.acceptedMargins);

    // verify if its set
    const poResult = await airdropOstUsd.priceOracles(constants.currencyUSD);
    assert.equal(poResult.isSuccess(), true);
    assert.equal(constants.priceOracles.OST.USD, poResult.data.priceOracles);

    // Do Airdrop Setup if setup was not done
    var result = await airdropModel.getByContractAddress(constants.airdropOstUsdAddress);
    const airdropRecord = result[0];
    if (!airdropRecord) {
      const setupAirdropResponse = await airdropManager.setupAirdrop(
        constants.airdropOstUsdAddress,
        constants.chainId
      );
      assert.equal(setupAirdropResponse.isSuccess(), true);
    }

    await TC5.setBalance(
      constants.ops,
      constants.opsPassphrase,
      constants.account1,
      airdropOstUsd.toWei(constants.account1InitialBrandedTokenBalance),
      constants.gasUsed);


    const account1Balance = await TC5.balanceOf(constants.account1);
    assert.equal(account1Balance, airdropOstUsd.toWei(constants.account1InitialBrandedTokenBalance));

    await TC5.setBalance(
      constants.ops,
      constants.opsPassphrase,
      constants.account2,
      airdropOstUsd.toWei('0'),
      constants.gasUsed);

    const account2Balance = await TC5.balanceOf(constants.account2);
    assert.equal(account2Balance, airdropOstUsd.toWei('0'));

    await TC5.setBalance(
      constants.ops,
      constants.opsPassphrase,
      constants.account3,
      airdropOstUsd.toWei('0'),
      constants.gasUsed);

    const account3Balance = await TC5.balanceOf(constants.account3);
    assert.equal(account3Balance, airdropOstUsd.toWei('0'));

    await TC5.setBalance(
      constants.ops,
      constants.opsPassphrase,
      constants.account4,
      airdropOstUsd.toWei('0'),
      constants.gasUsed);

    const account4Balance = await TC5.balanceOf(constants.account4);
    assert.equal(account4Balance, airdropOstUsd.toWei('0'));

    // Populate Cache
    brandedTokenObject.getBalanceOf(constants.account1);
    brandedTokenObject.getBalanceOf(constants.account2);
    brandedTokenObject.getBalanceOf(constants.account3);
    brandedTokenObject.getBalanceOf(constants.account4);

  });

  it('AirdropManager: transfer branded token from reserve to airdropBudgetHolder', async function() {
    this.timeout(100000);
    const airdropBudgetAmountInWei = new BigNumber(airdropOstUsd.toWei(constants.airdropBudgetBrandedTokenBalance))
      ,  initialAccount1Balance = new BigNumber(await TC5.balanceOf(constants.account1));
    ;
    assert.isAbove(
      initialAccount1Balance.toString(),
      airdropBudgetAmountInWei.toString(),
      "account1 balance should be greater than airdropBudgetAmount")
    ;
    logger.info("=======initialAccount1Balance:", initialAccount1Balance.toString(),
      "\nairdropBudgetAmount:",airdropBudgetAmountInWei.toString(),
      "\nairdropOstUsdAddress:",constants.airdropOstUsdAddress);
    var transferToAirdropBudgetHolderResult = await airdropManager.transfer(
      constants.account1,
      constants.accountPassphrase1,
      constants.airdropOstUsdAddress,
      airdropBudgetAmountInWei.toString(),
      constants.gasUsed,
      constants.chainId,
      {returnType: constants.returnTypeReceipt}
    )
    logger.info("=======transferToAirdropBudgetHolderResult=======");
    logger.info(transferToAirdropBudgetHolderResult);
    const airdropBudgetHolderBalance = new BigNumber(await TC5.balanceOf(constants.airdropBudgetHolder));
    assert.equal(airdropBudgetHolderBalance.toString(), airdropBudgetAmountInWei.toString());
    // verify if the transaction receipt is valid
    await utils.verifyTransactionReceipt(transferToAirdropBudgetHolderResult);

    // verify if the transaction  was actually mined
    await utils.verifyIfMined(airdropOstUsd, transferToAirdropBudgetHolderResult.data.transaction_hash);

  });

  it('AirdropManager: aidropBudgetHolder is approving airdrop contract', async function() {
    var approveToAirdropBudgetHolderResult = await airdropManager.approve(
      constants.airdropOstUsdAddress,
      constants.airdropBudgetHolderPassphrase,
      constants.gasUsed,
      constants.chainId,
      {returnType: constants.returnTypeReceipt}
    )
    logger.info("=======approveToAirdropBudgetHolderResult=======");
    logger.info(approveToAirdropBudgetHolderResult);
    // verify if the transaction receipt is valid
    await utils.verifyTransactionReceipt(approveToAirdropBudgetHolderResult);

    // verify if the transaction  was actually mined
    await utils.verifyIfMined(airdropOstUsd, approveToAirdropBudgetHolderResult.data.transaction_hash);

  });

  // it('should pass when all parameters are valid', async function() {
  //   // eslint-disable-next-line no-invalid-this
  //   this.timeout(100000);
  //
  //   const initialAccount1Balance = new BigNumber(await TC5.balanceOf(constants.account1))
  //     , initialAccount3Balance = new BigNumber(await TC5.balanceOf(constants.account3))
  //     , initialAccount4Balance = new BigNumber(await TC5.balanceOf(constants.account4))
  //   ;
  //
  //   // Cache check
  //   const initialAccount1BalanceCache = await getAmountFromCache(constants.account1)
  //     , initialAccount3BalanceCache = await getAmountFromCache(constants.account3)
  //     , initialAccount4BalanceCache = await getAmountFromCache(constants.account4)
  //   ;
  //
  //   assert.equal(initialAccount1Balance.toNumber(), initialAccount1BalanceCache.toNumber(), "account1: Actual and cacheValue mismatch");
  //   assert.equal(initialAccount3Balance.toNumber(), initialAccount3BalanceCache.toNumber(), "account3: Actual and cacheValue mismatch");
  //   assert.equal(initialAccount4Balance.toNumber(), initialAccount4BalanceCache.toNumber(), "account4: Actual and cacheValue mismatch");
  //
  //   const beneficiary = constants.account3
  //     , commissionAmount = new BigNumber(airdropOstUsd.toWei('2'))
  //     , commissionBeneficiary = constants.account4
  //     , currency = constants.currencyUSD
  //     , transferAmount = new BigNumber(airdropOstUsd.toWei('7'))
  //   ;
  //
  //   const acceptedMarginData = await airdropOstUsd.acceptedMargins(currency);
  //   assert.equal(acceptedMarginData.isSuccess(), true);
  //
  //   const estimatedValues = await airdropOstUsd.getPricePointAndCalculatedAmounts(
  //     transferAmount,
  //     commissionAmount,
  //     currency);
  //
  //   assert.equal(estimatedValues.isSuccess(), true);
  //
  //   const estimatedTokenAmount = new BigNumber(estimatedValues.data.tokenAmount);
  //   const estimatedCommissionTokenAmount = new BigNumber(estimatedValues.data.commissionTokenAmount);
  //
  //   const intendedPricePoint = estimatedValues.data.pricePoint;
  //
  //   const estimatedTotalAmount = new BigNumber(0).plus(estimatedTokenAmount).plus(estimatedCommissionTokenAmount);
  //
  //
  //   // Approve airdropBudgetHolder for transfer
  //   const airdropBudgetHolderApproveResponse = await TC5.approve(
  //     constants.airdropBudgetHolder,
  //     constants.airdropBudgetHolderPassphrase,
  //     constants.airdropOstUsdAddress,
  //     airdropBudgetAmount,
  //     constants.gasUsed);
  //   console.log("airdropBudgetHolder approve");
  //   console.log(airdropBudgetHolderApproveResponse);
  //
  //   // Approve account1 for transfer
  //   const account1ApproveResponse = await TC5.approve(
  //     constants.account1,
  //     constants.accountPassphrase1,
  //     constants.airdropOstUsdAddress,
  //     estimatedTotalAmount,
  //     constants.gasUsed);
  //
  //   console.log("user approve");
  //   console.log(account1ApproveResponse);
  //
  //   const payResponse = await airdropOstUsd.pay(
  //     constants.workerAccount1,
  //     constants.workerAccountPassphrase1,
  //     beneficiary,
  //     transferAmount,
  //     commissionBeneficiary,
  //     commissionAmount,
  //     currency,
  //     intendedPricePoint,
  //     constants.account1,
  //     0,
  //     constants.gasUsed,
  //     {returnType: constants.returnTypeReceipt});
  //
  //   console.log("payResponse");
  //   console.log(payResponse);
  //
  //
  //   // verify if the transaction receipt is valid
  //   utils.verifyTransactionReceipt(payResponse);
  //
  //   // verify if the transaction is actually mined
  //   await utils.verifyIfMined(airdropOstUsd, payResponse.data.transaction_hash);
  //
  //   const account1Balance = new BigNumber(await TC5.balanceOf(constants.account1))
  //     , account3Balance = new BigNumber(await TC5.balanceOf(constants.account3))
  //     , account4Balance = new BigNumber(await TC5.balanceOf(constants.account4))
  //   ;
  //
  //   assert.equal(
  //     new BigNumber(0).plus(initialAccount1Balance)
  //       .minus(estimatedTokenAmount)
  //       .minus(estimatedCommissionTokenAmount)
  //       .toNumber(), account1Balance.toNumber());
  //
  //   assert.equal(
  //     new BigNumber(0).plus(initialAccount3Balance)
  //       .plus(estimatedTokenAmount)
  //       .toNumber(), account3Balance.toNumber());
  //
  //   assert.equal(
  //     new BigNumber(0).plus(initialAccount4Balance)
  //       .plus(estimatedCommissionTokenAmount)
  //       .toNumber(), account4Balance.toNumber());
  //
  //   // Cache check
  //   const finalAccount1BalanceCache = await getAmountFromCache(constants.account1)
  //     , finalAccount3BalanceCache = await getAmountFromCache(constants.account3)
  //     , finalAccount4BalanceCache = await getAmountFromCache(constants.account4)
  //   ;
  //
  //   assert.equal(account1Balance.toNumber(), finalAccount1BalanceCache.toNumber(), "account1: Actual and cacheValue mismatch after test");
  //   assert.equal(account3Balance.toNumber(), finalAccount3BalanceCache.toNumber(), "account3: Actual and cacheValue mismatch after test");
  //   assert.equal(account4Balance.toNumber(), finalAccount4BalanceCache.toNumber(), "account4: Actual and cacheValue mismatch after test");
  //
  // });

});