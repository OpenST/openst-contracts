//"use strict";

/**
 *
 * This is a utility file which would be used for executing all methods on Workers contract.<br><br>
 *
 * @module lib/contract_interact/workers
 *
 */


const rootPrefix = '../..';
const basicHelper = require(rootPrefix + '/helpers/basic_helper')
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , helper = require(rootPrefix + '/lib/contract_interact/helper')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , web3RpcProvider = require(rootPrefix + '/lib/web3/providers/rpc')
  , BigNumber = require('bignumber.js')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  ;

const contractName = 'workers'
  , gasLimit = coreConstants.OST_GAS_LIMIT
  , contractAbi = coreAddresses.getAbiForContract(contractName)
  , currContract = new web3RpcProvider.eth.Contract(contractAbi)
;


/**
 * @constructor
 *
 */
const Workers = module.exports = function (workerAddress, chainId) {
  this.contractAddress = workerAddress;
  this.chainId = chainId;
};

Workers.prototype = {

  contractAddress: null,

  /**
  * Get transaction receipt from transaction hash
  *
  * @param {string} transactionHash - transaction hash
  *
  * @return {BigNumer} 10^18
  *
  */
  getTxReceipt: function(transactionHash) {

    if (!transactionHash) {
      return responseHelper.error('l_ci_p_gtr_1', 'transaction hash is mandatory');
    }

    return helper.getTxReceipt(
      web3RpcProvider,
      transactionHash,
      {})
      .then(function (transactionReceipt) {
        return Promise.resolve(responseHelper.successWithData({transactionReceipt: transactionReceipt}));
      });

  },

  /**
  * Validate set workers params
  *
  * @param {string} senderAddress - address of sender
  * @param {string} workerAddress - worker address
  * @param {number} deactivationHeight - block number till which the worker is valid
  * @param {BigNumber} gasPrice - gas price
  *
  * @return {object}
  *
  */
  validateSetWorkersParams: function (senderAddress, workerAddress, deactivationHeight, gasPrice ) {
    if (!gasPrice) {
      return responseHelper.error('l_ci_w_vswp_1', 'gas is mandatory');
    }
    if (!helper.isAddressValid(senderAddress)) {
      return responseHelper.error('l_ci_w_vswp_2', 'sender address is invalid');
    }
    if (!helper.isAddressValid(workerAddress)) {
      return responseHelper.error('l_ci_w_vswp_3', 'worker address is invalid');
    }
    if (!deactivationHeight) {
      return responseHelper.error('l_ci_w_vswp_4', 'deactivation height is mandatory');
    }
    deactivationHeight = new BigNumber(deactivationHeight);
    if (deactivationHeight.isNaN() || deactivationHeight.lt(0) || !deactivationHeight.isInteger()) {
      return responseHelper.error('l_ci_w_vswp_5', 'deactivation height value is invalid');
    }
    return responseHelper.successWithData({});
  },

  /**
  * Set or updates the worker
  *
  * @param {string} senderAddr - address of sender
  * @param {string} senderPassphrase - passphrase of sender
  * @param {string} workerAddress - worker address
  * @param {number} deactivationHeight - block number till which the worker is valid
  * @param {BigNumber} gasPrice - gas price
  * @param {options} object - for params like returnType, tag.
  *
  * @return {Promise}
  *
  */
  setWorker: function (senderAddress, senderPassphrase, workerAddress, deactivationHeight, gasPrice, options) {

    const oThis = this;

    return new Promise(function (onResolve, onReject) {
      const validationResponse = oThis.validateSetWorkersParams(senderAddress, workerAddress, deactivationHeight, gasPrice );
      if (validationResponse.isFailure()) {
        logger.error("setWorker Validation Failed");
      }else {
        logger.win("setWorker Validation Success");
      }

      if (validationResponse.isFailure()) {
        return onResolve(validationResponse);
      }

      const returnType = basicHelper.getReturnType(options.returnType);

      const transactionObject = currContract.methods.setWorker(
        workerAddress,
        deactivationHeight);

      const notificationData = helper.getNotificationData(
        ['payments.workers.setWorker'],
        'OST',
        'setWorker',
        contractName,
        oThis.contractAddress,
        web3RpcProvider,
        oThis.chainId,
        options);

      const params = {
        transactionObject: transactionObject,
        notificationData: notificationData,
        senderAddress: senderAddress,
        senderPassphrase: senderPassphrase,
        contractAddress: oThis.contractAddress,
        gasPrice: gasPrice,
        gasLimit: gasLimit,
        web3RpcProvider: web3RpcProvider,
        successCallback: null,
        failCallback: null,
        errorCode: "l_ci_w_sw_1"
      };

      return onResolve(helper.performSend(params, returnType));

    });

  },


  /**
  * Validate remove worker params
  *
  * @param {string} senderAddress - address of sender
  * @param {string} workerAddress - worker address
  * @param {BigNumber} gasPrice - gas price
  *
  * @return {object}
  *
  */
  validateRemoveWorkerParams: function (senderAddress, workerAddress, gasPrice) {
    if (!gasPrice) {
      return responseHelper.error('l_ci_w_vrw_1', 'gas is mandatory');
    }
    if (!helper.isAddressValid(senderAddress)) {
      return responseHelper.error('l_ci_w_vrw_2', 'sender address is invalid');
    }
    if (!helper.isAddressValid(workerAddress)) {
      return responseHelper.error('l_ci_w_vrw_3', 'worker address is invalid');
    }

    return responseHelper.successWithData({});
  },

  /**
  * Remove worker
  *
  * @param {string} senderAddr - address of sender
  * @param {string} senderPassphrase - passphrase of sender
  * @param {string} workerAddress - worker address
  * @param {BigNumber} gasPrice - gas price
  * @param {options} object - for params like returnType, tag.
  *
  * @return {Promise}
  *
  */
  removeWorker: function (senderAddress, senderPassphrase, workerAddress, gasPrice, options) {

    const oThis = this;

    return new Promise(function (onResolve, onReject) {
      const validationResponse = oThis.validateRemoveWorkerParams(senderAddress, workerAddress, gasPrice);
      if (validationResponse.isFailure()) {
        return onResolve(validationResponse);
      }

      const returnType = basicHelper.getReturnType(options.returnType);

      const transactionObject = currContract.methods.removeWorker(
        workerAddress);

      const notificationData = helper.getNotificationData(
        ['payments.workers.removeWorker'],
        'OST',
        'removeWorker',
        contractName,
        oThis.contractAddress,
        web3RpcProvider,
        oThis.chainId,
        options);

      const params = {
        transactionObject: transactionObject,
        notificationData: notificationData,
        senderAddress: senderAddress,
        senderPassphrase: senderPassphrase,
        contractAddress: oThis.contractAddress,
        gasPrice: gasPrice,
        gasLimit: gasLimit,
        web3RpcProvider: web3RpcProvider,
        successCallback: null,
        failCallback: null,
        errorCode: "l_ci_w_rw_4"
      };

      return onResolve(helper.performSend(params, returnType));

    });

  },


  /**
  *  Validate Remove (selfdestruct) params
  *
  * @param {string} senderAddress - address of sender
  * @param {BigNumber} gasPrice - gas price
  *
  * @return {object}
  *
  */
  validateRemoveParams: function (senderAddress, gasPrice) {
    if (!gasPrice) {
      return responseHelper.error('l_ci_w_r_1', 'gas is mandatory');
    }
    if (!helper.isAddressValid(senderAddress)) {
      return responseHelper.error('l_ci_w_r_2', 'sender address is invalid');
    }
    return responseHelper.successWithData({});
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

    const oThis = this;

    return new Promise(function (onResolve, onReject) {
      const validationResponse = oThis.validateRemoveParams(senderAddress, gasPrice);
      if (validationResponse.isFailure()) {
        return onResolve(validationResponse);
      }

      const returnType = basicHelper.getReturnType(options.returnType);

      const transactionObject = currContract.methods.remove();

      const notificationData = helper.getNotificationData(
        ['payments.workers.remove'],
        'OST',
        'remove',
        contractName,
        oThis.contractAddress,
        web3RpcProvider,
        oThis.chainId,
        options);

      const params = {
        transactionObject: transactionObject,
        notificationData: notificationData,
        senderAddress: senderAddress,
        senderPassphrase: senderPassphrase,
        contractAddress: oThis.contractAddress,
        gasPrice: gasPrice,
        gasLimit: gasLimit,
        web3RpcProvider: web3RpcProvider,
        successCallback: null,
        failCallback: null,
        errorCode: "l_ci_w_r_3"
      };

      return onResolve(helper.performSend(params, returnType));

    });

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
    if (!helper.isAddressValid(workerAddress)) {
      return Promise.resolve(responseHelper.error('l_ci_w_iw_1', 'worker address is invalid'));
    }
    const transactionObject = currContract.methods.isWorker(workerAddress);
    const encodedABI = transactionObject.encodeABI();
    const transactionOutputs = helper.getTransactionOutputs(transactionObject);
    const response = await helper.call(web3RpcProvider, this.contractAddress, encodedABI, {}, transactionOutputs);
    return Promise.resolve(responseHelper.successWithData({isValid: response[0]}));

  }

};
