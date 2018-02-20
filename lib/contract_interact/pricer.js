//"use strict";

/**
 *
 * This is a utility file which would be used for executing all methods on Pricer contract.<br><br>
 *
 * @module lib/contract_interact/pricer
 *
 */

const rootPrefix = '../..'
  , BigNumber = require('bignumber.js')
  , Token = require('./branded_token')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
  , cHelper = require(rootPrefix + '/lib/contract_interact/cache_helper')
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , eventDecoder = require(rootPrefix + '/lib/web3/events/decoder')
  , helper = require(rootPrefix + '/lib/contract_interact/helper')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , web3RpcProvider = require(rootPrefix + '/lib/web3/providers/rpc')
;

const contractName = 'pricer'
  , gasLimit = coreConstants.OST_GAS_LIMIT
  , contractAbi = coreAddresses.getAbiForContract(contractName)
  , currContract = new web3RpcProvider.eth.Contract(contractAbi)
;

/**
 * @constructor
 *
 * @param {Hex} pricerAddress - pricer contract address
 * @param {string} chainId - chain ID
 *
 */
const Pricer = module.exports = function (pricerAddress, chainId) {

  const oThis = this;
  oThis.contractAddress = pricerAddress;
  oThis.chainId = chainId;
  oThis.cacheHelper = new cHelper(chainId);
  // create address to name map
  oThis.addressToNameMap[pricerAddress.toLowerCase()] = contractName;

  oThis.brandedToken().then(function(response) {
    oThis.brandedTokenAddress = response.data.brandedToken;
    oThis.token = new Token(response.data.brandedToken, oThis.chainId);
    oThis.addressToNameMap[response.data.brandedToken.toLowerCase()] = 'brandedtoken';
  });

  oThis.conversionRate().then(function(response) {
    oThis.pricerConversionRate = response.data.conversionRate;
  });

  oThis.decimals().then(function(response) {
    oThis.pricerDecimals = response.data.decimals;
  });

};


