"use strict";

/**
 * This is utility class for contract interacts<br><br>
 *
 * @module lib/contract_interact/helper
 */

const assert = require("assert")
  , BigNumber = require('bignumber.js')
  , openSTNotification = require('@openstfoundation/openst-notification')
  , uuid = require('uuid')
;

const rootPrefix = '../..'
  , coreAddresses = require(rootPrefix+'/config/core_addresses')
  , web3EventsDecoder = require(rootPrefix+'/lib/web3/events/decoder')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
;

/**
 * contract interact helper constructor
 *
 * @constructor
 */
const ContractInteractHelper = function () {};

ContractInteractHelper.prototype = {
  /**
   * Call methods (execute methods which DO NOT modify state of contracts)
   *
   * @param {object} web3Provider - It could be value chain or utility chain provider
   * @param {String} currContractAddr - current contract address
   * @param {Object} encodeABI - encoded method ABI data
   * @param {Object} [options] - optional params
   * @param {Object} [transactionOutputs] - optional transactionOutputs
   *
   * @return {promise}
   *
   */
  call: async function (web3Provider, currContractAddr, encodeABI, options, transactionOutputs) {
    const params = {
      to: currContractAddr,
      data: encodeABI
    };
    if (options) {
      Object.assign(params, options);
    }

    const response = await web3Provider.eth.call(params);

    if (transactionOutputs) {
      try {
        return Promise.resolve(web3Provider.eth.abi.decodeParameters(transactionOutputs, response));
      }
      catch (err) {
        return Promise.reject(err);
      }
    } else {
      return Promise.resolve(response);
    }
  },

  /**
   * get outputs of a given transaction
   *
   * @param {object} transactionObject - transactionObject is returned from call method.
   *
   * @return {array}
   *
   */
  getTransactionOutputs: function (transactionObject) {
    return transactionObject._method.outputs;
  },

  /**
   * Send methods (execute methods which modify state of a contracts)
   *
   * @param {Web3} web3Provider - It could be value chain or utility chain provider
   * @param {String} currContractAddr - current contract address
   * @param {Object} encodeABI - encoded method ABI data
   * @param {Object} [options] - optional params
   * @param {Object} [transactionOutputs] - optional transactionOutputs
   *
   * @return {promise}
   *
   */
  send: async function (web3Provider, currContractAddr, encodeABI, options, transactionOutputs) {
    const params = {
      to: currContractAddr,
      data: encodeABI
    };
    if (options) {
      Object.assign(params, options);
    }

    const response = web3Provider.eth.sendTransaction(params);

    if ( transactionOutputs ) {
      return Promise.resolve(web3Provider.eth.abi.decodeParameters(transactionOutputs, response));
    } else {
      return Promise.resolve(response);
    }
  },

  /**
   * @ignore
   */
  sendTxAsync: function (web3Provider, currContractAddr, encodeABI, senderName, txOptions) {
    const oThis = this
      , senderAddr = coreAddresses.getAddressForUser(senderName)
      ,senderPassphrase = coreAddresses.getPassphraseForUser(senderName)
    ;

    return oThis.sendTxAsyncFromAddr(web3Provider, currContractAddr, encodeABI, senderAddr, senderPassphrase, txOptions);
  },

  /**
   * @ignore
   */
  sendTxAsyncFromAddr: function (web3Provider, currContractAddr, encodeABI, senderAddr, senderPassphrase, txOptions) {
    const txParams = {
      from: senderAddr,
      to: currContractAddr,
      data: encodeABI
    };
    Object.assign(txParams, txOptions);

    return web3Provider.eth.personal.unlockAccount( senderAddr, senderPassphrase)
      .then( _ => {
        var isPromiseSettled = false;
        return new Promise(async function (onResolve, onReject) {
          try {
            web3Provider.eth.sendTransaction(txParams ,function (error, result) {
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
   * @param {Web3} web3Provider - It could be value chain or utility chain provider
   * @param {String} currContractAddr - current contract address
   * @param {String} senderName - name of transaction's sender
   * @param {Object} encodeABI - encoded method ABI data
   * @param {Object} [txOptions] - optional txOptions
   * @param {Object} [addressToNameMap] - optional addressToNameMap
   *
   * @return {Promise}
   *
   */
  safeSend: function (web3Provider, currContractAddr, encodeABI, senderName, txOptions, addressToNameMap) {
    const oThis = this
    ;

    return oThis.sendTxAsync(web3Provider, currContractAddr, encodeABI, senderName, txOptions)
      .then(function(transactionHash) {
          return oThis.getTxReceipt(web3Provider, transactionHash, addressToNameMap)
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
   * @param {Web3} web3Provider - It could be value chain or utility chain provider
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
  safeSendFromAddr: function (web3Provider, currContractAddr, encodeABI, senderAddr, senderPassphrase, txOptions, addressToNameMap) {
    const oThis = this
    ;
    return oThis.sendTxAsyncFromAddr(web3Provider, currContractAddr, encodeABI, senderAddr, senderPassphrase, txOptions).then(
      function(transactionHash) {
        return oThis.getTxReceipt(web3Provider, transactionHash, addressToNameMap);
      }
    );
  },

  /**
   * @ignore
   */
  getTxReceipt: function(web3Provider, transactionHash, addressToNameMap) {
    return new Promise (function(onResolve, onReject) {

      var tryReceipt = function() {
        setTimeout( function() {
            web3Provider.eth.getTransactionReceipt(transactionHash).then(handleResponse);
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
   * @param {Web3} web3Provider - It could be value chain or utility chain provider
   * @param {String} result - current contract address
   *
   * @return {Promise}
   *
   */
  toAddress: function (web3Provider, result) {
    return new Promise(function(onResolve, onReject){
      onResolve(web3Provider.eth.abi.decodeParameter('address', result));
    });
  },

  /**
   * Decode result and typecast it to a String
   *
   * @param {Web3} web3Provider - It could be value chain or utility chain provider
   * @param {String} result - current contract address
   *
   * @return {Promise}
   *
   */
  toString: function (web3Provider, result) {
    return new Promise(function(onResolve, onReject){
      onResolve(web3Provider.eth.abi.decodeParameter('bytes32', result));
    });
  },

  /**
   * Decode result and typecast it to a Number
   *
   * @param {Web3} web3Provider - It could be value chain or utility chain provider
   * @param {String} result - current contract address
   *
   * @return {Promise}
   *
   */
  toNumber: function (web3Provider, result) {
    return new Promise(function(onResolve, onReject){
      onResolve(web3Provider.utils.hexToNumber(result));
    });
  },

  /**
   * @ignore
   */
  decodeUint256: function (web3Provider, result) {
    return new Promise(function(onResolve, onReject){
      onResolve(web3Provider.eth.abi.decodeParameter('uint256', result));
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
   * Get transaction receipt
   *
   * @param {Web3} web3Provider - It could be value chain or utility chain provider
   * @param {String} transactionHash - transaction hash
   *
   * @return {Promise}
   *
   */
  getTransactionReceiptFromTrasactionHash: function (web3Provider, transactionHash) {
    return new Promise(function(onResolve, onReject) {
      // number of times it will attempt to fetch
      var maxAttempts = 1000;

      // time interval
      const timeInterval = 2000;

      var getReceipt = async function() {
        if (maxAttempts > 0) {
          logger.debug(`\n====== Attempting to get receipt ======\n`);
          const receipt = await web3Provider.eth.getTransactionReceipt(transactionHash);
          logger.debug(`\n====== receipt: ${receipt} ======\n`);
          if (receipt) {
            logger.debug(`\n====== got the receipt ======\n`);
            return onResolve(responseHelper.successWithData({receipt: receipt}));
          } else {
            setTimeout(getReceipt, timeInterval);
          }
        } else {
          logger.debug(`\n====== unable to get receipt ======\n`);
          const errorReason = "Unable to get receipt";
          return onResolve(responseHelper.error("l_ci_h_pse_gtrfth", errorReason));
        }
        maxAttempts--;
      };


      getReceipt();
    });
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
    const oThis = this
      , notificationData = params.notificationData
      , txUUID = notificationData.message.payload.uuid
    ;

    var isValueReturned = false
      , shouldHandlePostPay = params.shouldHandlePostPay == undefined ? 1 : params.shouldHandlePostPay
    ;


    if (basicHelper.isReturnTypeTxReceipt(returnType)) shouldHandlePostPay = 1;

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

    const web3Provider = params.web3Provider;

    const successCallback = params.successCallback;
    const failCallback = params.failCallback;
    var transactionHashRef = null;


    const notifyTransactionInitiated = function (transactionHash) {
      transactionHashRef = transactionHash;
      // set transaction hash in notification data
      // eslint-disable-next-line camelcase
      notificationData.message.payload.transaction_hash = transactionHash;
      // Publish event
      notificationData.message.kind = 'transaction_initiated';
      openSTNotification.publishEvent.perform(notificationData);
    };

    const notifyTrasactionMined = function (receipt) {
      // Publish event
      notificationData.message.kind = 'transaction_mined';
      notificationData.message.payload.receipt = receipt;
      openSTNotification.publishEvent.perform(notificationData);
    };

    const notifyTransactionError = function(errorReason) {
      // set error data in notification data
      notificationData.message.payload.error_data = errorReason;

      // Publish event
      notificationData.message.kind = 'transaction_error';
      openSTNotification.publishEvent.perform(notificationData);
    };

    const onTransactionHash = function (transactionHash) {
      notifyTransactionInitiated(transactionHash);
      const transactionResponseData = {
        transaction_uuid: txUUID,
        transaction_hash: transactionHash,
        transaction_receipt: {}
      };

      if (params.postPayParams) {
        transactionResponseData.post_pay_params = params.postPayParams;
      }

      return responseHelper.successWithData(transactionResponseData);
    };
    const onReceiptSuccess = async function (receipt) {
      // call success callback.
      if (successCallback != undefined && successCallback != null) {
        logger.debug("======helper.Calling successCallback=======");
        await successCallback(receipt);
      }
      notifyTrasactionMined(receipt);
      return responseHelper.successWithData(
        {
          transaction_uuid: txUUID,
          transaction_hash: receipt.transactionHash,
          transaction_receipt: receipt
        });
    };
    const onReceiptFail = async function (errorCode, errorReason, receipt) {
      // call fail callback
      if (failCallback != undefined && failCallback != null) {
        logger.debug("======helper.Calling failCallback=======");
        await failCallback(receipt);
      }
      notifyTransactionError(errorReason);
      const code = `${params.errorCode}|${errorCode}`;
      const errorMessage = (errorReason && errorReason.message) ? errorReason.message : `Something went wrong: l_ci_h_pse`;
      return responseHelper.error(code, errorMessage);

    };
    const onReceipt = function(receipt) {
      logger.debug("\n=======receipt========\n");
      logger.debug(receipt);
      if (receipt.status == 0x1) {
        return onReceiptSuccess(receipt);
      } else {
        const errorReason = "Transaction status is 0";
        return onReceiptFail('l_ci_h_pse_status_0', errorReason, receipt);
      }
    };

    const onCatch = function (reason) {
      if (reason && reason.message && reason.message.includes('not mined within')) {
        oThis.getTransactionReceiptFromTrasactionHash(web3Provider, transactionHashRef).then( function(getReceiptResponse) {
          if (getReceiptResponse.isSuccess()) {
            const onReceiptResponse = onReceipt(getReceiptResponse.data.receipt);
            return onReceiptResponse;
          } else {
            const errorReason = "Unable to get receipt";
            const receiptFailResponse = onReceiptFail('l_ci_h_pse_1', errorReason, {});
            return receiptFailResponse;
          }
        });

      } else {
        var errorCode = 'l_ci_h_pse_2';
        if (reason && reason.message && reason.message.includes('insufficient funds for gas * price + value')) {
          errorCode = 'l_ci_h_pse_gas_low';
          reason.message = "insufficient gas"
        }
        const receiptFailResponse =onReceiptFail(errorCode, reason, {});
        return receiptFailResponse;
      }
    };

    if (shouldHandlePostPay==0 && !params.postPayParams) {
      const errorCode = 'l_ci_h_pse_3'
        , reason = 'post pay params mandatory'
        , receiptFailResponse =onReceiptFail(errorCode, reason, {});
      ;
      if (isValueReturned == false) {
        isValueReturned = true;
        return Promise.resolve(receiptFailResponse);
      }
    }

    const asyncPerform = function () {

      return new Promise(function (onResolve, onReject) {
        // Unlock account
        web3Provider.eth.personal.unlockAccount(
          params.senderAddress,
          params.senderPassphrase)
          .then(function() {
            if (shouldHandlePostPay) {
              web3Provider.eth.sendTransaction(txParams)
                .on('transactionHash', function(transactionHash) {
                  logger.debug(`\n=======transactionHash received========: ${transactionHash} \n`);
                  const onTransactionHashResponse = onTransactionHash(transactionHash);
                  if (basicHelper.isReturnTypeTxHash(returnType)) {
                    isValueReturned = true;
                    return onResolve(onTransactionHashResponse);
                  }
                })
                .on('receipt', function(receipt) {
                  logger.debug(`\n=======receipt received========: ${receipt} \n`);
                  const onReceiptResponse = onReceipt(receipt);
                  if (basicHelper.isReturnTypeTxReceipt(returnType)) {
                    isValueReturned = true;
                    return onResolve(onReceiptResponse);
                  }
                })
                .catch( function(reason) {
                  logger.error(`\n=======Exception at location 1========: ${reason} \n`);
                  if (isValueReturned == false) {
                    isValueReturned = true;
                    return onResolve(onCatch(reason));
                  }
                });
            } else {
              web3Provider.eth.sendTransaction(txParams)
                .on('transactionHash', function(transactionHash) {
                  logger.debug(`\n=======transactionHash received========: ${transactionHash} \n`);
                  const onTransactionHashResponse = onTransactionHash(transactionHash);
                  if (basicHelper.isReturnTypeTxHash(returnType)) {
                    isValueReturned = true;
                    return onResolve(onTransactionHashResponse);
                  }
                })
                .catch( function(reason) {
                  logger.error(`\n=======Exception at location 1========: ${reason} \n`);
                  if (isValueReturned == false) {
                    isValueReturned = true;
                    return onResolve(onCatch(reason));
                  }
                });
            }
          })
          .catch(function(reason) {
            logger.error(`\n=======Exception at location 2========: ${reason} \n`);
            const receiptFailResponse =onReceiptFail('l_ci_h_pse_3', reason, {});
            if (isValueReturned == false) {
              isValueReturned = true;
              return onResolve(receiptFailResponse);
            }
          });

      });

    };
    if (basicHelper.isReturnTypeUUID(returnType)) {
      isValueReturned = true;
      asyncPerform();
      const transactionResponseData = {
        transaction_uuid: txUUID,
        transaction_hash: "",
        transaction_receipt: {}
      };
      if (params.postPayParams) {
        transactionResponseData.post_pay_params = params.postPayParams;
      }
      return Promise.resolve(responseHelper.successWithData(transactionResponseData));
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
   * @param {Object} web3Provider - address of contract
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
    web3Provider,
    chainId,
    options) {

    /*eslint-disable */
    options = options || {};
    const chainKind = '';

    const txUUID = uuid.v4()
      , tag = options.tag || ''
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
    };
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
   * Validate common pay params
   *
   * @param {string} senderAddress - address of sender
   * @param {string} beneficiaryAddress - address of beneficiary account
   * @param {BigNumber} transferAmount - transfer amount (in wei)
   * @param {string} commissionBeneficiaryAddress - address of commision beneficiary account
   * @param {BigNumber} commissionAmount - commission amount (in wei)
   * @param {string} currency - quote currency
   *
   * @return {result}
   *
   */
  validateCommonPayParams: function (senderAddress,
                                     beneficiaryAddress,
                                     transferAmount,
                                     commissionBeneficiaryAddress,
                                     commissionAmount,
                                     currency) {
    const oThis = this
    ;

    transferAmount = new BigNumber(transferAmount);
    commissionAmount = new BigNumber(commissionAmount);

    if (!basicHelper.isAddressValid(senderAddress)) {
      return responseHelper.error('l_ci_h_vcpp_1', 'senderAddress address is invalid');
    }
    if (transferAmount.isNaN() || !transferAmount.isInteger()) {
      return responseHelper.error('l_ci_h_vcpp_2', 'transfer amount cannot be negative or floating value');
    }
    if (transferAmount.equals(0)) {
      return responseHelper.error('l_ci_h_vcpp_3', 'transfer amount cannot be 0');
    }
    if (commissionAmount.isNaN() || !commissionAmount.isInteger()) {
      return responseHelper.error('l_ci_h_vcpp_4', 'Commission amount cannot be negative or floating value');
    }
    if (!basicHelper.isAddressValid(beneficiaryAddress)) {
      return responseHelper.error('l_ci_h_vcpp_5', 'beneficiaryAddress address is invalid');
    }
    if (!basicHelper.isAddressValid(commissionBeneficiaryAddress)) {
      return responseHelper.error('l_ci_h_vcpp_6', 'commissionBeneficiaryAddress is invalid');
    }
    if (!oThis.isValidCurrency(currency, true)) {
      return responseHelper.error('l_ci_h_vcpp_7', 'Given Currency is invalid');
    }

    return responseHelper.successWithData({});
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
   * @return {result}
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

    const oThis = this
    ;

    intendedPricePoint = new BigNumber(intendedPricePoint);

    const commonParamsValidationResponse = oThis.validateCommonPayParams(senderAddress,
      beneficiaryAddress,
      transferAmount,
      commissionBeneficiaryAddress,
      commissionAmount,
      currency);

    if (commonParamsValidationResponse.isFailure()) {
      return commonParamsValidationResponse;
    }
    if (intendedPricePoint.isNaN() || !intendedPricePoint.isInteger()) {
      return responseHelper.error('l_ci_h_vpp_8', 'intendedPricePoint is invalid for given currency');
    }
    if (!gasPrice ) {
      return responseHelper.error('l_ci_h_vpp_9', 'gas price is mandatory');
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

    const oThis = this
    ;

    const validationResponse = oThis.validatePayParams(senderAddress,
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

  /**
   * Validate post airdrop pay params
   *
   * @params {object} params -
   * @param {string} params.beneficiaryAddress - beneficiary address
   * @param {string} params.commissionBeneficiaryAddress - commission beneficiary address
   * @param {string} params.spender - spender address
   * @param {string} params.brandedTokenAddress - branded token address
   * @param {string} params.contractAddress - contractAddress address
   * @param {string} params.airdropBudgetHolder - airdrop budget holder address
   * @param {number} params.totalAmount - total amount that was debited from spender account
   * @param {number} params.airdropAmountToUse - airdrop amount that was used in the transaction
   *
   * @return {Promise}
   *
   */

  validatePostAirdropPayParams: function(postPayParams) {

    const oThis = this
      , beneficiaryAddress = postPayParams.beneficiaryAddress
      , commissionBeneficiaryAddress = postPayParams.commissionBeneficiaryAddress
      , spender = postPayParams.spender
      , brandedTokenAddress = postPayParams.brandedTokenAddress
      , contractAddress = postPayParams.oThis.contractAddress
      , totalAmount = postPayParams.totalAmount
      , airdropAmountToUse = postPayParams.airdropAmountToUse
      , airdropBudgetHolder = postPayParams.airdropBudgetHolder
      , chainId = postPayParams.chainId
    ;


    if (!basicHelper.isValidChainId(chainId)) {
      return responseHelper.error('l_ci_h_vapp_1', 'ChainId is invalid');
    }
    if (!basicHelper.isAddressValid(beneficiaryAddress)) {
      return responseHelper.error('l_ci_h_vapp_2', 'beneficiary address is invalid');
    }
    if (!basicHelper.isAddressValid(commissionBeneficiaryAddress)) {
      return responseHelper.error('l_ci_h_vapp_3', 'commission beneficiary address is invalid');
    }
    if (!basicHelper.isAddressValid(spender)) {
      return responseHelper.error('l_ci_h_vapp_4', 'spender address is invalid');
    }
    if (!basicHelper.isAddressValid(brandedTokenAddress)) {
      return responseHelper.error('l_ci_h_vapp_5', 'branded token address is invalid');
    }
    if (!basicHelper.isAddressValid(contractAddress)) {
      return responseHelper.error('l_ci_h_vapp_6', 'contractAddress address is invalid');
    }
    if (!basicHelper.isAddressValid(airdropBudgetHolder)) {
      return responseHelper.error('l_ci_h_vapp_7', 'airdrop budget holder address is invalid');
    }
    if (!basicHelper.isAddressValid(airdropBudgetHolder)) {
      return responseHelper.error('l_ci_h_vapp_8', 'airdrop budget holder address is invalid');
    }

    const bnTotalAmount = new BigNumber(totalAmount);
    if (bnTotalAmount.isNaN() || !bnTotalAmount.isInteger()) {
      return responseHelper.error('l_ci_h_vapp_9', 'total amount cannot be negative or floating value');
    }

    const bnAirdropAmountToUse = new BigNumber(airdropAmountToUse);
    if (bnAirdropAmountToUse.isNaN() || !bnAirdropAmountToUse.isInteger()) {
      return responseHelper.error('l_ci_h_vapp_10', 'airdrop amount cannot be negative or floating value');
    }

    return responseHelper.successWithData({});
  }
};

module.exports = new ContractInteractHelper();
