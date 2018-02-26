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
  , contractName = 'brandedtoken'
  , contractAbi = coreAddresses.getAbiForContract(contractName)
  , currContract = new web3RpcProvider.eth.Contract(contractAbi)
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
  , gasLimit = coreConstants.OST_GAS_LIMIT
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , BalanceCacheKlass = require(rootPrefix + '/lib/cache_management/balance')
;

const notificationGlobalConstant = require(rootPrefix + '/lib/global_constant/notification')
;


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
    const oThis = this
    ;
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
      ['payments.brandedToken.transferToBudgetHolder'],
      notificationGlobalConstant.publisher(),
      'transferToBudgetHolder',
      contractName,
      oThis.brandedTokenAddress,
      web3RpcProvider,
      oThis.chainId,
      options);

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
      successCallback: null,
      failCallback: null,
      errorCode: "l_ci_bt_ttbh_1"
    };

    return helper.performSend(params, returnType);

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

