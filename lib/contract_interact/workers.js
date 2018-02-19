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
  ;

const contractName = 'workers';
const GAS_LIMIT = coreConstants.OST_GAS_LIMIT
  , contractAbi = coreAddresses.getAbiForContract(contractName)
  , currContract = new web3RpcProvider.eth.Contract(contractAbi)
  ;


/**
 * @constructor
 *
 */
const Workers = module.exports = function (workerAddress) {
  this.contractAddress = workerAddress;
};

Workers.prototype = {

  contractAddress: null,

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
    if (gasPrice === undefined || gasPrice === '' || gasPrice === 0 || gasPrice === null) {
      return responseHelper.error('l_ci_w_sw_1', 'gas is mandatory');
    }
    if (!helper.isAddressValid(senderAddress)) {
      return responseHelper.error('l_ci_w_sw_2', 'sender address is invalid');
    }
    if (!helper.isAddressValid(workerAddress)) {
      return responseHelper.error('l_ci_w_sw_3', 'worker address is invalid');
    }
    if (deactivationHeight === undefined || deactivationHeight === '' || deactivationHeight === 0 || deactivationHeight === null) {
      return responseHelper.error('l_ci_w_sw_4', 'deactivation height is mandatory');
    }
    if (deactivationHeight < 0) {
      return responseHelper.error('l_ci_w_sw_5', 'deactivation height cannot be negetive');
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
  * @param {number} chainId - chain Id
  * @param {options} object - for params like returnType, tag.
  *
  * @return {Promise}
  *
  */
  setWorker: function (senderAddress, senderPassphrase, workerAddress, deactivationHeight, gasPrice, chainId, options) {

    const oThis = this;

    return new Promise(function (onResolve, onReject) {
      const validationResponse = oThis.validateSetWorkersParams(senderAddress, workerAddress, deactivationHeight, gasPrice );
      if (validationResponse.isFailure()) {
        return onResolve(validationResponse);
      }

      const returnType = basicHelper.getReturnType(options.returnType);

      const transactionObject = currContract.methods.setWorker(
        workerAddress,
        deactivationHeight);

      const notificationData = helper.getNotificaitonData(
        ['payment.worker.setWorker'],
        'setWorker',
        contractName,
        oThis.contractAddress,
        web3RpcProvider,
        options);

      const params = {
        transactionObject: transactionObject,
        notificationData: notificationData,
        senderAddress: senderAddress,
        senderPassphrase: senderPassphrase,
        contractAddress: oThis.contractAddress,
        gasPrice: gasPrice,
        gasLimit: GAS_LIMIT,
        web3RpcProvider: web3RpcProvider,
        successCallback: null,
        failCallback: null,
        errorCode: "l_ci_w_sw_6"
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
    if (gasPrice === undefined || gasPrice === '' || gasPrice === 0 || gasPrice === null) {
      return responseHelper.error('l_ci_w_rw_1', 'gas is mandatory');
    }
    if (!helper.isAddressValid(senderAddress)) {
      return responseHelper.error('l_ci_w_rw_2', 'sender address is invalid');
    }
    if (!helper.isAddressValid(workerAddress)) {
      return responseHelper.error('l_ci_w_rw_3', 'worker address is invalid');
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
  * @param {number} chainId - chain Id
  * @param {options} object - for params like returnType, tag.
  *
  * @return {Promise}
  *
  */
  removeWorker: function (senderAddress, senderPassphrase, workerAddress, gasPrice, chainId, options) {

    const oThis = this;

    return new Promise(function (onResolve, onReject) {
      const validationResponse = oThis.validateRemoveWorkerParams(senderAddress, workerAddress, gasPrice);
      if (validationResponse.isFailure()) {
        return onResolve(validationResponse);
      }

      const returnType = basicHelper.getReturnType(options.returnType);

      const transactionObject = currContract.methods.removeWorker(
        workerAddress);

      const notificationData = helper.getNotificaitonData(
        ['payment.worker.removeWorker'],
        'removeWorker',
        contractName,
        oThis.contractAddress,
        web3RpcProvider,
        options);

      const params = {
        transactionObject: transactionObject,
        notificationData: notificationData,
        senderAddress: senderAddress,
        senderPassphrase: senderPassphrase,
        contractAddress: oThis.contractAddress,
        gasPrice: gasPrice,
        gasLimit: GAS_LIMIT,
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
    if (gasPrice === undefined || gasPrice === '' || gasPrice === 0 || gasPrice === null) {
      return Promise.resolve(responseHelper.error('l_ci_w_r_1', 'gas is mandatory'));
    }
    if (!helper.isAddressValid(senderAddress)) {
      return Promise.resolve(responseHelper.error('l_ci_w_r_2', 'sender address is invalid'));
    }
    return responseHelper.successWithData({});
  },


  /**
  * Remove (selfdestruct)
  *
  * @param {string} senderAddr - address of sender
  * @param {string} senderPassphrase - passphrase of sender
  * @param {BigNumber} gasPrice - gas price
  * @param {number} chainId - chain Id
  * @param {options} object - for params like returnType, tag.
  *
  * @return {Promise}
  *
  */
  remove: function (senderAddress, senderPassphrase, gasPrice, chainId, options) {

    const oThis = this;

    return new Promise(function (onResolve, onReject) {
      const validationResponse = oThis.validateRemoveParams(senderAddress, gasPrice);
      if (validationResponse.isFailure()) {
        return onResolve(validationResponse);
      }

      const returnType = basicHelper.getReturnType(options.returnType);

      const transactionObject = currContract.methods.remove();

      const notificationData = helper.getNotificaitonData(
        ['payment.worker.remove'],
        'remove',
        contractName,
        oThis.contractAddress,
        web3RpcProvider,
        options);

      const params = {
        transactionObject: transactionObject,
        notificationData: notificationData,
        senderAddress: senderAddress,
        senderPassphrase: senderPassphrase,
        contractAddress: oThis.contractAddress,
        gasPrice: gasPrice,
        gasLimit: GAS_LIMIT,
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
