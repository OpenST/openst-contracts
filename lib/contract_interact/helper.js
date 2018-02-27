"use strict";

/**
 * This is utility class for contract interacts<br><br>
 *
 * Ref: {@link module:ContractHelper}
 *
 * @module lib/contract_helper/helper
 */

const rootPrefix = '../..'
  , assert = require("assert")
  , BigNumber = require('bignumber.js')
  , coreAddresses = require(rootPrefix+'/config/core_addresses')
  , web3EventsDecoder = require(rootPrefix+'/lib/web3/events/decoder')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
  , openSTNotification = require('@openstfoundation/openst-notification')
  , uuid = require('uuid')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
;

/**
 * Deploy Helper class to perform deploy
 *
 * @exports lib/contract_helper/helper
 */
const helper = {

  /**
   * Call methods (execute methods which DO NOT modify state of contracts)
   *
   * @param {Web3} web3RpcProvider - It could be value chain or utility chain provider
   * @param {String} currContractAddr - current contract address
   * @param {Object} encodeABI - encoded method ABI data
   * @param {Object} [options] - optional params
   * @param {Object} [transactionOutputs] - optional transactionOutputs
   *
   * @return {Promise}
   *
   */
  call: function (web3RpcProvider, currContractAddr, encodeABI, options, transactionOutputs) {
    var params = {
      to: currContractAddr,
      data: encodeABI
    };
    if (options) {
      Object.assign(params, options);
    }
    return web3RpcProvider.eth.call(params)
      .then(function(response) {
        if (transactionOutputs ) {
          try {
            return web3RpcProvider.eth.abi.decodeParameters(transactionOutputs, response);
          }
          catch (err) {
            return Promise.reject(err);
          }
        } else {
          return response;
        }
      });
  },

  /**
   * get outputs of a given transaction
   *
   * @param {Object} transactionObject - transactionObject is returned from call method.
   *
   * @return {Object}
   *
   */
  getTransactionOutputs: function ( transactionObject ) {
    return transactionObject._method.outputs;
  },

  /**
   * Send methods (execute methods which modify state of a contracts)
   *
   * @param {Web3} web3RpcProvider - It could be value chain or utility chain provider
   * @param {String} currContractAddr - current contract address
   * @param {Object} encodeABI - encoded method ABI data
   * @param {Object} [options] - optional params
   * @param {Object} [transactionOutputs] - optional transactionOutputs
   *
   * @return {Promise}
   *
   */
  send: function (web3RpcProvider, currContractAddr, encodeABI, options, transactionOutputs) {
    var params = {
      to: currContractAddr,
      data: encodeABI
    };
    if (options) {
      Object.assign(params, options);
    }

    return web3RpcProvider.eth.sendTransaction(params)
      .then(function(response) {
        if ( transactionOutputs ) {
          return web3RpcProvider.eth.abi.decodeParameters(transactionOutputs, response);
        } else {
          return response;
        }
      });

  },

  /**
   * @ignore
   */
  sendTxAsync: function (web3RpcProvider, currContractAddr, encodeABI, senderName, txOptions) {
    const senderAddr = coreAddresses.getAddressForUser(senderName)
      ,senderPassphrase = coreAddresses.getPassphraseForUser(senderName)
    ;

    return helper.sendTxAsyncFromAddr(web3RpcProvider, currContractAddr, encodeABI, senderAddr, senderPassphrase, txOptions);
  },

  /**
   * @ignore
   */
  sendTxAsyncFromAddr: function (web3RpcProvider, currContractAddr, encodeABI, senderAddr, senderPassphrase, txOptions) {
    const txParams = {
      from: senderAddr,
      to: currContractAddr,
      data: encodeABI
    };
    Object.assign(txParams, txOptions);

    return web3RpcProvider.eth.personal.unlockAccount( senderAddr, senderPassphrase)
      .then( _ => {
        var isPromiseSettled = false;
        return new Promise(async function (onResolve, onReject) {
          try {
            web3RpcProvider.eth.sendTransaction(txParams ,function (error, result) {
              //THIS CALLBACK IS IMPORTANT -> on('error') Does not explain the reason.
              if ( error ) {
                !isPromiseSettled && onReject( error );
              }
            })
              .on('transactionHash', txHash => {
                isPromiseSettled = true;
                onResolve( txHash );
              });
          } catch ( ex ) {
            onReject( ex );
          }
        });
      })
      .catch( reason => {
        return Promise.reject( reason );
      });
  },

  /**
   * Safe Send a transaction (this internally waits for transaction to be mined)
   *
   * @param {Web3} web3RpcProvider - It could be value chain or utility chain provider
   * @param {String} currContractAddr - current contract address
   * @param {String} senderName - name of transaction's sender
   * @param {Object} encodeABI - encoded method ABI data
   * @param {Object} [txOptions] - optional txOptions
   * @param {Object} [addressToNameMap] - optional addressToNameMap
   *
   * @return {Promise}
   *
   */
  safeSend: function (web3RpcProvider, currContractAddr, encodeABI, senderName, txOptions, addressToNameMap) {
    return helper.sendTxAsync(web3RpcProvider, currContractAddr, encodeABI, senderName, txOptions)
      .then(function(transactionHash) {
        return helper.getTxReceipt(web3RpcProvider, transactionHash, addressToNameMap)
          .then(function(txReceipt) {
            /*if (txReceipt.gasUsed == txOptions.gasPrice) {
              console.error("safeSend used complete gas gasPrice : " + txOptions.gasPrice);
            }
            */
            return Promise.resolve(txReceipt);
          });
      }
      );
  },

  /**
   * Safe Send a transaction (this internally waits for transaction to be mined)
   *
   * @param {Web3} web3RpcProvider - It could be value chain or utility chain provider
   * @param {String} currContractAddr - current contract address
   * @param {String} senderAddr - address of transaction's sender senderAddr
   * @param {String} senderPassphrase - passphrase of
   * @param {Object} encodeABI - encoded method ABI data
   * @param {Object} [txOptions] - optional txOptions
   * @param {Object} [addressToNameMap] - optional addressToNameMap
   *
   * @return {Promise}
   *
   */
  safeSendFromAddr: function (web3RpcProvider, currContractAddr, encodeABI, senderAddr, senderPassphrase, txOptions, addressToNameMap) {
    return helper.sendTxAsyncFromAddr(web3RpcProvider, currContractAddr, encodeABI, senderAddr, senderPassphrase, txOptions).then(
      function(transactionHash) {
        return helper.getTxReceipt(web3RpcProvider, transactionHash, addressToNameMap);
      }
    );
  },

  /**
   * @ignore
   */
  getTxReceipt: function(web3RpcProvider, transactionHash, addressToNameMap) {
    return new Promise (function(onResolve, onReject) {

      var tryReceipt = function() {
        setTimeout( function() {
          web3RpcProvider.eth.getTransactionReceipt(transactionHash).then(handleResponse);
        },
        5000
        );
      };

      var handleResponse = function (response) {
        if (response) {
          //clearInterval(txSetInterval);
          const web3EventsDecoderResult = web3EventsDecoder.perform(response, addressToNameMap);
          onResolve(web3EventsDecoderResult);
        } else {
          tryReceipt();
        }
      };

      tryReceipt();

    });
  },

  /**
   * Decode result and typecast it to an Address
   *
   * @param {Web3} web3RpcProvider - It could be value chain or utility chain provider
   * @param {String} result - current contract address
   *
   * @return {Promise}
   *
   */
  toAddress: function (web3RpcProvider, result) {
    return new Promise(function(onResolve, onReject){
      onResolve(web3RpcProvider.eth.abi.decodeParameter('address', result));
    });
  },

  /**
   * Decode result and typecast it to a String
   *
   * @param {Web3} web3RpcProvider - It could be value chain or utility chain provider
   * @param {String} result - current contract address
   *
   * @return {Promise}
   *
   */
  toString: function (web3RpcProvider, result) {
    return new Promise(function(onResolve, onReject){
      onResolve(web3RpcProvider.eth.abi.decodeParameter('bytes32', result));
    });
  },

  /**
   * Decode result and typecast it to a Number
   *
   * @param {Web3} web3RpcProvider - It could be value chain or utility chain provider
   * @param {String} result - current contract address
   *
   * @return {Promise}
   *
   */
  toNumber: function (web3RpcProvider, result) {
    return new Promise(function(onResolve, onReject){
      onResolve(web3RpcProvider.utils.hexToNumber(result));
    });
  },

  /**
   * @ignore
   */
  decodeUint256: function (web3RpcProvider, result) {
    return new Promise(function(onResolve, onReject){
      onResolve(web3RpcProvider.eth.abi.decodeParameter('uint256', result));
    });
  },

  /**
   * @ignore
   */
  assertAddress: function ( address ) {
    assert.ok(/^0x[0-9a-fA-F]{40}$/.test(address), `Invalid blockchain address: ${address}`);
  },

  /**
   * Stub method to generate managed key passphrase
   *
   * @return {String}
   *
   */
  generateManagedKeyPassphrase: function (...arg) {
    //STUB METHOD.
    //We will have some algorithm here to generate the passphrase based on passed arguments.
    //args will be inputs from various sources like foundation/member company/the enduser.
    return process.env.OST_MANAGED_KEY_PASSPHRASE;
  },


  /**
   * Perform send
   *
   * @param {params} Object - parmaters
   * @param {returnType} string - return type
   * @param {String} senderAddr - address of transaction's sender senderAddr
   *
   * @return {Promise}
   *
   */
  performSend: function (params, returnType) {

    const notificationData = params.notificationData;
    const txUUID = notificationData.message.payload.uuid;

    const asyncPerform = function () {

      const transactionObject = params.transactionObject;

      const encodedABI = transactionObject.encodeABI();

      //TODO: calculate the gas limit
      const txParams = {
        from: params.senderAddress,
        to: params.contractAddress,
        data: encodedABI,
        gasPrice: params.gasPrice,
        gas: params.gasLimit
      };

      // set params in notification data
      notificationData.message.payload.params.txParams = txParams;

      const web3RpcProvider = params.web3RpcProvider;

      const successCallback = params.successCallback;
      const failCallback = params.failCallback;

      return new Promise(function (onResolve, onReject) {
        // Unlock account
        web3RpcProvider.eth.personal.unlockAccount(
          params.senderAddress,
          params.senderPassphrase)
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
                
                if (receipt.status == 0x1) {
                  if (successCallback != undefined && successCallback != null) {
                    successCallback(receipt);
                  }
                } else {
                  if (failCallback != undefined && failCallback != null) {
                    failCallback(receipt);
                  }
                }

                // Publish event
                notificationData.message.kind = 'transaction_mined';
                openSTNotification.publishEvent.perform(notificationData);

                // send response
                if (basicHelper.isReturnTypeTxReceipt(returnType)) {
                  if (receipt.status == 0x1) {
                    return onResolve(
                      responseHelper.successWithData(
                        {
                          transaction_uuid: txUUID,
                          transaction_hash: receipt.transactionHash,
                          transaction_receipt: receipt
                        }));
                  } else {
                    const errorCode = params.errorCode || "pse";
                    return onResolve(responseHelper.error('errorCode', 'transaction failed'));
                  }
                }
              });
          })
          .catch(function(reason) {
            if (failCallback != undefined && failCallback != null) {
              failCallback(reason);
            }
            // set error data in notification data
            notificationData.message.payload.error_data = reason;

            // Publish event
            notificationData.message.kind = 'transaction_error';
            openSTNotification.publishEvent.perform(notificationData);

            const errorCode = params.errorCode || "pse";
            return onResolve(responseHelper.error('errorCode', 'transaction failed'));
          });

      });

    };
    if (basicHelper.isReturnTypeUUID(returnType)) {
      asyncPerform();
      return Promise.resolve(
        responseHelper.successWithData(
          {
            transaction_uuid: txUUID,
            transaction_hash: "",
            transaction_receipt: {}
          }));
    } else {
      return asyncPerform();
    }

  },

  /**
   * get notification event formatted data
   *
   * @param {array} topics - topics where the event will be published
   * @param {String} publisher - publisher name
   * @param {String} method - method name
   * @param {String} contractName - name of contract
   * @param {String} contractAddress - address of contract
   * @param {Object} web3RpcProvider - address of contract
   * @param {Object} options - options
   *
   * @return {Promise}
   *
   */
  getNotificationData: function(
    topics,
    publisher,
    method,
    contractName,
    contractAddress,
    web3RpcProvider,
    chainId,
    options) {

    /*eslint-disable */
    options = options || {};
    const chainKind = '';
    
    const txUUID = uuid.v4()
      , tag = options.tag      
      , notificationData = {
      topics: topics,
      publisher: publisher,
      message: {
        kind: '', // populate later: with every stage
        payload: {
          contract_name: contractName,
          contract_address: contractAddress,
          method: method,
          params: {args: [], txParams: {}}, // populate later: when Tx params created
          transaction_hash: '', // populate later: when Tx submitted
          chain_id: chainId,
          chain_kind: chainKind,
          uuid: txUUID,
          tag: tag,
          error_data: {} // populate later: when error received
        }
      }
    }
    /*eslint-enable */

    return notificationData;
  },


 /**
  * valid currency
  *
  * @param {string} currency - currency
  * @param {bool} allow_blank - true / false, '' if allow_blank is true
  *
  * @return {Bool} - true / false
  */
  isValidCurrency: function(currency, allow_blank){
    if (currency === undefined || currency === null || (currency !== currency.toUpperCase())){
      return false;
    }
    allow_blank = (allow_blank || false);
    if (!allow_blank && (currency === '' || currency.length !== 3)){
      return false;
    }
    return true;
  },

  /** check if return type is true/false
  *
  * @param {Number} num - Number
  *
  * @return {boolean}
  *
  * Note - Don't use for BigNumbers
  */
  isDecimal: function(num) {
    return (num % 1 != 0);
  },

  /**
   * Validate Airdrop params
   *
   * @param {string} senderAddress - address of sender
   * @param {string} beneficiaryAddress - address of beneficiary account
   * @param {BigNumber} transferAmount - transfer amount (in wei)
   * @param {string} commissionBeneficiaryAddress - address of commision beneficiary account
   * @param {BigNumber} commissionAmount - commission amount (in wei)
   * @param {string} currency - quote currency
   * @param {BigNumber} intendedPricePoint - price point at which the pay is intended (in wei)
   * @param {BigNumber} gasPrice - gas price
   *
   * @return {Promise}
   *
   */
  validatePayParams: function(
    senderAddress,
    beneficiaryAddress,
    transferAmount,
    commissionBeneficiaryAddress,
    commissionAmount,
    currency,
    intendedPricePoint,
    gasPrice) {

    transferAmount = new BigNumber(transferAmount);
    commissionAmount = new BigNumber(commissionAmount);
    intendedPricePoint = new BigNumber(intendedPricePoint);

    if (!basicHelper.isAddressValid(senderAddress)) {
      return responseHelper.error('l_ci_h_vpp_1', 'senderAddress address is invalid');
    }
    if (transferAmount.isNaN() || !transferAmount.isInteger()) {
      return responseHelper.error('l_ci_h_vpp_2', 'transfer amount cannot be negative or floating value');
    }
    if (commissionAmount.isNaN() || !commissionAmount.isInteger()) {
      return responseHelper.error('l_ci_h_vpp_3', 'Commission amount cannot be negative or floating value');
    }
    if (!basicHelper.isAddressValid(beneficiaryAddress)) {
      return responseHelper.error('l_ci_h_vpp_4', 'beneficiaryAddress address is invalid');
    }
    if (!basicHelper.isAddressValid(commissionBeneficiaryAddress)) {
      return responseHelper.error('l_ci_h_vpp_5', 'commissionBeneficiaryAddress is invalid');
    }
    if (!helper.isValidCurrency(currency, true)) {
      return responseHelper.error('l_ci_h_vpp_6', 'Given Currency is invalid');
    }
    if (intendedPricePoint.isNaN() || !intendedPricePoint.isInteger()) {
      return responseHelper.error('l_ci_h_vpp_7', 'intendedPricePoint is invalid for given currency');
    }
    if (!gasPrice ) {
      return responseHelper.error('l_ci_h_vpp_8', 'gas price is mandatory');
    }
    return responseHelper.successWithData({});
  },

  /**
   * Validate Airdrop pay params
   *
   * @param {string} senderAddress - address of sender
   * @param {string} beneficiaryAddress - address of beneficiary account
   * @param {BigNumber} transferAmount - transfer amount (in wei)
   * @param {string} commissionBeneficiaryAddress - address of commision beneficiary account
   * @param {BigNumber} commissionAmount - commission amount (in wei)
   * @param {string} currency - quote currency
   * @param {BigNumber} intendedPricePoint - price point at which the pay is intended (in wei)
   * @param {BigNumber} gasPrice - gas price
   * @param {Hex} user - User address
   *
   * @return {Promise}
   *
   */
  validateAirdropPayParams: function(
    senderAddress,
    beneficiaryAddress,
    transferAmount,
    commissionBeneficiaryAddress,
    commissionAmount,
    currency,
    intendedPricePoint,
    gasPrice,
    user) {

    const validationResponse = helper.validatePayParams(senderAddress,
      beneficiaryAddress,
      transferAmount,
      commissionBeneficiaryAddress,
      commissionAmount,
      currency,
      intendedPricePoint,
      gasPrice);

    if (validationResponse.isFailure()) {
      return validationResponse;
    }

    if (!basicHelper.isAddressValid(user)) {
      return responseHelper.error('l_ci_h_vapp_2', 'user address is invalid');
    }

    return responseHelper.successWithData({});

  },

};

module.exports = helper;
