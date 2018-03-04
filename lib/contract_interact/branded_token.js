//"use strict";

/**
 *
 * This is a utility file which would be used for executing all methods on EIP20Token contract.<br><br>
 *
 * @module lib/contract_interact/branded_token
 *
 */
const rootPrefix = '../..'
  , BigNumber = require('bignumber.js')
  , helper = require(rootPrefix + '/lib/contract_interact/helper')
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , web3RpcProvider = require(rootPrefix + '/lib/web3/providers/rpc')
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , contractName = 'brandedToken'
  , contractAbi = coreAddresses.getAbiForContract(contractName)
  , currContract = new web3RpcProvider.eth.Contract(contractAbi)
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
  , gasLimit = coreConstants.OST_GAS_LIMIT
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , BalanceCacheKlass = require(rootPrefix + '/lib/cache_management/balance')
;

const notificationGlobalConstant = require(rootPrefix + '/lib/global_constant/notification');


/**
 * Constructor to create object of BrandedToken
 *
 * @constructor
 *
 * @param {string} brandedTokenAddress - Branded token address
 * @param {number} chainId - chainId
 *
 */
const BrandedToken = function (brandedTokenAddress, chainId) {
  const oThis = this;
  oThis.brandedTokenAddress = brandedTokenAddress;
  oThis.chainId = chainId;
  oThis.balanceCache = new BalanceCacheKlass(chainId, brandedTokenAddress);
  logger.info("\n==========BrandedToken.constructor===========");
  logger.info(brandedTokenAddress, chainId);
  currContract.setProvider(web3RpcProvider.currentProvider);
};