Pricer.prototype = {
  // Define all the properties
  contractAddress: null,
  chainId: null,
  token: null,
  addressToNameMap: {},
  brandedTokenAddress: null,
  cacheHelper: null,
  pricerConversionRate: null,
  pricerDecimals: null,

  /**
  * Get branded token address of pricer
  *
  * @return {Promise}
  *
  */
  brandedToken: async function () {
    const transactionObject = currContract.methods.brandedToken();
    const encodedABI = transactionObject.encodeABI();
    const transactionOutputs = helper.getTransactionOutputs(transactionObject);
    const response = await helper.call(web3RpcProvider, this.contractAddress, encodedABI, {}, transactionOutputs);
    return Promise.resolve(responseHelper.successWithData({brandedToken: response[0]}));
  },


  /**
  * Get acceptable margin for the given currency
  *
  * @param {string} currency - quote currency
  *
  * @return {Promise}
  *
  */
  acceptedMargins: async function (currency) {
    const oThis = this;
    if (!helper.isValidCurrency(currency, false)) {
      return Promise.resolve(responseHelper.error('l_ci_p_am_1', 'currency is mandatory'));
    }
    var cacheResult = await oThis.cacheHelper.getAcceptedMarginsFromCache(currency, oThis.contractAddress);
    if (cacheResult.isSuccess() && cacheResult.data.response !== null) {
      return responseHelper.successWithData({acceptedMargins: cacheResult.data.response});
    } else {
      const transactionObject = currContract.methods.acceptedMargins(web3RpcProvider.utils.asciiToHex(currency));
      const encodedABI = transactionObject.encodeABI();
      const transactionOutputs = helper.getTransactionOutputs(transactionObject);
      const response = await helper.call(web3RpcProvider, this.contractAddress, encodedABI, {}, transactionOutputs);
      // update cache
      oThis.cacheHelper.setAcceptedMarginsToCache(currency, oThis.contractAddress, response[0]);
      return Promise.resolve(responseHelper.successWithData({acceptedMargins: response[0]}));
    }
  },


  /**
  * Get address of price oracle for the given currency
  *
  * @param {string} currency - quote currency
  *
  * @return {Promise}
  *
  */
  priceOracles: async function (currency) {
    if (!helper.isValidCurrency(currency, false)) {
      return Promise.resolve(responseHelper.error('l_ci_p_po_1', 'currency is mandatory'));
    }
    const transactionObject = currContract.methods.priceOracles(web3RpcProvider.utils.asciiToHex(currency));
    const encodedABI = transactionObject.encodeABI();
    const transactionOutputs = helper.getTransactionOutputs(transactionObject);
    const response = await helper.call(web3RpcProvider, this.contractAddress, encodedABI, {}, transactionOutputs);
    return Promise.resolve(responseHelper.successWithData({priceOracles: response[0]}));
  },


  /**
  * Get base currency of pricer
  *
  * @return {Promise}
  *
  */
  baseCurrency: async function () {
    const transactionObject = currContract.methods.baseCurrency();
    const encodedABI = transactionObject.encodeABI();
    const transactionOutputs = helper.getTransactionOutputs(transactionObject);
    const response = await helper.call(web3RpcProvider, this.contractAddress, encodedABI, {}, transactionOutputs);
    return Promise.resolve(responseHelper.successWithData({baseCurrency: response[0], symbol: web3RpcProvider.utils.hexToString(response[0])}));
  },


  /**
  * Get decimal of pricer
  *
  * @return {Promise}
  *
  */
  decimals: async function () {
    const transactionObject = currContract.methods.decimals();
    const encodedABI = transactionObject.encodeABI();
    const transactionOutputs = helper.getTransactionOutputs(transactionObject);
    const response = await helper.call(web3RpcProvider, this.contractAddress, encodedABI, {}, transactionOutputs);
    return Promise.resolve(responseHelper.successWithData({decimals: response[0]}));
  },


  /**
  * Get conversion rate of pricer
  *
  * @return {Promise}
  *
  */
  conversionRate: async function () {
    const transactionObject = currContract.methods.conversionRate();
    const encodedABI = transactionObject.encodeABI();
    const transactionOutputs = helper.getTransactionOutputs(transactionObject);
    const response = await helper.call(web3RpcProvider, this.contractAddress, encodedABI, {}, transactionOutputs);
    return Promise.resolve(responseHelper.successWithData({conversionRate: response[0]}));
  },


  /**
  * Validate set price oracle parameters
  *
  * @param {string} senderAddr - address of sender
  * @param {string} currency - quote currency
  * @param {string} address - address of price pracle
  * @param {BigNumber} gasPrice - gas price
  *
  * @return {response}
  *
  */
  validateSetPriceOracleParams: function (senderAddress, currency, address, gasPrice) {
    if (!helper.isValidCurrency(currency, false)) {
      return responseHelper.error('l_ci_p_spo_1', 'currency is mandatory');
    }
    if (!gasPrice || gasPrice == 0) {
      return responseHelper.error('l_ci_p_spo_2', 'gas is mandatory');
    }
    if (!helper.isAddressValid(address)) {
      return responseHelper.error('l_ci_p_spo_3', 'address is invalid');
    }
    if (!helper.isAddressValid(senderAddress)) {
      return responseHelper.error('l_ci_p_spo_4', 'address is invalid');
    }
    return responseHelper.successWithData({});
  },

  /**
  * Set or updates the price oracle address for a given currency
  *
  * @param {string} senderAddr - address of sender
  * @param {string} senderPassphrase - passphrase of sender
  * @param {string} currency - quote currency
  * @param {string} address - address of price pracle
  * @param {BigNumber} gasPrice - gas price
  * @param {object} options - for params like returnType, tag.
  *
  * @return {Promise}
  *
  */
  setPriceOracle: function (senderAddress, senderPassphrase, currency, address, gasPrice, options) {

    const oThis = this;

    return new Promise(function (onResolve, onReject) {
      const validationResponse = oThis.validateSetPriceOracleParams(senderAddress, currency, address, gasPrice);
      if (validationResponse.isFailure()) {
        return onResolve(validationResponse);
      }

      const returnType = basicHelper.getReturnType(options.returnType);

      const transactionObject = currContract.methods.setPriceOracle(
        web3RpcProvider.utils.asciiToHex(currency),
        address);

      const notificationData = helper.getNotificationData(
        ['payment.pricer.setPriceOracle'],
        'setPriceOracle',
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
        errorCode: "l_ci_p_spo_5"
      };

      return onResolve(helper.performSend(params, returnType));

    });

  },


  /**
  * Validate unset price oracle parameters
  *
  * @param {string} senderAddr - address of sender
  * @param {string} currency - quote currency
  * @param {BigNumber} gasPrice - gas price
  *
  * @return {response}
  *
  */
  validateUnsetPriceOracleParams: function (senderAddress, currency, gasPrice) {
    if (!helper.isValidCurrency(currency, false)) {
      return responseHelper.error('l_ci_p_uspo_1', 'currency is mandatory');
    }
    if (!gasPrice || gasPrice === 0) {
      return responseHelper.error('l_ci_p_uspo_2', 'gas is mandatory');
    }
    if (!helper.isAddressValid(senderAddress)) {
      return responseHelper.error('l_ci_p_uspo_3', 'address is invalid');
    }
    return responseHelper.successWithData({});
  },

  /**
  * Remove the price oracle address for a given currency
  *
  * @param {string} senderAddr - address of sender
  * @param {string} senderPassphrase - passphrase of sender
  * @param {string} currency - quote currency
  * @param {BigNumber} gasPrice - gas price
  * @param {object} options - for params like returnType, tag.
  *
  * @return {Promise}
  *
  */
  unsetPriceOracle: function (senderAddress, senderPassphrase, currency, gasPrice, options) {

    const oThis = this;

    return new Promise(function (onResolve, onReject) {
      const validationResponse = oThis.validateUnsetPriceOracleParams(senderAddress, currency, gasPrice);

      if (validationResponse.isFailure()) {
        return onResolve(validationResponse);
      }

      const returnType = basicHelper.getReturnType(options.returnType);

      const transactionObject = currContract.methods.unsetPriceOracle(web3RpcProvider.utils.asciiToHex(currency));

      const notificationData = helper.getNotificationData(
        ['payment.pricer.unsetPriceOracle'],
        'unsetPriceOracle',
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
        errorCode: "l_ci_p_uspo_4"
      };

      return onResolve(helper.performSend(params, returnType));
    });

  },

  /**
  * Validate set accepted margin params parameters
  *
  * @param {string} senderAddress - address of sender
  * @param {string} currency - quote currency
  * @param {BigNumber} acceptedMargin - accepted margin for the given currency (in wei)
  * @param {BigNumber} gasPrice - gas price
  *
  * @return {response}
  *
  */
  validateSetAcceptedMarginParams: function (senderAddress, currency, acceptedMargin, gasPrice) {

    if (!helper.isValidCurrency(currency, false)) {
      return responseHelper.error('l_ci_p_sam_1', 'currency is mandatory');
    }
    if (!gasPrice || gasPrice === 0) {
      return responseHelper.error('l_ci_p_sam_2', 'gas price is mandatory');
    }
    if (acceptedMargin < 0) {
      return responseHelper.error('l_ci_p_sam_3', 'accepted margin cannot be negetive');
    }
    if (!helper.isAddressValid(senderAddress)) {
      return responseHelper.error('l_ci_p_sam_4', 'address is invalid');
    }
    return responseHelper.successWithData({});

  },

  /**
  * Set or update the acceptable margin range for a given currency
  *
  * @param {string} senderAddr - address of sender
  * @param {string} senderPassphrase - passphrase of sender
  * @param {string} currency - quote currency
  * @param {BigNumber} acceptedMargin - accepted margin for the given currency (in wei)
  * @param {BigNumber} gasPrice - gas price
  * @param {object} options - for params like returnType, tag.
  *
  * @return {Promise}
  *
  */
  setAcceptedMargin: function (senderAddress, senderPassphrase, currency, acceptedMargin, gasPrice, options) {

    const oThis = this;

    return new Promise(function (onResolve, onReject) {

      const validationResponse = oThis.validateSetAcceptedMarginParams(senderAddress, currency, acceptedMargin, gasPrice);

      if (validationResponse.isFailure()) {
        return onResolve(validationResponse);
      }

      const returnType = basicHelper.getReturnType(options.returnType);

      const transactionObject = currContract.methods.setAcceptedMargin(
        web3RpcProvider.utils.asciiToHex(currency),
        acceptedMargin);

      const notificationData = helper.getNotificationData(
        ['payment.pricer.setAcceptedMargin'],
        'setAcceptedMargin',
        contractName,
        oThis.contractAddress,
        web3RpcProvider,
        oThis.chainId,
        options);

      const successCallback = function(receipt) {
        return oThis.verifyReceiptAndUpdateAcceptedMarginCache(acceptedMargin, currency, receipt);
      };

      const params = {
        transactionObject: transactionObject,
        notificationData: notificationData,
        senderAddress: senderAddress,
        senderPassphrase: senderPassphrase,
        contractAddress: oThis.contractAddress,
        gasPrice: gasPrice,
        gasLimit: gasLimit,
        web3RpcProvider: web3RpcProvider,
        successCallback: successCallback,
        failCallback: null,
        errorCode: "l_ci_p_sam_6"
      };

      return onResolve(helper.performSend(params, returnType));
    });

  },


  /**
  * Verify receipt and update accepted margin in cache
  *
  * @param {BigNumber} acceptedMargin - accepted margin for the given currency (in wei)
  * @param {string} currency - quote currency
  * @param {Object} receipt - transaction receipt
  *
  * @return {Promise}
  *
  */
  verifyReceiptAndUpdateAcceptedMarginCache: function (acceptedMargin, currency, receipt) {
    const oThis = this;
    return new Promise(function (onResolve, onReject) {

      var isReceiptValid = false;
      // decode events
      const decodedEvent = eventDecoder.perform(receipt, oThis.addressToNameMap);
      if (decodedEvent != undefined || decodedEvent != null) {
        // get event data
        const eventData =decodedEvent.formattedTransactionReceipt.eventsData[0];
        if (eventData != undefined || eventData != null) {
          for (var i = 0; i< eventData.events.length; i++) {
            const eventItem = eventData.events[i];
            if (eventItem.name =='_acceptedMargin') {
              isReceiptValid = (eventItem.value == acceptedMargin);
              break;
            }
          }
        }
      }

      if (isReceiptValid) {
        // update cache
        onResolve(oThis.cacheHelper.setAcceptedMarginsToCache(currency, oThis.contractAddress, acceptedMargin));
      } else {
        onResolve(responseHelper.error('l_ci_p_sam_5', 'Invalid event in receipt'));
      }

    });

  },

  /**
  * Pay
  *
  * @param {string} senderAddr - address of sender
  * @param {string} senderPassphrase - passphrase of sender
  * @param {string} beneficiaryAddress - address of beneficiary account
  * @param {BigNumber} transferAmount - transfer amount (in wei)
  * @param {string} commissionBeneficiaryAddress - address of commision beneficiary account
  * @param {BigNumber} commissionAmount - commission amount (in wei)
  * @param {string} currency - quote currency
  * @param {BigNumber} intendedPricePoint - price point at which the pay is intended (in wei)
  * @param {BigNumber} gasPrice - gas price
  * @param {object} options - for params like returnType, tag.
  *
  * @return {Promise}
  *
  */
  pay: async function (
    senderAddress,
    senderPassphrase,
    beneficiaryAddress,
    transferAmount,
    commissionBeneficiaryAddress,
    commissionAmount,
    currency,
    intendedPricePoint,
    gasPrice,
    options) {
    console.log("Pricer.Pay");

    const oThis = this;

    const validationResponse = helper.validatePayParams(senderAddress,
      beneficiaryAddress,
      transferAmount,
      commissionBeneficiaryAddress,
      commissionAmount,
      currency,
      intendedPricePoint,
      gasPrice);

    if (validationResponse.isFailure()) {
      return Promise.resolve(validationResponse);
    }

    // validate if user has the balance
    var totalAmount = 0;
    if (helper.isValidCurrency(currency, true)) {
      totalAmount = oThis.getEstimatedTotalAmount(transferAmount, commissionAmount, intendedPricePoint);
    } else {
      totalAmount = new BigNumber(0)
        .plus(transferAmount)
        .plus(commissionAmount);
    }

    const senderAccountBalanceResponse = await oThis.getBalanceOf(senderAddress);

    if (senderAccountBalanceResponse.isFailure()) {
      return Promise.resolve(responseHelper.error('l_ci_p_p_6', 'error while getting balance'));
    }
    const userInitialBalance = new BigNumber(senderAccountBalanceResponse.data.balance);
    if (userInitialBalance.lt(totalAmount)) {
      return Promise.resolve(responseHelper.error('l_ci_p_p_7', 'insufficient balance'));
    }

    const returnType = basicHelper.getReturnType(options.returnType);

    const transactionObject = currContract.methods.pay(
      beneficiaryAddress,
      transferAmount,
      commissionBeneficiaryAddress,
      commissionAmount,
      web3RpcProvider.utils.asciiToHex(currency),
      intendedPricePoint);

    const notificationData = helper.getNotificationData(
      ['payment.pricer.pay'],
      'pay',
      contractName,
      oThis.contractAddress,
      web3RpcProvider,
      oThis.chainId,
      options);

    const successCallback = function(receipt) {
      return oThis.updateBalanceCacheOnReceipt(totalAmount, senderAddress, beneficiaryAddress,
          commissionBeneficiaryAddress, receipt);
    };

    const failCallback = function(reason) {
      return oThis.rollBackBalanceCache(senderAddress, totalAmount);
    };

    const params = {
      transactionObject: transactionObject,
      notificationData: notificationData,
      senderAddress: senderAddress,
      senderPassphrase: senderPassphrase,
      contractAddress: oThis.contractAddress,
      gasPrice: gasPrice,
      gasLimit: gasLimit,
      web3RpcProvider: web3RpcProvider,
      successCallback: successCallback,
      failCallback: failCallback,
      errorCode: "l_ci_p_p_8"
    };

    return oThis.token.debitBalanceInCache(senderAddress, totalAmount).then(function(senderDebitCacheResponse) {
      if (senderDebitCacheResponse.isSuccess()) {
        return Promise.resolve(helper.performSend(params, returnType));
      } else {
        return Promise.resolve(senderDebitCacheResponse);
      }
    });

  },

  /**
  * Get estimated total amount
  *
  * @param {BigNumber} transferAmount - Transfer amount
  * @param {BigNumber} commissionAmount - Commission amount
  * @param {BigNumber} intendedPricePoint - Intended price point
  *
  * @return {BigNumber}
  *
  */
  getEstimatedTotalAmount: function (transferAmount, commissionAmount, intendedPricePoint) {

    const oThis = this;

    const pricerConversionRate = new BigNumber(oThis.pricerConversionRate);
    const pricerDecimals = new BigNumber(oThis.pricerDecimals);
    const adjConversionRate = pricerConversionRate.mul((new BigNumber(10).pow(pricerDecimals)));
    const estimatedAmount = (transferAmount.mul(adjConversionRate)).div(intendedPricePoint);
    const estimatedCommisionAmount = (commissionAmount.mul(adjConversionRate)).div(intendedPricePoint);
    const totalEstimatedAmount = estimatedAmount.plus(estimatedCommisionAmount);

    return totalEstimatedAmount;
  },

  /**
  * updateBalanceCacheOnReceipt
  *
  * @param {BigNumber} initialDebitAmount - amount that was debited
  * @param {string} senderAddress - address of sender account
  * @param {string} beneficiaryAddress - address of beneficiary account
  * @param {string} commissionBeneficiaryAddress - address of commision beneficiary account
  * @param {Object} transactionReceipt - transaction receipt
  *
  * @return {Promise}
  *
  */
  updateBalanceCacheOnReceipt: function(
    initialDebitAmount,
    senderAddress,
    beneficiaryAddress,
    commissionBeneficiaryAddress,
    transactionReceipt) {

    const oThis = this;
    // decode events
    const decodedEvent = eventDecoder.perform(transactionReceipt, oThis.addressToNameMap);
    var actualTransferAmount = new BigNumber(0);
    var actualCommissionAmount = new BigNumber(0);

    if (decodedEvent != undefined || decodedEvent != null) {
      // get event data
      const events =decodedEvent.formattedTransactionReceipt.eventsData;

      if (events != undefined || events != null) {
        // get whats the actual transfer amounts
        for (var i = 0; i < events.length; i++) {
          const eventData = events[i];

          if (eventData.name === 'Payment') {
            const paymentEvents = eventData.events;
            for (var eventCount = 0; eventCount < paymentEvents.length; eventCount++) {
              const paymentEventsData = paymentEvents[eventCount];
              if (paymentEventsData.name === '_tokenAmount') {
                actualTransferAmount = new BigNumber(paymentEventsData.value);
              } else if (paymentEventsData.name === '_commissionTokenAmount') {
                actualCommissionAmount = new BigNumber(paymentEventsData.value);
              }
            }
          }

        }
      }
    }


    // update cache for beneficiary (credit)
    const creditBeneficiaryBalancePromise = new Promise(function (onResolve, onReject) {
      if (actualTransferAmount > 0) {
        oThis.token.creditBalanceInCache(beneficiaryAddress, actualTransferAmount).then(function(beneficiaryCreditCacheResponse) {              
          onResolve(beneficiaryCreditCacheResponse);
        });
      } else {
        onResolve(responseHelper.successWithData({}));
      }
    });

    // update cache for commission beneficiary (credit)
    const creditCommissionBeneficiaryBalancePromise = new Promise(function (onResolve, onReject) {
      if (actualCommissionAmount > 0) {
        oThis.token.creditBalanceInCache(commissionBeneficiaryAddress, actualCommissionAmount).then(function(commissionBeneficiaryCreditCacheResponse) {              
          Promise.resolve(commissionBeneficiaryCreditCacheResponse);
        });
      } else {
        onResolve(responseHelper.successWithData({}));
      }
    });

    // adjustment cache for spender
    const actualTotalAmount = actualTransferAmount.plus(actualCommissionAmount);

    const adjustmentBalancePromise = new Promise(function (onResolve, onReject) {
      if (actualTotalAmount.gt(initialDebitAmount)) {
        const adjustedAmount = actualTotalAmount.minus(initialDebitAmount);
        oThis.token.debitBalanceInCache(senderAddress, adjustedAmount).then(function(senderAdjustedCreditCacheResponse) {
          onResolve(senderAdjustedCreditCacheResponse);
        });
      } else if (actualTotalAmount.lt(initialDebitAmount)) {
        const adjustedAmount = initialDebitAmount.minus(actualTotalAmount);
        console.log("=======adjustmentBalancePromise - adjustedAmount=======");
        console.log(adjustedAmount);
        oThis.token.creditBalanceInCache(senderAddress, adjustedAmount).then(function(senderAdjustedDebitCacheResponse) {
          onResolve(senderAdjustedDebitCacheResponse);
        });
      } else {
        onResolve(responseHelper.successWithData({}));
      }
    });

    return Promise.all([creditBeneficiaryBalancePromise, creditCommissionBeneficiaryBalancePromise, adjustmentBalancePromise]);

  },

  /**
  * rollBackBalanceCache
  *
  * @param {string} senderAddress - address of sender account
  * @param {BigNumber} totalAmount - amount that needs to be credited
  *
  * @return {Promise}
  *
  */
  rollBackBalanceCache: function(senderAddress, totalAmount) {

    const oThis = this;
    return new Promise(function (onResolve, onReject) {
      oThis.token.creditBalanceInCache(senderAddress, totalAmount).then(function(senderCreditCacheResponse) {
        onResolve(senderCreditCacheResponse);
      });
    });
  },


  /**
  * Get current price point from the price oracle for the give currency
  *
  * @param {string} currency - quote currency
  *
  * @return {Promise}
  *
  */
  getPricePoint: function (currency) {

    if (!helper.isValidCurrency(currency, false)) {
      return Promise.resolve(responseHelper.error('l_ci_p_gpp_1', 'currency is mandatory'));
    }
    const transactionObject = currContract.methods.getPricePoint(web3RpcProvider.utils.asciiToHex(currency));
    const encodedABI = transactionObject.encodeABI();
    const transactionOutputs = helper.getTransactionOutputs(transactionObject);
    return helper.call(
      web3RpcProvider,
      this.contractAddress,
      encodedABI,
      {},
      transactionOutputs)
      .then(function(response) {
        return Promise.resolve(responseHelper.successWithData({pricePoint: response[0]}));
      })
      .catch(function(err) {
        return Promise.resolve(responseHelper.error("err_gpp_01", err));
      });

  },

  /**
  * Get current price point and calculated token amounts
  *
  * @param {BigNumber} transferAmount - transfer amount (in wei)
  * @param {BigNumber} commissionAmount - commision amount (in wei)
  * @param {string} currency - quote currency
  *
  * @return {Promise}
  *
  */
  getPricePointAndCalculatedAmounts: function (
    transferAmount,
    commissionAmount,
    currency) {

    if (!helper.isValidCurrency(currency, false)) {
      return Promise.resolve(responseHelper.error('l_ci_p_gppaca_1', 'currency is mandatory'));
    }

    const transactionObject = currContract.methods.getPricePointAndCalculatedAmounts(transferAmount, commissionAmount, web3RpcProvider.utils.asciiToHex(currency));

    const encodedABI = transactionObject.encodeABI();
    const transactionOutputs = helper.getTransactionOutputs(transactionObject);
    return helper.call(
      web3RpcProvider,
      this.contractAddress,
      encodedABI,
      {},
      transactionOutputs)
      .then(function (response) {
        return Promise.resolve(responseHelper.successWithData(
          {
            pricePoint: response[0],
            tokenAmount: response[1],
            commissionTokenAmount: response[2]
          }));
      });
  },


  /**
  * Convert value in wei
  *
  * @param {BigNumber} value - amount in decimal
  *
  * @return {BigNumer} 10^18
  *
  */
  toWei: function(value) {
    return web3RpcProvider.utils.toWei(value, "ether");
  },


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
  * Get balance of the account
  *
  * @param {string} owner - account address
  *
  * @return {BigNumer} 10^18
  *
  */
  getBalanceOf: function(owner) {
    // Validate addresses
    if (!helper.isAddressValid(owner)) {
      return Promise.resolve(responseHelper.error('l_ci_p_gbo_1', 'address is invalid'));
    }
    const oThis = this;
    return oThis.token.getBalanceOf(owner);
  }


};

