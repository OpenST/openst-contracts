/* global describe, it */

const chai = require('chai'),
  assert = chai.assert;

const rootPrefix = '../../..',
  constants = require(rootPrefix + '/mocha_test/lib/constants'),
  BigNumber = require('bignumber.js'),
  utils = require(rootPrefix + '/mocha_test/lib/utils'),
  InstanceComposer = require(rootPrefix + '/instance_composer'),
  configStrategy = require(rootPrefix + '/config/temp.json'),
  instanceComposer = new InstanceComposer(configStrategy),
  logger = require(rootPrefix + '/helpers/custom_console_logger'),
  paramErrorConfig = require(rootPrefix + '/config/param_error_config'),
  apiErrorConfig = require(rootPrefix + '/config/api_error_config'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

const errorConfig = {
  param_error_config: paramErrorConfig,
  api_error_config: apiErrorConfig
};

require(rootPrefix + '/lib/contract_interact/airdrop');
require(rootPrefix + '/lib/contract_interact/EIP20TokenMock');
require(rootPrefix + '/lib/contract_interact/branded_token');
require(rootPrefix + '/lib/providers/web3_factory');
require(rootPrefix + '/lib/cache_management/airdrop_model');
require(rootPrefix + '/app/models/user_airdrop_detail');
require(rootPrefix + '/app/models/airdrop_allocation_proof_detail');
require(rootPrefix + '/services/manifest');

const airdrop = instanceComposer.getAirdropInteractClass(),
  mockToken = instanceComposer.getMockTokenInteractClass(),
  BrandedTokenKlass = instanceComposer.getBrandedTokenInteractClass(),
  web3ProviderFactory = instanceComposer.getWeb3ProviderFactory(),
  web3Provider = web3ProviderFactory.getProvider(web3ProviderFactory.typeWS),
  AirdropModelCacheKlass = instanceComposer.getCacheManagementAirdropModelClass(),
  airdropAllocationProofDetailKlass = instanceComposer.getAirdropAllocationProofDetailModelKlass(),
  UserAirdropDetailKlass = instanceComposer.getUserAirdropDetailModelClass(),
  manifest = instanceComposer.getServiceManifest(),
  SetWorkerKlass = manifest.workers.setWorker,
  IsWorkerKlass = manifest.workers.isWorker,
  RegisterKlass = manifest.airdropManager.registerAirdrop,
  TransferKlass = manifest.airdropManager.transfer,
  ApproveKlass = manifest.airdropManager.approve,
  BatchAllocatorKlass = manifest.airdropManager.batchAllocator,
  UserBalanceKlass = manifest.airdropManager.userBalance,
  PayKlass = manifest.airdropManager.pay,
  SetPriceOracleKlass = manifest.airdropManager.setPriceOracle,
  SetAcceptedMarginKlass = manifest.airdropManager.setAcceptedMargin;

const airdropOstUsd = new airdrop(constants.airdropOstUsdAddress, constants.chainId),
  TC5 = new mockToken(constants.TC5Address),
  brandedTokenObject = new BrandedTokenKlass(constants.TC5Address, constants.chainId);

var transferToAirdropBudgetHolderTransactionHash = '';

/**
 * Utitlity function to test set accepted margin
 *
 * @param {Object} airdropObject - airdrop object
 * @param {string} currency - currency
 * @param {string} margin - accepted margin
 *
 */

async function setAcceptedMargin(airdropObject, currency, margin) {
  // set accepted margin
  const SetAcceptedMarginObject = new SetAcceptedMarginKlass({
    airdrop_contract_address: constants.airdropOstUsdAddress,
    chain_id: constants.chainId,
    sender_address: constants.ops,
    sender_passphrase: constants.opsPassphrase,
    currency: currency,
    accepted_margin: margin,
    gas_price: constants.gasUsed,
    options: constants.optionsReceipt
  });
  const amResponse = await SetAcceptedMarginObject.perform();
  assert.equal(amResponse.isSuccess(), true);
  // verify if the transaction receipt is valid
  utils.verifyTransactionReceipt(amResponse);
  // verify if the transaction has was actually mined
  await utils.verifyIfMined(airdropObject, amResponse.data.transaction_hash);
  // verify if its set
  const amResult = await airdropObject.acceptedMargins(currency);
  assert.equal(amResult.isSuccess(), true);
  assert.equal(margin, amResult.data.acceptedMargins);
}

/**
 * Utitlity function to test set price oracle
 *
 * @param {Object} airdropObject - airdrop object
 * @param {string} currency - currency
 * @param {string} address - price oracle address
 *
 */
async function setPriceOracle(airdropObject, currency, address) {
  // Set Price Oracle
  const SetPriceOracleObject = new SetPriceOracleKlass({
    airdrop_contract_address: constants.airdropOstUsdAddress,
    chain_id: constants.chainId,
    sender_address: constants.ops,
    sender_passphrase: constants.opsPassphrase,
    currency: currency,
    price_oracle_contract_address: address,
    gas_price: constants.gasUsed,
    options: constants.optionsReceipt
  });
  const spoResponse = await SetPriceOracleObject.perform();
  assert.equal(spoResponse.isSuccess(), true);
  // verify if the transaction receipt is valid
  utils.verifyTransactionReceipt(spoResponse);
  // verify if the transaction has was actually mined
  await utils.verifyIfMined(airdropObject, spoResponse.data.transaction_hash);
  // verify if its set
  const poResult = await airdropObject.priceOracles(currency);
  assert.equal(poResult.isSuccess(), true);
  assert.equal(address, poResult.data.priceOracles);
}

/**
 * Utitlity function to test set worker
 *
 * @param {string} workerAddress - worker address
 * @param {Bignumber} deactivationHeight - deactivation height of the worker
 *
 */
async function setWorker(workerAddress, deactivationHeight) {
  const SetWorkerObject = new SetWorkerKlass({
    workers_contract_address: constants.workersContractAddress,
    sender_address: constants.ops,
    sender_passphrase: constants.opsPassphrase,
    worker_address: workerAddress,
    deactivation_height: deactivationHeight.toString(10),
    gas_price: constants.gasUsed,
    chain_id: constants.chainId,
    options: constants.optionsReceipt
  });
  const setWorkerResponse = await SetWorkerObject.perform();

  assert.equal(setWorkerResponse.isSuccess(), true);
  // verify if the transaction receipt is valid
  utils.verifyTransactionReceipt(setWorkerResponse);

  // confirm that worker is a set
  const IsWorkerObject = new IsWorkerKlass({
    workers_contract_address: constants.workersContractAddress,
    worker_address: workerAddress,
    chain_id: constants.chainId
  });
  const isWorkerResponse = await IsWorkerObject.perform();
  assert.equal(isWorkerResponse.isSuccess(), true);
  assert.equal(isWorkerResponse.data.isValid, true);
}

/**
 * Utitlity function to test setBalance
 *
 * @param {Object} token - branded token object
 * @param {string} address - account address
 * @param {string} amount - amount that need to be set
 * @param {BigNumber} gasPrice - gas price
 *
 */
async function setBalance(token, address, amount) {
  const amountInWei = airdropOstUsd.toWei(amount);
  await token.setBalance(constants.ops, constants.opsPassphrase, address, amountInWei, constants.gasUsed);
  // check if the balance was set
  const accountBalance = await token.balanceOf(address);
  assert.equal(accountBalance, amountInWei);
}

/**
 * Utitlity function to get airdrop id from airdrop address
 *
 * @param {string} airdropAddress - airdrop address
 *
 * @return {Object} - formatted response
 */

async function getAirdropIdFromAirdropAddress(airdropAddress) {
  const airdropModelCacheObject = new AirdropModelCacheKlass({ useObject: true, contractAddress: airdropAddress }),
    airdropModelCacheResponse = await airdropModelCacheObject.fetch(),
    airdropRecord = airdropModelCacheResponse.data[airdropAddress];
  if (airdropRecord) {
    return responseHelper.successWithData({ airdropId: airdropRecord.id });
  }
  let errorParams = {
    internal_error_identifier: 'gaidfad',
    api_error_identifier: 'data_not_found',
    error_config: errorConfig,
    debug_options: {}
  };
  return responseHelper.error(errorParams);
}

/**
 * Utitlity function to register airdrop if not already registered
 *
 * @param {string} airdropAddress - airdrop address
 *
 */
async function registerAirdrop(airdropAddress) {
  // Do Airdrop Setup if setup was not done
  const airDropIdResponse = await getAirdropIdFromAirdropAddress(airdropAddress);
  if (airDropIdResponse.isFailure()) {
    const RegisterObject = new RegisterKlass({
      airdrop_contract_address: airdropAddress,
      chain_id: constants.chainId
    });
    const registerAirdropResponse = await RegisterObject.perform();
    assert.equal(registerAirdropResponse.isSuccess(), true);

    // check again if the database awas set;
    const airDropIdAfterRegisterResponse = await getAirdropIdFromAirdropAddress(airdropAddress);
    assert.equal(airDropIdAfterRegisterResponse.isSuccess(), true);
  }
}

/**
 * Utitlity function to transfer token to airdrop budget holder
 *
 * @param {Object} token - Branded token object
 * @param {string} airdropAddress - airdrop address
 * @param {string} fromAddress - reserve address
 * @param {string} fromPassphrase - passphrase
 * @param {string} budgetHolderAddress - budget holder address
 * @param {string} amount - amount to transfer to budget holder
 *
 * @return {transaction hash}
 */
async function transferTokenToAirdropBugetHolder(
  token,
  airdropAddress,
  fromAddress,
  fromPassphrase,
  budgetHolderAddress,
  amount
) {
  const airdropBudgetAmountInWei = new BigNumber(airdropOstUsd.toWei(amount));
  const initialBalance = new BigNumber(await token.balanceOf(fromAddress));
  const beforeTransferAirdropBudgetHolderBalance = new BigNumber(await token.balanceOf(budgetHolderAddress));

  logger.debug(
    'initialBalance:',
    initialBalance.toString(10),
    '\nairdropBudgetAmount:',
    airdropBudgetAmountInWei.toString(10),
    '\nairdropAddress:',
    airdropAddress
  );

  assert.equal(
    initialBalance.gte(airdropBudgetAmountInWei),
    true,
    'insufficent balance to transfer amount to budgetHolderAddress'
  );

  const TransferObject = new TransferKlass({
    sender_address: fromAddress,
    sender_passphrase: fromPassphrase,
    airdrop_contract_address: airdropAddress,
    amount: airdropBudgetAmountInWei,
    gas_price: constants.gasUsed,
    chain_id: constants.chainId,
    options: constants.optionsReceipt
  });
  const transferToAirdropBudgetHolderResult = await TransferObject.perform();
  logger.debug('=======transferToAirdropBudgetHolderResult=======');
  logger.debug(transferToAirdropBudgetHolderResult);
  assert.equal(transferToAirdropBudgetHolderResult.isSuccess(), true);
  // verify if the transaction receipt is valid
  await utils.verifyTransactionReceipt(transferToAirdropBudgetHolderResult);
  // verify if the transaction  was actually mined
  await utils.verifyIfMined(airdropOstUsd, transferToAirdropBudgetHolderResult.data.transaction_hash);

  const afterTransferAirdropBudgetHolderBalance = new BigNumber(await token.balanceOf(budgetHolderAddress));
  assert.equal(
    beforeTransferAirdropBudgetHolderBalance
      .plus(airdropBudgetAmountInWei)
      .equals(afterTransferAirdropBudgetHolderBalance),
    true
  );

  // set transaction hash
  transferToAirdropBudgetHolderTransactionHash = transferToAirdropBudgetHolderResult.data.transaction_hash;
  return transferToAirdropBudgetHolderTransactionHash;
}

/**
 * Utitlity function get user airdrop balance
 *
 * @param {string} airdropAddress - airdrop address
 * @param {Array} userAddressArray - user address array
 *
 * @return {Object} - formatted response
 */
async function getUserAirdropBalanceFromCache(airdropAddress, userAddressArray) {
  // Get cache value
  const UserBalanceObject = new UserBalanceKlass({
    chain_id: constants.chainId,
    airdrop_contract_address: airdropAddress,
    user_addresses: userAddressArray
  });
  const airdropBalanceResult = await UserBalanceObject.perform();
  const zeroAmount = {
    totalAirdropAmount: '0',
    totalAirdropUsedAmount: '0',
    balanceAirdropAmount: '0'
  };
  var responseData = {};
  if (airdropBalanceResult.isSuccess()) {
    responseData = airdropBalanceResult.data;
  }
  var data = {};
  for (var i = userAddressArray.length - 1; i >= 0; i--) {
    if (responseData[userAddressArray[i]]) {
      data[userAddressArray[i]] = responseData[userAddressArray[i]];
    } else {
      data[userAddressArray[i]] = zeroAmount;
    }
  }
  return responseHelper.successWithData(data);
}

/**
 * Utitlity function get user airdrop balance form DB, bypass cache layer
 *
 * @param {string} airdropAddress - airdrop address
 * @param {Array} userAddressArray - user address array
 *
 * @return {Object} - formatted response
 */
async function getUserAirdropBalanceFromDB(airdropAddress, userAddressArray) {
  const airDropIdResponse = await getAirdropIdFromAirdropAddress(airdropAddress);
  if (airDropIdResponse.isSuccess()) {
    const airdropId = airDropIdResponse.data.airdropId;
    const userAirdropDetailModel = new UserAirdropDetailKlass();

    const queryResponse = await userAirdropDetailModel.getByUserAddresses(airdropId, userAddressArray);

    var responseData = {};
    if (queryResponse.isSuccess()) {
      responseData = queryResponse.data;
    }
    var data = {};
    for (var i = userAddressArray.length - 1; i >= 0; i--) {
      if (responseData[userAddressArray[i]]) {
        data[userAddressArray[i]] = responseData[userAddressArray[i]];
      } else {
        data[userAddressArray[i]] = {
          totalAirdropAmount: '0',
          totalAirdropUsedAmount: '0',
          balanceAirdropAmount: '0'
        };
      }
    }
    return responseHelper.successWithData(data);
  }
  return airDropIdResponse;
}

/**
 * Utitlity function to compare the airdrop balances from DB and cache
 *
 * @param {Object} dbBalance - airdrop balance from DB
 * @param {Object} cacheBalance - airdrop balance from cache
 *
 */
function validateDBandCacheAirdropBalances(dbBalance, cacheBalance) {
  const compare = function(obj1, obj2) {
    assert.equal(obj1.totalAirdropAmount, obj2.totalAirdropAmount);
    assert.equal(obj1.totalAirdropUsedAmount, obj2.totalAirdropUsedAmount);
    assert.equal(obj1.balanceAirdropAmount, obj2.balanceAirdropAmount);
  };

  const dbUserKeys = Object.keys(dbBalance);
  const cacheUserKeys = Object.keys(cacheBalance);
  assert.equal(dbUserKeys.length, cacheUserKeys.length);
  for (var i = dbUserKeys.length - 1; i >= 0; i--) {
    const dbObject = dbBalance[dbUserKeys[i]];
    const cacheObject = cacheBalance[cacheUserKeys[i]];
    assert.isDefined(dbObject);
    assert.isDefined(cacheObject);
    compare(dbObject, cacheObject);
  }
}

/**
 * Utitlity function to get balance of address from contract
 *
 * @param {Object} token - token
 * @param {string} address - address whose balances need to be found
 *
 */
async function getBalanceFromContract(token, address) {
  var balances = {};
  for (var i = address.length - 1; i >= 0; i--) {
    const addressKey = address[i];
    balances[addressKey] = new BigNumber(await token.balanceOf(addressKey));
  }
  return balances;
}

/**
 * Utitlity function to get balance of address from cache
 *
 * @param {Object} token - token
 * @param {string} address - address whose balances need to be found
 *
 */
async function getBalanceFromCache(tokenObj, address) {
  var balances = {};
  for (var i = address.length - 1; i >= 0; i--) {
    const addressKey = address[i];
    const balance = await tokenObj.getBalanceOf(addressKey);
    assert.equal(balance.isSuccess(), true);
    balances[addressKey] = new BigNumber(balance.data.balance);
  }
  return balances;
}

/**
 * Utitlity function to compare balances from cache and contract
 *
 * @param {Object} contractBalances - balances from contract
 * @param {Object} cacheBalance - balances from cache
 *
 */

function validateContractAndCacheBalance(cacheBalance, contractBalances) {
  const contractKeys = Object.keys(cacheBalance);
  const cacheKeys = Object.keys(contractBalances);
  assert.equal(contractKeys.length, cacheKeys.length);
  for (var i = contractKeys.length - 1; i >= 0; i--) {
    const balanceFromContract = contractBalances[contractKeys[i]];
    const balanceFromCache = cacheBalance[contractKeys[i]];
    assert.isDefined(balanceFromContract);
    assert.isDefined(balanceFromCache);
    assert.equal(balanceFromCache.equals(balanceFromContract), true);
  }
}

/**
 * Utitlity function to validate if airdrop was transfered successfully
 *
 * @param {string} accountAddress - user address
 * @param {Object} initialAirdropBalance - Initial airdrop balance
 * @param {Object} currentAirdropBalance - Current airdrop balance
 * @param {BigNumber} airdropAmountTransfered - estimated airdrop amount that was transfered
 */
function validateAirdropTransferSuccess(
  accountAddress,
  initialAirdropBalance,
  currentAirdropBalance,
  airdropAmountTransfered
) {
  const initialAirdropBalanceData = initialAirdropBalance.data[accountAddress];
  const currentAirdropBalanceData = currentAirdropBalance.data[accountAddress];

  assert.isDefined(initialAirdropBalanceData);
  assert.isDefined(currentAirdropBalanceData);

  const intialTotalAirdropAmount = new BigNumber(initialAirdropBalanceData.totalAirdropAmount);
  const initialTotalAirdropUsedAmount = new BigNumber(initialAirdropBalanceData.totalAirdropUsedAmount);
  const initialBalanceAirdropAmount = new BigNumber(initialAirdropBalanceData.balanceAirdropAmount);

  const totalAirdropAmount = new BigNumber(currentAirdropBalanceData.totalAirdropAmount);
  const totalAirdropUsedAmount = new BigNumber(currentAirdropBalanceData.totalAirdropUsedAmount);
  const balanceAirdropAmount = new BigNumber(currentAirdropBalanceData.balanceAirdropAmount);

  assert.equal(intialTotalAirdropAmount.equals(totalAirdropAmount), true);
  assert.equal(initialTotalAirdropUsedAmount.plus(airdropAmountTransfered).equals(totalAirdropUsedAmount), true);
  assert.equal(initialBalanceAirdropAmount.minus(airdropAmountTransfered).equals(balanceAirdropAmount), true);
}

function validateTransferSuccess(
  estimatedTokenAmount,
  estimatedCommissionTokenAmount,
  estimatedAirdropUsed,
  spenderAddress,
  beneficiary,
  commissionBeneficiary,
  airdropBudgetHolder,
  initialBalances,
  currentBalances
) {
  assert.isDefined(estimatedTokenAmount);
  assert.isDefined(estimatedCommissionTokenAmount);
  assert.isDefined(estimatedAirdropUsed);
  assert.isDefined(spenderAddress);
  assert.isDefined(beneficiary);
  assert.isDefined(commissionBeneficiary);
  assert.isDefined(airdropBudgetHolder);
  assert.isDefined(initialBalances);
  assert.isDefined(currentBalances);

  const estimatedTotalAmount = estimatedTokenAmount.plus(estimatedCommissionTokenAmount);
  const actualTransferAmount = estimatedTotalAmount.minus(estimatedAirdropUsed);
  const calculatedBenficiaryAmount = initialBalances[beneficiary].plus(estimatedTokenAmount);
  const calculatedCommisionAmount = initialBalances[commissionBeneficiary].plus(estimatedCommissionTokenAmount);
  const calculatedSpenderAmount = initialBalances[spenderAddress].minus(actualTransferAmount);
  const calculatesBugdetHolderAmount = initialBalances[airdropBudgetHolder].minus(estimatedAirdropUsed);

  assert.equal(calculatedBenficiaryAmount.equals(currentBalances[beneficiary]), true);
  assert.equal(calculatedCommisionAmount.equals(currentBalances[commissionBeneficiary]), true);
  assert.equal(calculatedSpenderAmount.equals(currentBalances[spenderAddress]), true);
  assert.equal(calculatesBugdetHolderAmount.equals(currentBalances[airdropBudgetHolder]), true);
}

/**
 * Utitlity function to populate the cache of all test accounts
 *
 */
async function populateCache() {
  // Populate Cache
  await brandedTokenObject.getBalanceOf(constants.account1);
  await brandedTokenObject.getBalanceOf(constants.account2);
  await brandedTokenObject.getBalanceOf(constants.account3);
  await brandedTokenObject.getBalanceOf(constants.account4);
  await brandedTokenObject.getBalanceOf(constants.account5);
  await brandedTokenObject.getBalanceOf(constants.airdropBudgetHolder);
}

// Tests starts here
describe('Airdrop Pay', function() {
  it('should pass the initial checks', async function() {
    // eslint-disable-next-line no-invalid-this
    this.timeout(500000);

    // check if the address required for the testing are defined.
    assert.isDefined(constants.deployer);
    assert.isDefined(constants.ops);
    assert.isDefined(constants.account1);
    assert.isDefined(constants.workerAccount1);
    assert.isDefined(constants.airdropBudgetHolder);

    assert.notEqual(constants.deployer, constants.ops);
    assert.notEqual(constants.deployer, constants.account1);
    assert.notEqual(constants.ops, constants.account1);

    // set worker
    logger.debug('============= Set worker =============');
    const currentBlockNumber = await web3Provider.eth.getBlockNumber();
    await setWorker(constants.workerAccount1, new BigNumber(currentBlockNumber).plus(100000000000));

    // Set Price Oracle
    logger.debug('============= Set Price Oracle =============');
    await setPriceOracle(airdropOstUsd, constants.currencyUSD, constants.priceOracles.OST.USD);

    // set accepted margin
    logger.debug('============= Set accepted margin =============');
    await setAcceptedMargin(airdropOstUsd, constants.currencyUSD, 50);

    // set balance for account 1 (Spender)
    logger.debug('============= Set account 1 balance =============');
    await setBalance(TC5, constants.account1, constants.account1InitialBrandedTokenBalance);

    // reset balance for account 2 to 100
    logger.debug('============= Set account 2 balance =============');
    await setBalance(TC5, constants.account2, '100');

    // reset balance for account 3 to 0
    logger.debug('============= Set account 3 balance =============');
    await setBalance(TC5, constants.account3, '0');

    // reset balance for account 4 to 0
    logger.debug('============= Set account 4 balance =============');
    await setBalance(TC5, constants.account4, '0');

    // reset balance of account airdropBudgetHolder to 0
    logger.debug('=============  Set airdropBudgetHolder balance =============');
    await setBalance(TC5, constants.airdropBudgetHolder, '0');

    // Do Airdrop Setup if setup was not done
    logger.debug('============= Do Airdrop Setup if setup was not done =============');
    await registerAirdrop(constants.airdropOstUsdAddress);

    // Populate Cache
    populateCache();
  });

  it('AirdropManager: transfer branded token from reserve to airdropBudgetHolder and approve airdrop contract', async function() {
    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    const address = [constants.account1, constants.airdropBudgetHolder];
    const initalBalancesFromContract = await getBalanceFromContract(TC5, address);
    const initalBalancesCache = await getBalanceFromCache(brandedTokenObject, address);
    validateContractAndCacheBalance(initalBalancesFromContract, initalBalancesCache);

    // transfer amount
    await transferTokenToAirdropBugetHolder(
      TC5,
      constants.airdropOstUsdAddress,
      constants.account1,
      constants.accountPassphrase1,
      constants.airdropBudgetHolder,
      constants.airdropBudgetBrandedTokenBalance
    );

    const balanceFromContract = await getBalanceFromContract(TC5, address);
    const balancesFromCache = await getBalanceFromCache(brandedTokenObject, address);
    validateContractAndCacheBalance(balanceFromContract, balancesFromCache);

    // approve
    const ApproveObject = new ApproveKlass({
      airdrop_contract_address: constants.airdropOstUsdAddress,
      airdrop_budget_holder_passphrase: constants.airdropBudgetHolderPassphrase,
      gas_price: constants.gasUsed,
      chain_id: constants.chainId,
      options: constants.optionsReceipt
    });
    const approveToAirdropBudgetHolderResult = await ApproveObject.perform();
    logger.debug('=======approveToAirdropBudgetHolderResult=======');
    logger.debug(approveToAirdropBudgetHolderResult);

    assert.equal(approveToAirdropBudgetHolderResult.isSuccess(), true);
    // verify if the transaction receipt is valid
    await utils.verifyTransactionReceipt(approveToAirdropBudgetHolderResult);
    // verify if the transaction  was actually mined
    await utils.verifyIfMined(airdropOstUsd, approveToAirdropBudgetHolderResult.data.transaction_hash);
  });

  it('AirdropManager: batch allocate to airdrop users and check user balance', async function() {
    // eslint-disable-next-line no-invalid-this
    this.timeout(10000);

    var airdropUsers = constants.airdropUsers;
    airdropUsers[constants.account2] = { airdropAmount: '100000000000000000000', expiryTimestamp: 0 };

    // checks for cache and DB consistency
    const beforeAllocationBalanceFromDB = await getUserAirdropBalanceFromDB(
      constants.airdropOstUsdAddress,
      Object.keys(airdropUsers)
    );
    const beforeAllocationBalanceFromCache = await getUserAirdropBalanceFromCache(
      constants.airdropOstUsdAddress,
      Object.keys(airdropUsers)
    );
    validateDBandCacheAirdropBalances(beforeAllocationBalanceFromDB.data, beforeAllocationBalanceFromCache.data);

    const BatchAllocatorObject = new BatchAllocatorKlass({
      airdrop_contract_address: constants.airdropOstUsdAddress,
      transaction_hash: transferToAirdropBudgetHolderTransactionHash,
      airdrop_users: airdropUsers,
      chain_id: constants.chainId
    });
    const batchAllocateAirdropAmountResult = await BatchAllocatorObject.perform();

    assert.equal(batchAllocateAirdropAmountResult.isSuccess(), true);
    var airdropAllocationProofDetailModel = new airdropAllocationProofDetailKlass();
    var result = await airdropAllocationProofDetailModel.getByTransactionHash(
      transferToAirdropBudgetHolderTransactionHash
    );
    var airdropAllocationProofDetailRecord = result[0];
    // airdrop_allocated_amount is less than or equal to airdrop_amount
    assert.equal(
      new BigNumber(airdropAllocationProofDetailRecord.airdrop_allocated_amount).lte(
        new BigNumber(airdropAllocationProofDetailRecord.airdrop_amount)
      ),
      true
    );

    // checks for cache and DB consistency
    const afterAllocationBalanceFromDB = await getUserAirdropBalanceFromDB(
      constants.airdropOstUsdAddress,
      Object.keys(airdropUsers)
    );
    const afterAllocationBalanceFromCache = await getUserAirdropBalanceFromCache(
      constants.airdropOstUsdAddress,
      Object.keys(airdropUsers)
    );
    validateDBandCacheAirdropBalances(afterAllocationBalanceFromDB.data, afterAllocationBalanceFromCache.data);

    // check if the airdrop balance reflects the proper value.
    const allUserKeys = Object.keys(airdropUsers);
    for (var i = allUserKeys.length - 1; i >= 0; i--) {
      const userKey = allUserKeys[i];
      const initialTotalAirdropAmount = new BigNumber(beforeAllocationBalanceFromDB.data[userKey].totalAirdropAmount);
      const initialTotalAirdropUsedAmount = new BigNumber(
        beforeAllocationBalanceFromDB.data[userKey].totalAirdropUsedAmount
      );
      const initialBalanceAirdropAmount = new BigNumber(
        beforeAllocationBalanceFromDB.data[userKey].balanceAirdropAmount
      );

      const totalAirdropAmount = new BigNumber(afterAllocationBalanceFromDB.data[userKey].totalAirdropAmount);
      const totalAirdropUsedAmount = new BigNumber(afterAllocationBalanceFromDB.data[userKey].totalAirdropUsedAmount);
      const balanceAirdropAmount = new BigNumber(afterAllocationBalanceFromDB.data[userKey].balanceAirdropAmount);

      assert.equal(
        initialTotalAirdropAmount.plus(new BigNumber(airdropUsers[userKey].airdropAmount)).equals(totalAirdropAmount),
        true
      );

      assert.equal(initialTotalAirdropUsedAmount.equals(totalAirdropUsedAmount), true);
      assert.equal(initialTotalAirdropUsedAmount.equals(0), true);

      assert.equal(
        initialBalanceAirdropAmount
          .plus(new BigNumber(airdropUsers[userKey].airdropAmount))
          .equals(balanceAirdropAmount),
        true
      );
    }
  });

  it('should fail when worker is not whitelisted', async function() {
    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    // Populate Cache
    populateCache();

    const beneficiary = constants.account3,
      commissionAmount = new BigNumber(airdropOstUsd.toWei('0.9')),
      commissionBeneficiary = constants.account4,
      currency = constants.currencyUSD,
      transferAmount = new BigNumber(airdropOstUsd.toWei('1.18')),
      spenderAddress = constants.account2,
      spenderPassphrase = constants.accountPassphrase2,
      airdropBudgetHolder = constants.airdropBudgetHolder;

    // checks for account balance cache and DB consistency
    logger.debug('============ Validating consistency for account balance form cache and contract =============');
    const address = [spenderAddress, beneficiary, commissionBeneficiary, airdropBudgetHolder];
    const initalBalancesFromContract = await getBalanceFromContract(TC5, address);
    const initalBalancesCache = await getBalanceFromCache(brandedTokenObject, address);
    validateContractAndCacheBalance(initalBalancesFromContract, initalBalancesCache);

    // checks for airdrop balance cache and DB consistency
    logger.debug('============ Validating consistency for airdrop balance form cache and DB =============');
    const airdropUserAddress = [spenderAddress];
    const initialAirdropBalanceFromDB = await getUserAirdropBalanceFromDB(
      constants.airdropOstUsdAddress,
      airdropUserAddress
    );
    const initialAirdropBalanceFromCache = await getUserAirdropBalanceFromCache(
      constants.airdropOstUsdAddress,
      airdropUserAddress
    );
    validateDBandCacheAirdropBalances(initialAirdropBalanceFromDB.data, initialAirdropBalanceFromCache.data);

    const UserBalanceObject = new UserBalanceKlass({
      chain_id: constants.chainId,
      airdrop_contract_address: constants.airdropOstUsdAddress,
      user_addresses: [spenderAddress]
    });
    const airdropBalanceResult = await UserBalanceObject.perform();
    assert.equal(airdropBalanceResult.isSuccess(), true);
    const availableAirdropBalance = new BigNumber(airdropBalanceResult.data[spenderAddress].balanceAirdropAmount);

    const estimatedValues = await airdropOstUsd.getPricePointAndCalculatedAmounts(
      transferAmount,
      commissionAmount,
      currency
    );
    assert.equal(estimatedValues.isSuccess(), true);

    const estimatedTokenAmount = new BigNumber(estimatedValues.data.tokenAmount);
    const estimatedCommissionTokenAmount = new BigNumber(estimatedValues.data.commissionTokenAmount);
    const intendedPricePoint = estimatedValues.data.pricePoint;

    const estimatedTotalAmount = new BigNumber(0).plus(estimatedTokenAmount).plus(estimatedCommissionTokenAmount);

    const estimatedAirdropUsed = BigNumber.min(estimatedTotalAmount, availableAirdropBalance);
    logger.debug('============ estimatedAirdropUsed ============');
    logger.debug(estimatedAirdropUsed);

    // Approve account1 for transfer
    const accountApproveResponse = await TC5.approve(
      spenderAddress,
      spenderPassphrase,
      constants.airdropOstUsdAddress,
      estimatedTotalAmount.plus(100),
      constants.gasUsed
    );

    logger.debug('============spender approving to contract=============');
    logger.debug(accountApproveResponse);
    var worker1Balance = await web3Provider.eth.getBalance(constants.workerAccount1);
    logger.debug('\nconstants.workerAccount1.balance: ', worker1Balance);

    const PayObject = new PayKlass({
      airdrop_contract_address: constants.airdropOstUsdAddress,
      chain_id: constants.chainId,
      sender_worker_address: constants.ops,
      sender_worker_passphrase: constants.opsPassphrase,
      beneficiary_address: beneficiary,
      transfer_amount: transferAmount.toString(10),
      commission_beneficiary_address: commissionBeneficiary,
      commission_amount: commissionAmount.toString(10),
      currency: currency,
      intended_price_point: intendedPricePoint,
      spender: spenderAddress,
      gas_price: constants.gasUsed,
      options: constants.optionsReceipt
    });
    const payResponse = await PayObject.perform();

    assert.equal(payResponse.isFailure(), true);
    logger.debug('============airdrop.pay response=============');
    logger.debug(payResponse);

    // checks for account balance cache and DB consistency
    logger.debug(
      '============ Validating consistency for account balance form cache and contract after pay ============='
    );
    const balanceFromContract = await getBalanceFromContract(TC5, address);
    const balancesFromCache = await getBalanceFromCache(brandedTokenObject, address);
    validateContractAndCacheBalance(balanceFromContract, balancesFromCache);
    //check if the initial and current balances are reverted properly
    validateContractAndCacheBalance(initalBalancesFromContract, balanceFromContract);

    // checks for airdrop balance cache and DB consistency
    logger.debug('============ Validating consistency for airdrop balance form cache and DB after pay =============');
    const airdropBalanceFromDB = await getUserAirdropBalanceFromDB(constants.airdropOstUsdAddress, airdropUserAddress);
    const airdropBalanceFromCache = await getUserAirdropBalanceFromCache(
      constants.airdropOstUsdAddress,
      airdropUserAddress
    );
    validateDBandCacheAirdropBalances(airdropBalanceFromDB.data, airdropBalanceFromCache.data);
    // validate if the airdrop transfer was reverted properly
    validateDBandCacheAirdropBalances(initialAirdropBalanceFromDB.data, airdropBalanceFromDB.data);
  });

  it('should pass when transfer amount is less than available airdrop amount', async function() {
    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    // Populate Cache
    populateCache();

    const beneficiary = constants.account3,
      commissionAmount = new BigNumber(airdropOstUsd.toWei('0.7')),
      commissionBeneficiary = constants.account4,
      currency = constants.currencyUSD,
      transferAmount = new BigNumber(airdropOstUsd.toWei('1.91')),
      spenderAddress = constants.account2,
      spenderPassphrase = constants.accountPassphrase2,
      airdropBudgetHolder = constants.airdropBudgetHolder;

    // checks for account balance cache and DB consistency
    logger.debug('============ Validating consistency for account balance form cache and contract =============');
    const address = [spenderAddress, beneficiary, commissionBeneficiary, airdropBudgetHolder];
    const initalBalancesFromContract = await getBalanceFromContract(TC5, address);
    const initalBalancesCache = await getBalanceFromCache(brandedTokenObject, address);
    validateContractAndCacheBalance(initalBalancesFromContract, initalBalancesCache);

    // checks for airdrop balance cache and DB consistency
    logger.debug('============ Validating consistency for airdrop balance form cache and DB =============');
    const airdropUserAddress = [spenderAddress];
    const initialAirdropBalanceFromDB = await getUserAirdropBalanceFromDB(
      constants.airdropOstUsdAddress,
      airdropUserAddress
    );
    const initialAirdropBalanceFromCache = await getUserAirdropBalanceFromCache(
      constants.airdropOstUsdAddress,
      airdropUserAddress
    );
    validateDBandCacheAirdropBalances(initialAirdropBalanceFromDB.data, initialAirdropBalanceFromCache.data);

    const UserBalanceObject = new UserBalanceKlass({
      chain_id: constants.chainId,
      airdrop_contract_address: constants.airdropOstUsdAddress,
      user_addresses: [spenderAddress]
    });
    const airdropBalanceResult = await UserBalanceObject.perform();
    assert.equal(airdropBalanceResult.isSuccess(), true);
    const availableAirdropBalance = new BigNumber(airdropBalanceResult.data[spenderAddress].balanceAirdropAmount);

    const estimatedValues = await airdropOstUsd.getPricePointAndCalculatedAmounts(
      transferAmount,
      commissionAmount,
      currency
    );
    assert.equal(estimatedValues.isSuccess(), true);

    const estimatedTokenAmount = new BigNumber(estimatedValues.data.tokenAmount);
    const estimatedCommissionTokenAmount = new BigNumber(estimatedValues.data.commissionTokenAmount);
    const intendedPricePoint = estimatedValues.data.pricePoint;

    const estimatedTotalAmount = new BigNumber(0).plus(estimatedTokenAmount).plus(estimatedCommissionTokenAmount);

    const estimatedAirdropUsed = BigNumber.min(estimatedTotalAmount, availableAirdropBalance);
    logger.debug('============ estimatedAirdropUsed ============');
    logger.debug(estimatedAirdropUsed);
    // here we make sure that airdrop amount used will be greater than 0
    assert.equal(estimatedAirdropUsed.gt(0), true);
    // Approve account1 for transfer
    const accountApproveResponse = await TC5.approve(
      spenderAddress,
      spenderPassphrase,
      constants.airdropOstUsdAddress,
      estimatedTotalAmount.plus(100),
      constants.gasUsed
    );

    logger.debug('============spender approving to contract=============');
    logger.debug(accountApproveResponse);
    var worker1Balance = await web3Provider.eth.getBalance(constants.workerAccount1);
    logger.debug('\nconstants.workerAccount1.balance: ', worker1Balance);

    const PayObject = new PayKlass({
      airdrop_contract_address: constants.airdropOstUsdAddress,
      chain_id: constants.chainId,
      sender_worker_address: constants.workerAccount1,
      sender_worker_passphrase: constants.workerAccountPassphrase1,
      beneficiary_address: beneficiary,
      transfer_amount: transferAmount.toString(10),
      commission_beneficiary_address: commissionBeneficiary,
      commission_amount: commissionAmount.toString(10),
      currency: currency,
      intended_price_point: intendedPricePoint,
      spender: spenderAddress,
      gas_price: constants.gasUsed,
      options: constants.optionsReceipt
    });
    const payResponse = await PayObject.perform();

    assert.equal(payResponse.isSuccess(), true);
    logger.debug('============airdrop.pay response=============');
    logger.debug(payResponse);

    // verify if the transaction receipt is valid
    utils.verifyTransactionReceipt(payResponse);
    // verify if the transaction is actually mined
    await utils.verifyIfMined(airdropOstUsd, payResponse.data.transaction_hash);

    // checks for account balance cache and DB consistency
    logger.debug(
      '============ Validating consistency for account balance form cache and contract after pay ============='
    );
    const balanceFromContract = await getBalanceFromContract(TC5, address);
    const balancesFromCache = await getBalanceFromCache(brandedTokenObject, address);
    validateContractAndCacheBalance(balanceFromContract, balancesFromCache);
    //check if the transfer was propre
    validateTransferSuccess(
      estimatedTokenAmount,
      estimatedCommissionTokenAmount,
      estimatedAirdropUsed,
      spenderAddress,
      beneficiary,
      commissionBeneficiary,
      airdropBudgetHolder,
      initalBalancesFromContract,
      balanceFromContract
    );

    // checks for airdrop balance cache and DB consistency
    logger.debug('============ Validating consistency for airdrop balance form cache and DB after pay =============');
    const airdropBalanceFromDB = await getUserAirdropBalanceFromDB(constants.airdropOstUsdAddress, airdropUserAddress);
    const airdropBalanceFromCache = await getUserAirdropBalanceFromCache(
      constants.airdropOstUsdAddress,
      airdropUserAddress
    );
    validateDBandCacheAirdropBalances(airdropBalanceFromDB.data, airdropBalanceFromCache.data);
    // validate if the airdrop transfer was proper
    validateAirdropTransferSuccess(
      spenderAddress,
      initialAirdropBalanceFromDB,
      airdropBalanceFromDB,
      estimatedAirdropUsed
    );
  });

  // This is with an assumption that pervious test was passed and due to that constants.account3 has some balance
  it('should pass when airdrop amount is 0', async function() {
    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    // Populate Cache
    populateCache();

    const beneficiary = constants.account1,
      commissionAmount = new BigNumber(airdropOstUsd.toWei('0.0000000001')),
      commissionBeneficiary = constants.account4,
      currency = constants.currencyUSD,
      transferAmount = new BigNumber(airdropOstUsd.toWei('0.000000033')),
      spenderAddress = constants.account3,
      spenderPassphrase = constants.accountPassphrase3,
      airdropBudgetHolder = constants.airdropBudgetHolder;

    // checks for account balance cache and DB consistency
    logger.debug('============ Validating consistency for account balance form cache and contract =============');
    const address = [spenderAddress, beneficiary, commissionBeneficiary, airdropBudgetHolder];
    const initalBalancesFromContract = await getBalanceFromContract(TC5, address);
    const initalBalancesCache = await getBalanceFromCache(brandedTokenObject, address);
    validateContractAndCacheBalance(initalBalancesFromContract, initalBalancesCache);

    // checks for airdrop balance cache and DB consistency
    logger.debug('============ Validating consistency for airdrop balance form cache and DB =============');
    const airdropUserAddress = [spenderAddress];
    const initialAirdropBalanceFromDB = await getUserAirdropBalanceFromDB(
      constants.airdropOstUsdAddress,
      airdropUserAddress
    );
    const initialAirdropBalanceFromCache = await getUserAirdropBalanceFromCache(
      constants.airdropOstUsdAddress,
      airdropUserAddress
    );
    validateDBandCacheAirdropBalances(initialAirdropBalanceFromDB.data, initialAirdropBalanceFromCache.data);

    const UserBalanceObject = new UserBalanceKlass({
      chain_id: constants.chainId,
      airdrop_contract_address: constants.airdropOstUsdAddress,
      user_addresses: [spenderAddress]
    });
    const airdropBalanceResult = await UserBalanceObject.perform();
    assert.equal(airdropBalanceResult.isSuccess(), true);
    // this line is to make sure that the airdropBalance is not availalbe for the user. This is because this user was never allocated airdrop.
    assert.isUndefined(airdropBalanceResult.data[spenderAddress]);
    const availableAirdropBalance = new BigNumber(0);

    const estimatedValues = await airdropOstUsd.getPricePointAndCalculatedAmounts(
      transferAmount,
      commissionAmount,
      currency
    );
    assert.equal(estimatedValues.isSuccess(), true);

    const estimatedTokenAmount = new BigNumber(estimatedValues.data.tokenAmount);
    const estimatedCommissionTokenAmount = new BigNumber(estimatedValues.data.commissionTokenAmount);
    const intendedPricePoint = estimatedValues.data.pricePoint;

    const estimatedTotalAmount = new BigNumber(0).plus(estimatedTokenAmount).plus(estimatedCommissionTokenAmount);

    const estimatedAirdropUsed = BigNumber.min(estimatedTotalAmount, availableAirdropBalance);
    logger.debug('============ estimatedAirdropUsed ============');
    logger.debug(estimatedAirdropUsed);
    // Here we make sure that the airdrop amount is 0;
    assert.equal(estimatedAirdropUsed.equals(0), true);
    // Approve account1 for transfer
    const accountApproveResponse = await TC5.approve(
      spenderAddress,
      spenderPassphrase,
      constants.airdropOstUsdAddress,
      estimatedTotalAmount.plus(100),
      constants.gasUsed
    );

    logger.debug('============spender approving to contract=============');
    logger.debug(accountApproveResponse);
    var worker1Balance = await web3Provider.eth.getBalance(constants.workerAccount1);
    logger.debug('\nconstants.workerAccount1.balance: ', worker1Balance);

    const PayObject = new PayKlass({
      airdrop_contract_address: constants.airdropOstUsdAddress,
      chain_id: constants.chainId,
      sender_worker_address: constants.workerAccount1,
      sender_worker_passphrase: constants.workerAccountPassphrase1,
      beneficiary_address: beneficiary,
      transfer_amount: transferAmount.toString(10),
      commission_beneficiary_address: commissionBeneficiary,
      commission_amount: commissionAmount.toString(10),
      currency: currency,
      intended_price_point: intendedPricePoint,
      spender: spenderAddress,
      gas_price: constants.gasUsed,
      options: constants.optionsReceipt
    });
    const payResponse = await PayObject.perform();
    assert.equal(payResponse.isSuccess(), true);
    logger.debug('============airdrop.pay response=============');
    logger.debug(payResponse);

    // verify if the transaction receipt is valid
    utils.verifyTransactionReceipt(payResponse);
    // verify if the transaction is actually mined
    await utils.verifyIfMined(airdropOstUsd, payResponse.data.transaction_hash);

    // checks for account balance cache and DB consistency
    logger.debug(
      '============ Validating consistency for account balance form cache and contract after pay ============='
    );
    const balanceFromContract = await getBalanceFromContract(TC5, address);
    const balancesFromCache = await getBalanceFromCache(brandedTokenObject, address);
    validateContractAndCacheBalance(balanceFromContract, balancesFromCache);
    //check if the transfer was propre
    validateTransferSuccess(
      estimatedTokenAmount,
      estimatedCommissionTokenAmount,
      estimatedAirdropUsed,
      spenderAddress,
      beneficiary,
      commissionBeneficiary,
      airdropBudgetHolder,
      initalBalancesFromContract,
      balanceFromContract
    );

    // checks for airdrop balance cache and DB consistency
    logger.debug('============ Validating consistency for airdrop balance form cache and DB after pay =============');
    const airdropBalanceFromDB = await getUserAirdropBalanceFromDB(constants.airdropOstUsdAddress, airdropUserAddress);
    const airdropBalanceFromCache = await getUserAirdropBalanceFromCache(
      constants.airdropOstUsdAddress,
      airdropUserAddress
    );
    validateDBandCacheAirdropBalances(airdropBalanceFromDB.data, airdropBalanceFromCache.data);
    // validate if the airdrop transfer was proper
    validateAirdropTransferSuccess(
      spenderAddress,
      initialAirdropBalanceFromDB,
      airdropBalanceFromDB,
      estimatedAirdropUsed
    );
  });

  it('should pass when all airdrop amount is used and partial user balance is used', async function() {
    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    // Populate Cache
    populateCache();
    const spenderAddress = constants.account2,
      spenderPassphrase = constants.accountPassphrase2;
    const UserBalanceObject = new UserBalanceKlass({
      chain_id: constants.chainId,
      airdrop_contract_address: constants.airdropOstUsdAddress,
      user_addresses: [spenderAddress]
    });
    const airdropBalanceResult = await UserBalanceObject.perform();
    assert.equal(airdropBalanceResult.isSuccess(), true);

    const availableAirdropBalance = new BigNumber(airdropBalanceResult.data[spenderAddress].balanceAirdropAmount);
    const partialAmount = new BigNumber(10);

    const beneficiary = constants.account3,
      commissionAmount = partialAmount,
      commissionBeneficiary = constants.account4,
      currency = constants.currencyUSD,
      transferAmount = availableAirdropBalance.div(6).floor(),
      airdropBudgetHolder = constants.airdropBudgetHolder;

    // checks for account balance cache and DB consistency
    logger.debug('============ Validating consistency for account balance form cache and contract =============');
    const address = [spenderAddress, beneficiary, commissionBeneficiary, airdropBudgetHolder];
    const initalBalancesFromContract = await getBalanceFromContract(TC5, address);
    const initalBalancesCache = await getBalanceFromCache(brandedTokenObject, address);
    validateContractAndCacheBalance(initalBalancesFromContract, initalBalancesCache);

    // checks for airdrop balance cache and DB consistency
    logger.debug('============ Validating consistency for airdrop balance form cache and DB =============');
    const airdropUserAddress = [spenderAddress];
    const initialAirdropBalanceFromDB = await getUserAirdropBalanceFromDB(
      constants.airdropOstUsdAddress,
      airdropUserAddress
    );
    const initialAirdropBalanceFromCache = await getUserAirdropBalanceFromCache(
      constants.airdropOstUsdAddress,
      airdropUserAddress
    );
    validateDBandCacheAirdropBalances(initialAirdropBalanceFromDB.data, initialAirdropBalanceFromCache.data);

    const estimatedValues = await airdropOstUsd.getPricePointAndCalculatedAmounts(
      transferAmount,
      commissionAmount,
      currency
    );
    assert.equal(estimatedValues.isSuccess(), true);

    const estimatedTokenAmount = new BigNumber(estimatedValues.data.tokenAmount);
    const estimatedCommissionTokenAmount = new BigNumber(estimatedValues.data.commissionTokenAmount);
    const intendedPricePoint = estimatedValues.data.pricePoint;

    const estimatedTotalAmount = new BigNumber(0).plus(estimatedTokenAmount).plus(estimatedCommissionTokenAmount);

    const estimatedAirdropUsed = BigNumber.min(estimatedTotalAmount, availableAirdropBalance);
    logger.debug('============ estimatedAirdropUsed ============');
    logger.debug(estimatedAirdropUsed);
    // here we make sure that airdrop amount used will be greater than 0
    assert.equal(estimatedAirdropUsed.gt(0), true);
    // Approve account1 for transfer
    const accountApproveResponse = await TC5.approve(
      spenderAddress,
      spenderPassphrase,
      constants.airdropOstUsdAddress,
      estimatedTotalAmount.plus(100),
      constants.gasUsed
    );

    logger.debug('============spender approving to contract=============');
    logger.debug(accountApproveResponse);
    var worker1Balance = await web3Provider.eth.getBalance(constants.workerAccount1);
    logger.debug('\nconstants.workerAccount1.balance: ', worker1Balance);

    const PayObject = new PayKlass({
      airdrop_contract_address: constants.airdropOstUsdAddress,
      chain_id: constants.chainId,
      sender_worker_address: constants.workerAccount1,
      sender_worker_passphrase: constants.workerAccountPassphrase1,
      beneficiary_address: beneficiary,
      transfer_amount: transferAmount.toString(10),
      commission_beneficiary_address: commissionBeneficiary,
      commission_amount: commissionAmount.toString(10),
      currency: currency,
      intended_price_point: intendedPricePoint,
      spender: spenderAddress,
      gas_price: constants.gasUsed,
      options: constants.optionsReceipt
    });
    const payResponse = await PayObject.perform();

    assert.equal(payResponse.isSuccess(), true);
    logger.debug('============airdrop.pay response=============');
    logger.debug(payResponse);

    // verify if the transaction receipt is valid
    utils.verifyTransactionReceipt(payResponse);
    // verify if the transaction is actually mined
    await utils.verifyIfMined(airdropOstUsd, payResponse.data.transaction_hash);

    // checks for account balance cache and DB consistency
    logger.debug(
      '============ Validating consistency for account balance form cache and contract after pay ============='
    );
    const balanceFromContract = await getBalanceFromContract(TC5, address);
    const balancesFromCache = await getBalanceFromCache(brandedTokenObject, address);
    validateContractAndCacheBalance(balanceFromContract, balancesFromCache);
    //check if the transfer was propre
    validateTransferSuccess(
      estimatedTokenAmount,
      estimatedCommissionTokenAmount,
      estimatedAirdropUsed,
      spenderAddress,
      beneficiary,
      commissionBeneficiary,
      airdropBudgetHolder,
      initalBalancesFromContract,
      balanceFromContract
    );

    // checks for airdrop balance cache and DB consistency
    logger.debug('============ Validating consistency for airdrop balance form cache and DB after pay =============');
    const airdropBalanceFromDB = await getUserAirdropBalanceFromDB(constants.airdropOstUsdAddress, airdropUserAddress);
    const airdropBalanceFromCache = await getUserAirdropBalanceFromCache(
      constants.airdropOstUsdAddress,
      airdropUserAddress
    );
    validateDBandCacheAirdropBalances(airdropBalanceFromDB.data, airdropBalanceFromCache.data);
    // validate if the airdrop transfer was proper
    validateAirdropTransferSuccess(
      spenderAddress,
      initialAirdropBalanceFromDB,
      airdropBalanceFromDB,
      estimatedAirdropUsed
    );
  });
});