BrandedToken.prototype = {

  brandedTokenAddress: null,
  chainId: null,
  balanceCache: null,

  /**
   * Fetch Balance For a given address
   *
   * @param {string} owner - address for which balance is to be fetched
   *
   * @return {promise<result>}
   *
   */
  getBalanceOf: function (owner) {
    const oThis = this;
    // Validate addresses
    if (!basicHelper.isAddressValid(owner)) {
      return Promise.resolve(responseHelper.error('l_ci_bt_gbo_1', 'address is invalid'));
    }

    const callback = async function (response) {
      //To-Do: Ensure cache is empty.
      //Someone else might have already fetched it and may be performing operations.
      //Aquire lock ?
      var cacheResult = await oThis.balanceCache.getBalance(owner);
      if (cacheResult.isSuccess() && cacheResult.data.response != null) {
        //Ignore the balance we already have.
        return responseHelper.successWithData({balance: cacheResult.data.response});
      }
      //We can't help. throw again.
      if (response.isFailure()) {
        throw response;
      }
      //Cache it
      await oThis.balanceCache.setBalance(owner, new BigNumber(response.data.balance));
      return responseHelper.successWithData({balance: response.data.balance});
    };

    return oThis.balanceCache.getBalance(owner)
      .then(function (cacheResult) {
        if (cacheResult.isSuccess() && cacheResult.data.response != null) {
          return responseHelper.successWithData({balance: cacheResult.data.response});
        } else {
          return oThis.getBalanceFromContract(owner).then(callback);
        }

      })
      .catch(function (err) {
        //Format the error
        return responseHelper.error('l_ci_bt_gbo_2', 'Something went wrong');
      });
  },


  getBalanceFromContract: async function (owner) {
    const oThis = this;
    const transactionObject = currContract.methods.balanceOf(owner);
    const encodedABI = transactionObject.encodeABI();
    const transactionOutputs = helper.getTransactionOutputs(transactionObject);
    const response = await helper.call(web3RpcProvider, oThis.brandedTokenAddress, encodedABI, {}, transactionOutputs);
    return Promise.resolve(responseHelper.successWithData({balance: response[0]}));

  },


  /**
   * Transfer amount to budget holder
   *
   * @param {string} senderAddress - address of sender
   * @param {string} senderPassphrase - passphrase of sender
   * @param {string} airdropBudgetHolderAddress - recipient address
   * @param {BigNumber} amount - amount in wei
   * @param {BigNumber} gasPrice - gas price
   * @param {options} object - for params like returnType, tag.
   *
   * @return {Promise}
   *
   */
  transferToAirdropBudgetHolder: function (senderAddress, senderPassphrase, airdropBudgetHolderAddress, amount, gasPrice, options) {

    const oThis = this;
    const returnType = basicHelper.getReturnType(options.returnType);

    const transactionObject = currContract.methods.transfer(
      airdropBudgetHolderAddress,
      amount);

    const notificationData = helper.getNotificationData(
      ['transfer.payments.brandedToken.transferToBudgetHolder'],
      notificationGlobalConstant.publisher(),
      'transferToBudgetHolder',
      contractName,
      oThis.brandedTokenAddress,
      web3RpcProvider,
      oThis.chainId,
      options);
    notificationData["erc20_contract_address"] = oThis.brandedTokenAddress;

    const onSuccess = async function(receipt) {
      await oThis.afterTransferSuccess(airdropBudgetHolderAddress, amount);
    };
    const onFail = async function(receipt) {
      await oThis.afterTransferFail(senderAddress, amount);
    };

    logger.info("\n==============brandedToken.transferToAirdropBudgetHolder.notificationData===================");
    logger.info(notificationData);
    const params = {
      transactionObject: transactionObject,
      notificationData: notificationData,
      senderAddress: senderAddress,
      senderPassphrase: senderPassphrase,
      contractAddress: oThis.brandedTokenAddress,
      gasPrice: gasPrice,
      gasLimit: gasLimit,
      web3RpcProvider: web3RpcProvider,
      successCallback: onSuccess,
      failCallback: onFail,
      errorCode: "l_ci_bt_ttbh_1"
    };

    //return helper.performSend(params, returnType);

    return oThis.beforeTransfer(
      senderAddress,
      amount)
      .then(function(beforeTransferResponse) {
        if (beforeTransferResponse.isSuccess()) {
          return Promise.resolve(helper.performSend(params, returnType));
        } else {
          return Promise.resolve(beforeTransferResponse);
        }
      });

  },

  /**
   * Called before transfer to airdrop budget holder
   *
   * @param {string} address - address
   * @param {BigNumber} amount - amount in wei
   *
   * @return {Promise}
   *
   */
  beforeTransfer: function(address, amount) {
    logger.info("\n==========Before transfer to airdrop budget holder called===========");
    logger.info(`\naddress: ${address}, amount: ${amount}`);
    // debit sender
    const oThis = this;
    return oThis.debitBalance(address, amount);
  },

  /**
   * Called after successful transfer to airdrop budget holder
   *
   * @param {string} address - address
   * @param {BigNumber} amount - amount in wei
   *
   * @return {Promise}
   *
   */
  afterTransferSuccess: function(address, amount) {
    logger.info("\n==========After success of transfer to airdrop budget holder called===========");
    logger.info(`\naddress: ${address}, amount: ${amount}`);
    // credit airdrop budget holder
    const oThis = this;
    return oThis.creditBalance(address, amount);
  },

  /**
   * Called after unsuccessful transfer to airdrop budget holder
   *
   * @param {string} address - address
   * @param {BigNumber} amount - amount in wei
   *
   * @return {Promise}
   *
   */
  afterTransferFail: function(address, amount) {
    logger.info("\n==========After fail of transfer to airdrop budget holder called===========");
    logger.info(`\naddress: ${address}, amount: ${amount}`);
    // credit sender
    const oThis = this;
    return oThis.creditBalance(address, amount);
  },

  /**
   * Credit balance in cache
   *
   * @param {string} brandedTokenAddress - branded token address
   * @param {string} owner - Account address
   * @param {BigNumber} bigAmount - amount to be credited
   *
   * @return {promise<result>}
   *
   * @ignore
   */
  creditBalance: function (owner, bigAmount) {
    const oThis = this;

    return oThis.getBalanceOf(owner)
      .then(function (response) {
        if (response.isSuccess()) {
          const balance = new BigNumber(response.data.balance);
          const newBalance = balance.plus(bigAmount);
          oThis.setBalanceInCache(owner, newBalance);
          logger.info(`\n========= creditBalance success: ${bigAmount.toString(10)} to ${owner} =========\n`);
        } else {
          logger.error(`\n========= creditBalance failed: ${bigAmount.toString(10)} to ${owner} =========\n`);
        }
        return response;
      });
  },

  /**
   * Debit balance in cache
   *
   * @param {string} owner - Account address
   * @param {BigNumber} bigAmount - amount to be debited
   *
   * @return {promise<result>}
   *
   * @ignore
   */
  debitBalance: function (owner, bigAmount) {

    const oThis = this;
    return oThis.getBalanceOf(owner)
      .then(function (response) {
        if (response.isSuccess()) {
          const balance = new BigNumber(response.data.balance);
          const newBalance = balance.minus(bigAmount);
          oThis.setBalanceInCache(owner, newBalance);
          logger.info(`\n========= debitBalance success: ${bigAmount.toString(10)} to ${owner} =========\n`);
        } else {
          logger.error(`\n========= debitBalance failed: ${bigAmount.toString(10)} to ${owner} =========\n`);
        }
        return response;
      });
  },

  /**
   * Set balance in cache
   *
   * @param {string} brandedTokenAddress - branded token address
   * @param {string} owner - Account address
   * @param {BigNumber} bigAmount - amount to be set
   *
   * @return {promise<result>}
   *
   * @ignore
   */
  setBalanceInCache: function (owner, bigAmount) {
    const oThis = this;
    return oThis.balanceCache.setBalance(owner, bigAmount)
      .then(function (setResponse) {
        if (setResponse.isSuccess() && setResponse.data.response != null) {
          return responseHelper.successWithData({});
        }
        return responseHelper.error('l_ci_bt_setBalanceInCache_1', setResponse);
      });
  },

  /**
   * Approve amount to budget holder
   *
   * @param {string} airdropBudgetHolderAddress - address of airdropBudgetHolder
   * @param {string} airdropBudgetHolderPassphrase - Passphrase of airdropBudgetHolder
   * @param {string} airdropContractAddress - airdrop contract address
   * @param {BigNumber} amount - amount in wei
   * @param {BigNumber} gasPrice - gas price
   * @param {options} object - for params like returnType, tag.
   *
   * @return {Promise}
   *
   */
  approveByBudgetHolder: function (airdropBudgetHolderAddress, airdropBudgetHolderPassphrase, airdropContractAddress, amount, gasPrice, options) {

    const oThis = this;

    const returnType = basicHelper.getReturnType(options.returnType);

    const transactionObject = currContract.methods.approve(
      airdropContractAddress,
      amount);

    const notificationData = helper.getNotificationData(
      ['payments.brandedToken.approveToBudgetHolder'],
      notificationGlobalConstant.publisher(),
      'approveByBudgetHolder',
      contractName,
      oThis.brandedTokenAddress,
      web3RpcProvider,
      oThis.chainId,
      options);

    const params = {
      transactionObject: transactionObject,
      notificationData: notificationData,
      senderAddress: airdropBudgetHolderAddress,
      senderPassphrase: airdropBudgetHolderPassphrase,
      contractAddress: oThis.brandedTokenAddress,
      gasPrice: gasPrice,
      gasLimit: gasLimit,
      web3RpcProvider: web3RpcProvider,
      successCallback: null,
      failCallback: null,
      errorCode: "l_ci_bt_abbh_1"
    };

    return helper.performSend(params, returnType);

  }

};

module.exports = BrandedToken;

