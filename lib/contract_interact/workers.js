"use strict";

/**
 *
 * This is a utility file which would be used for executing all methods on Workers contract.<br><br>
 *
 * @module lib/contract_interact/workers
 *
 */
const BigNumber = require('bignumber.js')
;

const rootPrefix = '../..'
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , helper = require(rootPrefix + '/lib/contract_interact/helper')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , web3Provider = require(rootPrefix + '/lib/web3/providers/ws')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , notificationGlobalConstant = require(rootPrefix + '/lib/global_constant/notification')
  , gasLimitGlobalConstant = require(rootPrefix + '/lib/global_constant/gas_limit')
;

const contractName = 'workers'
  , contractAbi = coreAddresses.getAbiForContract(contractName)
  , currContract = new web3Provider.eth.Contract(contractAbi)
;

/**
 * Workers contract interact class constructor
 *
 * @param {string} workerAddress - address of worker (external address)
 * @param {number} chainId - chain id
 *
 * @constructor
 *
 */
const Workers = module.exports = function (workerAddress, chainId) {
  this.contractAddress = workerAddress;
  this.chainId = chainId;
};

Workers.prototype = {

  /**
   * Contract address
   *
   * @ignore
   * @private
   */
  contractAddress: null,

  /**
  * Set or update the worker
  *
  * @param {string} senderAddress - address of sender
  * @param {string} senderPassphrase - passphrase of sender
  * @param {string} workerAddress - worker address
  * @param {number} deactivationHeight - block number till which the worker is valid
  * @param {BigNumber} gasPrice - gas price
  * @param {object} options - for params like returnType, tag.
  *
  * @return {promise<result>}
  *
  */
  setWorker: async function (senderAddress, senderPassphrase, workerAddress, deactivationHeight, gasPrice, options) {
    const oThis = this
    ;

    try {
      const returnType = basicHelper.getReturnType(options.returnType)
        , transactionObject = currContract.methods.setWorker(workerAddress, deactivationHeight);

      const notificationData = helper.getNotificationData(
        ['payments.workers.setWorker'],
        notificationGlobalConstant.publisher(),
        'setWorker',
        contractName,
        oThis.contractAddress,
        web3Provider,
        oThis.chainId,
        options);

      const params = {
        transactionObject: transactionObject,
        notificationData: notificationData,
        senderAddress: senderAddress,
        senderPassphrase: senderPassphrase,
        contractAddress: oThis.contractAddress,
        gasPrice: gasPrice,
        gasLimit: gasLimitGlobalConstant.setWorker(),
        web3Provider: web3Provider,
        successCallback: null,
        failCallback: null,
        errorCode: "l_ci_w_setWorker_1"
      };

      return Promise.resolve(helper.performSend(params, returnType));
    } catch(err) {
      logger.error('lib/contract_interact/workers.js:setWorker inside catch:', err);
      return Promise.resolve(responseHelper.error('l_ci_w_setWorker_2', 'Something went wrong.'));
    }
  },

  /**
  * Remove worker
  *
  * @param {string} senderAddress - address of sender
  * @param {string} senderPassphrase - passphrase of sender
  * @param {string} workerAddress - worker address
  * @param {BigNumber} gasPrice - gas price
  * @param {object} options - for params like returnType, tag.
  *
  * @return {promise<result>}
  *
  */
  removeWorker: function (senderAddress, senderPassphrase, workerAddress, gasPrice, options) {
    const oThis = this
    ;

    try {
      const validationResponse = oThis._validateRemoveWorkerParams(senderAddress, workerAddress, gasPrice);
      if (validationResponse.isFailure()) return Promise.resolve(validationResponse);

      const returnType = basicHelper.getReturnType(options.returnType)
        , transactionObject = currContract.methods.removeWorker(workerAddress);

      const notificationData = helper.getNotificationData(
        ['payments.workers.removeWorker'],
        notificationGlobalConstant.publisher(),
        'removeWorker',
        contractName,
        oThis.contractAddress,
        web3Provider,
        oThis.chainId,
        options);

      const params = {
        transactionObject: transactionObject,
        notificationData: notificationData,
        senderAddress: senderAddress,
        senderPassphrase: senderPassphrase,
        contractAddress: oThis.contractAddress,
        gasPrice: gasPrice,
        gasLimit: gasLimitGlobalConstant.default(),
        web3Provider: web3Provider,
        successCallback: null,
        failCallback: null,
        errorCode: "l_ci_w_removeWorker_1"
      };

      return Promise.resolve(helper.performSend(params, returnType));
    } catch(err) {
      logger.error('lib/contract_interact/workers.js:removeWorker inside catch:', err);
      return Promise.resolve(responseHelper.error('l_ci_w_removeWorker_2', 'Something went wrong.'));
    }
  },

  /**
  * Remove (selfdestruct)
  *
  * @param {string} senderAddr - address of sender
  * @param {string} senderPassphrase - passphrase of sender
  * @param {BigNumber} gasPrice - gas price
  * @param {options} object - for params like returnType, tag.
  *
  * @return {Promise}
  *
  */
  remove: function (senderAddress, senderPassphrase, gasPrice, options) {
    const oThis = this
    ;

    try {
      const validationResponse = oThis._validateRemoveParams(senderAddress, gasPrice);
      if (validationResponse.isFailure()) return Promise.resolve(validationResponse);

      const returnType = basicHelper.getReturnType(options.returnType)
        , transactionObject = currContract.methods.remove();

      const notificationData = helper.getNotificationData(
        ['payments.workers.remove'],
        notificationGlobalConstant.publisher(),
        'remove',
        contractName,
        oThis.contractAddress,
        web3Provider,
        oThis.chainId,
        options);

      const params = {
        transactionObject: transactionObject,
        notificationData: notificationData,
        senderAddress: senderAddress,
        senderPassphrase: senderPassphrase,
        contractAddress: oThis.contractAddress,
        gasPrice: gasPrice,
        gasLimit: gasLimitGlobalConstant.default(),
        web3Provider: web3Provider,
        successCallback: null,
        failCallback: null,
        errorCode: "l_ci_w_remove_1"
      };

      return Promise.resolve(helper.performSend(params, returnType));
    } catch(err) {
      logger.error('lib/contract_interact/workers.js:remove inside catch:', err);
      return Promise.resolve(responseHelper.error('l_ci_w_remove_2', 'Something went wrong.'));
    }
  },

  /**
  * Check if the given worker address is valid or not
  *
  * @param {string} workerAddress - worker address
  *
  * @return {Promise}
  *
  */
  isWorker: async function (workerAddress) {
    try {
      if (!basicHelper.isAddressValid(workerAddress)) {
        return Promise.resolve(responseHelper.error('l_ci_w_isWorker_1', 'worker address is invalid'));
      }

      const transactionObject = currContract.methods.isWorker(workerAddress)
        , encodedABI = transactionObject.encodeABI()
        , transactionOutputs = helper.getTransactionOutputs(transactionObject)
        , response = await helper.call(web3Provider, this.contractAddress, encodedABI, {}, transactionOutputs)
      ;

      return Promise.resolve(responseHelper.successWithData({isValid: response[0]}));
    } catch(err) {
      logger.error('lib/contract_interact/workers.js:isWorker inside catch:', err);
      return Promise.resolve(responseHelper.error('l_ci_w_isWorker_2', 'Something went wrong.'));
    }
  },

  /**
   * Validate remove worker params
   *
   * @param {string} senderAddress - address of sender
   * @param {string} workerAddress - worker address
   * @param {BigNumber} gasPrice - gas price
   *
   * @return {result}
   *
   */
  _validateRemoveWorkerParams: function (senderAddress, workerAddress, gasPrice) {
    if (!gasPrice) {
      return responseHelper.error('l_ci_w_validateRemoveWorkerParams_1', 'gas is mandatory');
    }
    if (!basicHelper.isAddressValid(senderAddress)) {
      return responseHelper.error('l_ci_w_validateRemoveWorkerParams_2', 'sender address is invalid');
    }
    if (!basicHelper.isAddressValid(workerAddress)) {
      return responseHelper.error('l_ci_w_validateRemoveWorkerParams_3', 'worker address is invalid');
    }

    return responseHelper.successWithData({});
  },

  /**
   * Validate Remove (selfdestruct) params
   *
   * @param {string} senderAddress - address of sender
   * @param {BigNumber} gasPrice - gas price
   *
   * @return {result}
   *
   */
  _validateRemoveParams: function (senderAddress, gasPrice) {
    if (!gasPrice) {
      return responseHelper.error('l_ci_w_validateRemoveParams_1', 'gas is mandatory');
    }
    if (!basicHelper.isAddressValid(senderAddress)) {
      return responseHelper.error('l_ci_w_validateRemoveParams_2', 'sender address is invalid');
    }
    return responseHelper.successWithData({});
  },

  /**
   * Get transaction receipt from transaction hash
   *
   * @param {string} transactionHash - transaction hash
   * TODO - this can be moved to a util class
   *
   * @return {promise<result>}
   */
  getTxReceipt: async function(transactionHash) {
    try {
      if (!transactionHash) {
        return Promise.resolve(responseHelper.error('l_ci_w_getTxReceipt_1', 'transaction hash is mandatory'));
      }

      const transactionReceipt = await helper.getTxReceipt(web3Provider, transactionHash, {});
      return Promise.resolve(responseHelper.successWithData({transactionReceipt: transactionReceipt}));
    } catch(err) {
      logger.error('lib/contract_interact/workers.js:getTxReceipt inside catch:', err);
      return Promise.resolve(responseHelper.error('l_ci_w_getTxReceipt_2', 'Something went wrong.'));
    }
  }
};
