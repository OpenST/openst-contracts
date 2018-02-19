//"use strict";

/**
 *
 * This is a utility file which would be used for executing all methods on Workers contract.<br><br>
 *
 * @module lib/contract_interact/workers
 *
 */
const rootPrefix = '../..'
  , helper = require(rootPrefix + '/lib/contract_interact/helper')
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , web3RpcProvider = require(rootPrefix + '/lib/web3/providers/rpc')
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , contractName = 'workers'
  , contractAbi = coreAddresses.getAbiForContract(contractName)
  , GAS_LIMIT = coreConstants.OST_GAS_LIMIT
  , currContract = new web3RpcProvider.eth.Contract(contractAbi)
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , openSTNotification = require('@openstfoundation/openst-notification')
  , uuid = require('uuid')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
;


/**
 * @constructor
 *
 */
const Workers = module.exports = function (workerAddress) {
  this.contractAddress = workerAddress;
};

Workers.prototype = {

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

    if (gasPrice === undefined || gasPrice === '' || gasPrice === 0 || gasPrice === null) {
      return Promise.resolve(responseHelper.error('l_ci_w_sw_1', 'gas is mandatory'));
    }
    if (!helper.isAddressValid(senderAddress)) {
      return Promise.resolve(responseHelper.error('l_ci_w_sw_2', 'sender address is invalid'));
    }
    if (!helper.isAddressValid(workerAddress)) {
      return Promise.resolve(responseHelper.error('l_ci_w_sw_3', 'worker address is invalid'));
    }
    if (deactivationHeight === undefined || deactivationHeight === '' || deactivationHeight === 0 || deactivationHeight === null) {
      return Promise.resolve(responseHelper.error('l_ci_w_sw_4', 'deactivation height is mandatory'));
    }
    if (deactivationHeight < 0) {
      return Promise.resolve(responseHelper.error('l_ci_w_sw_5', 'deactivation height cannot be negetive'));
    }

    /*eslint-disable */
    options = options || {};

    const oThis = this
      , txUUID = uuid.v4()
      , tag = options.tag
      , returnType = basicHelper.getReturnType(options.returnType)
      , notificationData = {
      topics: ['payment.worker.setWorker'],
      message: {
        kind: '', // populate later: with every stage
        payload: {
          contract_name: contractName,
          contract_address: oThis.contractAddress,
          method: 'setWorker',
          params: {args: [], txParams: {}}, // populate later: when Tx params created
          transaction_hash: '', // populate later: when Tx submitted
          chain_id: web3RpcProvider.chainId,
          chain_kind: web3RpcProvider.chainKind,
          uuid: txUUID,
          tag: tag,
          error_data: {} // populate later: when error received
        }
      }
    }
    /*eslint-enable */

    const asyncSetWorker = function() {

      currContract.options.address = oThis.contractAddress;
      currContract.setProvider( web3RpcProvider.currentProvider );

      const transactionObject = currContract.methods.setWorker(
        workerAddress,
        deactivationHeight);

      const encodedABI = transactionObject.encodeABI();

      //TODO: calculate the gas limit
      const txParams = {
        from: senderAddress,
        to: oThis.contractAddress,
        data: encodedABI,
        gasPrice: gasPrice,
        gas: GAS_LIMIT
      };

      // set params in notification data
      notificationData.message.payload.params.txParams = txParams;

      return new Promise(function (onResolve, onReject) {
        // Unlock account
        web3RpcProvider.eth.personal.unlockAccount(
          senderAddress,
          senderPassphrase)
          .then(function() {
            web3RpcProvider.eth.sendTransaction(txParams)
              .on('transactionHash', function(transactionHash) {
                // set transaction hash in notification data
                // eslint-disable-next-line camelcase
                notificationData.message.payload.transaction_hash = transactionHash;
                // Publish event
                notificationData.message.kind = 'transaction_initiated';
                openSTNotification.publishEvent.perform(notificationData);

                // send response
                if (basicHelper.isReturnTypeTxHash(returnType)) {
                  return onResolve(
                    responseHelper.successWithData(
                      {
                        transaction_uuid: txUUID,
                        transaction_hash: transactionHash,
                        transaction_receipt: {}
                      }));
                }
              })
              .on('receipt', function(receipt) {
                // Publish event
                notificationData.message.kind = 'transaction_mined';
                openSTNotification.publishEvent.perform(notificationData);

                // send response
                if (basicHelper.isReturnTypeTxReceipt(returnType)) {
                  return onResolve(
                    responseHelper.successWithData(
                      {
                        transaction_uuid: txUUID,
                        transaction_hash: receipt.transactionHash,
                        transaction_receipt: receipt
                      }));
                }
              });
          })
          .catch(function(reason) {
            // set error data in notification data
            notificationData.message.payload.error_data = reason;

            // Publish event
            notificationData.message.kind = 'error';
            openSTNotification.publishEvent.perform(notificationData);

            return Promise.resolve(responseHelper.error('l_ci_w_sw_5', 'Set worker failed'));
          });

      });

    };

    // Perform set price oracle transaction as requested
    if (basicHelper.isReturnTypeUUID(returnType)) {
      asyncSetWorker();
      return Promise.resolve(
        responseHelper.successWithData(
          {
            transaction_uuid: txUUID,
            transaction_hash: "",
            transaction_receipt: {}
          }));
    }
    else {
      return asyncSetWorker();
    }

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

    if (gasPrice === undefined || gasPrice === '' || gasPrice === 0 || gasPrice === null) {
      return Promise.resolve(responseHelper.error('l_ci_w_rw_1', 'gas is mandatory'));
    }
    if (!helper.isAddressValid(senderAddress)) {
      return Promise.resolve(responseHelper.error('l_ci_w_rw_2', 'sender address is invalid'));
    }
    if (!helper.isAddressValid(workerAddress)) {
      return Promise.resolve(responseHelper.error('l_ci_w_rw_3', 'worker address is invalid'));
    }

    /*eslint-disable */
    options = options || {};

    const oThis = this
      , txUUID = uuid.v4()
      , tag = options.tag
      , returnType = basicHelper.getReturnType(options.returnType)
      , notificationData = {
      topics: ['payment.worker.removeWorker'],
      message: {
        kind: '', // populate later: with every stage
        payload: {
          contract_name: contractName,
          contract_address: oThis.contractAddress,
          method: 'removeWorker',
          params: {args: [], txParams: {}}, // populate later: when Tx params created
          transaction_hash: '', // populate later: when Tx submitted
          chain_id: web3RpcProvider.chainId,
          chain_kind: web3RpcProvider.chainKind,
          uuid: txUUID,
          tag: tag,
          error_data: {} // populate later: when error received
        }
      }
    }
    /*eslint-enable */

    const asyncRemoveWorker = function() {

      currContract.options.address = oThis.contractAddress;
      currContract.setProvider( web3RpcProvider.currentProvider );

      const transactionObject = currContract.methods.removeWorker(
        workerAddress);

      const encodedABI = transactionObject.encodeABI();

      //TODO: calculate the gas limit
      const txParams = {
        from: senderAddress,
        to: oThis.contractAddress,
        data: encodedABI,
        gasPrice: gasPrice,
        gas: GAS_LIMIT
      };

      // set params in notification data
      notificationData.message.payload.params.txParams = txParams;

      return new Promise(function (onResolve, onReject) {
        // Unlock account
        web3RpcProvider.eth.personal.unlockAccount(
          senderAddress,
          senderPassphrase)
          .then(function() {
            web3RpcProvider.eth.sendTransaction(txParams)
              .on('transactionHash', function(transactionHash) {
                // set transaction hash in notification data
                // eslint-disable-next-line camelcase
                notificationData.message.payload.transaction_hash = transactionHash;
                // Publish event
                notificationData.message.kind = 'transaction_initiated';
                openSTNotification.publishEvent.perform(notificationData);

                // send response
                if (basicHelper.isReturnTypeTxHash(returnType)) {
                  return onResolve(
                    responseHelper.successWithData(
                      {
                        transaction_uuid: txUUID,
                        transaction_hash: transactionHash,
                        transaction_receipt: {}
                      }));
                }
              })
              .on('receipt', function(receipt) {
                // Publish event
                notificationData.message.kind = 'transaction_mined';
                openSTNotification.publishEvent.perform(notificationData);

                // send response
                if (basicHelper.isReturnTypeTxReceipt(returnType)) {
                  return onResolve(
                    responseHelper.successWithData(
                      {
                        transaction_uuid: txUUID,
                        transaction_hash: receipt.transactionHash,
                        transaction_receipt: receipt
                      }));
                }
              });
          })
          .catch(function(reason) {
            // set error data in notification data
            notificationData.message.payload.error_data = reason;

            // Publish event
            notificationData.message.kind = 'error';
            openSTNotification.publishEvent.perform(notificationData);

            return Promise.resolve(responseHelper.error('l_ci_w_rw_4', 'Remove worker failed'));
          });

      });

    };

    // Perform set price oracle transaction as requested
    if (basicHelper.isReturnTypeUUID(returnType)) {
      asyncRemoveWorker();
      return Promise.resolve(
        responseHelper.successWithData(
          {
            transaction_uuid: txUUID,
            transaction_hash: "",
            transaction_receipt: {}
          }));
    }
    else {
      return asyncRemoveWorker();
    }

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

    if (gasPrice === undefined || gasPrice === '' || gasPrice === 0 || gasPrice === null) {
      return Promise.resolve(responseHelper.error('l_ci_w_r_1', 'gas is mandatory'));
    }
    if (!helper.isAddressValid(senderAddress)) {
      return Promise.resolve(responseHelper.error('l_ci_w_r_2', 'sender address is invalid'));
    }

    /*eslint-disable */
    options = options || {};

    const oThis = this
      , txUUID = uuid.v4()
      , tag = options.tag
      , returnType = basicHelper.getReturnType(options.returnType)
      , notificationData = {
      topics: ['payment.worker.remove'],
      message: {
        kind: '', // populate later: with every stage
        payload: {
          contract_name: contractName,
          contract_address: oThis.contractAddress,
          method: 'remove',
          params: {args: [], txParams: {}}, // populate later: when Tx params created
          transaction_hash: '', // populate later: when Tx submitted
          chain_id: web3RpcProvider.chainId,
          chain_kind: web3RpcProvider.chainKind,
          uuid: txUUID,
          tag: tag,
          error_data: {} // populate later: when error received
        }
      }
    }
    /*eslint-enable */

    const asyncRemove = function() {

      currContract.options.address = oThis.contractAddress;
      currContract.setProvider( web3RpcProvider.currentProvider );

      const transactionObject = currContract.methods.remove();

      const encodedABI = transactionObject.encodeABI();

      //TODO: calculate the gas limit
      const txParams = {
        from: senderAddress,
        to: oThis.contractAddress,
        data: encodedABI,
        gasPrice: gasPrice,
        gas: GAS_LIMIT
      };

      // set params in notification data
      notificationData.message.payload.params.txParams = txParams;

      return new Promise(function (onResolve, onReject) {
        // Unlock account
        web3RpcProvider.eth.personal.unlockAccount(
          senderAddress,
          senderPassphrase)
          .then(function() {
            web3RpcProvider.eth.sendTransaction(txParams)
              .on('transactionHash', function(transactionHash) {
                // set transaction hash in notification data
                // eslint-disable-next-line camelcase
                notificationData.message.payload.transaction_hash = transactionHash;
                // Publish event
                notificationData.message.kind = 'transaction_initiated';
                openSTNotification.publishEvent.perform(notificationData);

                // send response
                if (basicHelper.isReturnTypeTxHash(returnType)) {
                  return onResolve(
                    responseHelper.successWithData(
                      {
                        transaction_uuid: txUUID,
                        transaction_hash: transactionHash,
                        transaction_receipt: {}
                      }));
                }
              })
              .on('receipt', function(receipt) {
                // Publish event
                notificationData.message.kind = 'transaction_mined';
                openSTNotification.publishEvent.perform(notificationData);

                // send response
                if (basicHelper.isReturnTypeTxReceipt(returnType)) {
                  return onResolve(
                    responseHelper.successWithData(
                      {
                        transaction_uuid: txUUID,
                        transaction_hash: receipt.transactionHash,
                        transaction_receipt: receipt
                      }));
                }
              });
          })
          .catch(function(reason) {
            // set error data in notification data
            notificationData.message.payload.error_data = reason;

            // Publish event
            notificationData.message.kind = 'error';
            openSTNotification.publishEvent.perform(notificationData);

            return Promise.resolve(responseHelper.error('l_ci_w_r_2', 'Remove failed'));
          });

      });

    };

    // Perform set price oracle transaction as requested
    if (basicHelper.isReturnTypeUUID(returnType)) {
      asyncRemove();
      return Promise.resolve(
        responseHelper.successWithData(
          {
            transaction_uuid: txUUID,
            transaction_hash: "",
            transaction_receipt: {}
          }));
    }
    else {
      return asyncRemove();
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