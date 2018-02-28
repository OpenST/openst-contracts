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
  , BrandedTokenKlass = require(rootPrefix + '/lib/contract_interact/branded_token')
  , brandedTokenObject = new BrandedTokenKlass(constants.TC5Address, constants.chainId)
  , web3RpcProvider = require(rootPrefix + '/lib/web3/providers/rpc')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
;


const airdropKlass = require(rootPrefix + '/app/models/airdrop')
  , airdropManager = require(rootPrefix + '/lib/airdrop_management/base')
  , BalanceCacheKlass = require(rootPrefix + '/lib/cache_management/balance')
  , balanceCache = new BalanceCacheKlass(constants.chainId, constants.TC5Address)
  , airdropAllocationProofDetailKlass = require(rootPrefix + '/app/models/airdrop_allocation_proof_detail')
;

var transferToAirdropBudgetHolderTransactionHash = ''
  , airdropAmountAllocatedUser1 = Object.keys(constants.airdropUsers)[0];
;

async function getAmountFromCache(address) {
  console.log("========getAmountFromCache===== for address: "+address);
  const response = await balanceCache.getBalance(address);
  console.log(response);
  return new BigNumber(response.data.response);
};

describe('Airdrop Pay', function() {

  it('should pass the initial checks', async function() {
    // eslint-disable-next-line no-invalid-this
    this.timeout(500000);

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

    const isWorkerResponse = await workersContract.isWorker(constants.workerAccount1);
    assert.equal(isWorkerResponse.isSuccess(), true);
    assert.equal(isWorkerResponse.data.isValid, true);
    // verify if the transaction receipt is valid
    utils.verifyTransactionReceipt(setWorkerResponse);
    // TODO Check for get Worker

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
    var airdropModel = new airdropKlass();
    var result = await airdropModel.getByContractAddress(constants.airdropOstUsdAddress);
    const airdropRecord = result[0];
    if (!airdropRecord) {
      const registerAirdropResponse = await airdropManager.registerAirdrop(
        constants.airdropOstUsdAddress,
        constants.chainId
      );
      assert.equal(registerAirdropResponse.isSuccess(), true);
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
      initialAccount1Balance.toNumber(),
      airdropBudgetAmountInWei.toNumber(),
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
    );
    logger.info("=======transferToAirdropBudgetHolderResult=======");
    logger.info(transferToAirdropBudgetHolderResult);
    const afterTransferAirdropBudgetHolderBalance = new BigNumber(await TC5.balanceOf(constants.airdropBudgetHolder));
    assert.equal(afterTransferAirdropBudgetHolderBalance.toString(), airdropBudgetAmountInWei.toString());
    // verify if the transaction receipt is valid
    await utils.verifyTransactionReceipt(transferToAirdropBudgetHolderResult);

    // verify if the transaction  was actually mined
    await utils.verifyIfMined(airdropOstUsd, transferToAirdropBudgetHolderResult.data.transaction_hash);
    transferToAirdropBudgetHolderTransactionHash = transferToAirdropBudgetHolderResult.data.transaction_hash;
  });

  it('AirdropManager: aidropBudgetHolder is approving airdrop contract', async function() {
    this.timeout(100000);
    var approveToAirdropBudgetHolderResult = await airdropManager.approve(
      constants.airdropOstUsdAddress,
      constants.airdropBudgetHolderPassphrase,
      constants.gasUsed,
      constants.chainId,
      {returnType: constants.returnTypeReceipt}
    );
    assert.equal(approveToAirdropBudgetHolderResult.isSuccess(), true);
    logger.info("=======approveToAirdropBudgetHolderResult=======");
    logger.info(approveToAirdropBudgetHolderResult);
    // verify if the transaction receipt is valid
    await utils.verifyTransactionReceipt(approveToAirdropBudgetHolderResult);

    // verify if the transaction  was actually mined
    await utils.verifyIfMined(airdropOstUsd, approveToAirdropBudgetHolderResult.data.transaction_hash);

  });

  it('AirdropManager: batch allocate to airdrop users', async function() {
    this.timeout(10000);
    var batchAllocateAirdropAmountResult = await airdropManager.batchAllocate(
      constants.airdropOstUsdAddress,
      transferToAirdropBudgetHolderTransactionHash,
      constants.airdropUsers
    );
    assert.equal(batchAllocateAirdropAmountResult.isSuccess(), true);
    var airdropAllocationProofDetailModel = new airdropAllocationProofDetailKlass();
    var result = await airdropAllocationProofDetailModel.getByTransactionHash(transferToAirdropBudgetHolderTransactionHash);
    assert.equal(result.airdrop_allocated_amount, result.airdrop_amount);
  });

  it('AirdropManager: Get User Balance and validate balance', async function() {
    this.timeout(5000);
    var userAddressArray = [];
    for (var ua in constants.airdropUsers){
      userAddressArray.push(ua);
    }
    // Without Cache
    var airdropBalanceResult = await airdropManager.getAirdropBalance(
      constants.chainId,
      constants.airdropOstUsdAddress,
      userAddressArray
    );
    assert.equal(airdropBalanceResult.isSuccess(), true);
    // With Cache
    var airdropBalanceResult = await airdropManager.getAirdropBalance(
      constants.chainId,
      constants.airdropOstUsdAddress,
      userAddressArray
    );
    assert.equal(airdropBalanceResult.isSuccess(), true);
    for (var userAddress in constants.airdropUsers){
      // Match airdrop allocated Balance
      assert.equal(airdropBalanceResult.data[userAddress].total_airdrop_amount, constants.airdropUsers[userAddress].airdrop_amount);
    }
  });

  it('should pass when all parameters are valid with currency USD and account1 allocated airdrop amount is 0', async function() {
    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    logger.info("========Get Amount from Contract=========");
    const initialAccount1Balance = new BigNumber(await TC5.balanceOf(constants.account1))
      , initialAccount3Balance = new BigNumber(await TC5.balanceOf(constants.account3))
      , initialAccount4Balance = new BigNumber(await TC5.balanceOf(constants.account4))
    ;

    // Cache check
    logger.info("========Get Amount from Cache=========");
    // const initialAccount1BalanceCache = await brandedTokenObject.getBalanceOf(constants.account1)
    //   , initialAccount3BalanceCache = await brandedTokenObject.getBalanceOf(constants.account3)
    //   , initialAccount4BalanceCache = await brandedTokenObject.getBalanceOf(constants.account4)
    // ;
    logger.info("========Asserting amount of cache and DB=========");
    // assert.equal(initialAccount1Balance.toString(), new BigNumber(initialAccount1BalanceCache.data.balance).toString(), "account1: Actual and cacheValue mismatch");
    // assert.equal(initialAccount3Balance.toString(), new BigNumber(initialAccount3BalanceCache.data.balance).toString(), "account3: Actual and cacheValue mismatch");
    // assert.equal(initialAccount4Balance.toString(), new BigNumber(initialAccount4BalanceCache.data.balance).toString(), "account4: Actual and cacheValue mismatch");

    const beneficiary = constants.account3
      , commissionAmount = new BigNumber(airdropOstUsd.toWei('1'))
      , commissionBeneficiary = constants.account4
      , currency = constants.currencyUSD
      , transferAmount = new BigNumber(airdropOstUsd.toWei('9'))
    ;

    const estimatedValues = await airdropOstUsd.getPricePointAndCalculatedAmounts(
      transferAmount,
      commissionAmount,
      currency);
    assert.equal(estimatedValues.isSuccess(), true);

    const estimatedTokenAmount = new BigNumber(estimatedValues.data.tokenAmount);
    const estimatedCommissionTokenAmount = new BigNumber(estimatedValues.data.commissionTokenAmount);
    const intendedPricePoint = estimatedValues.data.pricePoint;

    const estimatedTotalAmount = new BigNumber(0).plus(estimatedTokenAmount).plus(estimatedCommissionTokenAmount);

    // Approve account1 for transfer
    const account1ApproveResponse = await TC5.approve(
      constants.account1,
      constants.accountPassphrase1,
      constants.airdropOstUsdAddress,
      estimatedTotalAmount.plus(100).toString(),
      constants.gasUsed);

    logger.info("============spender approving to contract=============");
    logger.info(account1ApproveResponse);
    var worker1Balance = await web3RpcProvider.eth.getBalance(constants.workerAccount1);
    logger.info("\nconstants.workerAccount1.balance: ", worker1Balance);
    const payResponse = await airdropOstUsd.pay(
      constants.workerAccount1,
      constants.workerAccountPassphrase1,
      beneficiary,
      transferAmount.toString(),
      commissionBeneficiary,
      commissionAmount.toString(),
      currency,
      intendedPricePoint,
      constants.account1,
      constants.gasUsed,
      {returnType: constants.returnTypeReceipt, tag: 'airdrop.pay'});
    logger.info("============airdrop.pay response=============");
    logger.info(payResponse);


    // verify if the transaction receipt is valid
    utils.verifyTransactionReceipt(payResponse);

    // verify if the transaction is actually mined
    await utils.verifyIfMined(airdropOstUsd, payResponse.data.transaction_hash);

    // const account1Balance = new BigNumber(await TC5.balanceOf(constants.account1))
    //   , account3Balance = new BigNumber(await TC5.balanceOf(constants.account3))
    //   , account4Balance = new BigNumber(await TC5.balanceOf(constants.account4))
    // ;
    //
    // assert.equal(
    //   new BigNumber(0).plus(initialAccount1Balance)
    //     .minus(estimatedTokenAmount)
    //     .minus(estimatedCommissionTokenAmount)
    //     .toNumber(), account1Balance.toNumber());
    //
    // assert.equal(
    //   new BigNumber(0).plus(initialAccount3Balance)
    //     .plus(estimatedTokenAmount)
    //     .toNumber(), account3Balance.toNumber());
    //
    // assert.equal(
    //   new BigNumber(0).plus(initialAccount4Balance)
    //     .plus(estimatedCommissionTokenAmount)
    //     .toNumber(), account4Balance.toNumber());
    //
    // // Cache check
    // const finalAccount1BalanceCache = await getAmountFromCache(constants.account1)
    //   , finalAccount3BalanceCache = await getAmountFromCache(constants.account3)
    //   , finalAccount4BalanceCache = await getAmountFromCache(constants.account4)
    // ;

  });

  it('Airdrop.Pay: It exits', async function() {
    process.exit(0);
  });

});