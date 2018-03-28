"use strict";

/**
 *
 * This is a utility file which would be used for executing all methods on Pricer contract.<br><br>
 *
 * @module lib/contract_interact/pricer
 *
 */

const BigNumber = require('bignumber.js')
;

const rootPrefix = '../..'
  , Token = require(rootPrefix + '/lib/contract_interact/branded_token')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , web3EventsDecoder = require(rootPrefix + '/lib/web3/events/decoder')
  , helper = require(rootPrefix + '/lib/contract_interact/helper')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , web3Provider = require(rootPrefix + '/lib/web3/providers/ws')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , TrasactionHelperKlass = require(rootPrefix + '/lib/transaction_helper')
  , PricerCacheKlass = require(rootPrefix + '/lib/cache_management/pricer')
  , eventGlobalConstants = require(rootPrefix+'/lib/global_constant/events')
  , notificationGlobalConstant = require(rootPrefix + '/lib/global_constant/notification')
;

const gasLimit = coreConstants.OST_GAS_LIMIT
  , contractAbi = coreAddresses.getAbiForContract('pricer')
  , currContract = new web3Provider.eth.Contract(contractAbi)
;

/**
 * @constructor
 *
 * @param {string} pricerAddress - Pricer contract address
 * @param {string} chainId - chain ID
 *
 */
const Pricer = function (pricerAddress, chainId) {
  const oThis = this
  ;

  oThis.addressToNameMap = {};
  oThis.contractAddress = pricerAddress;
  oThis.chainId = chainId;
  oThis.contractName = 'pricer';

  oThis.pricerCache = new PricerCacheKlass(chainId, pricerAddress);
  oThis.transactionHelper = new TrasactionHelperKlass(chainId);
};

Pricer.prototype = {
  // Define all the properties
  /**
   * contract address
   * @ignore
   */
  contractAddress: null,

  /**
   * chain id
   * @ignore
   */
  chainId: null,

  /**
   * token object
   * @ignore
   */
  token: null,

  /**
   * address to name map
   * @ignore
   */
  addressToNameMap: null,

  /**
   * transaction helper object
   * @ignore
   */
  transactionHelper: null,

  /**
   * pricer cache object
   * @ignore
   */
  pricerCache: null,

  /**
   * set address to name map
   *
   * @return {promise<result>}
   *
   */
  setAddressToNameMap: async function() {
    const oThis = this
    ;

    if(Object.keys(oThis.addressToNameMap).length === 0) {
      const brandedTokenResponse = await oThis.brandedToken();

      if (brandedTokenResponse.isSuccess()) {
        const tokenAddress = brandedTokenResponse.data.brandedToken;
        oThis.addressToNameMap[tokenAddress.toLowerCase()] = 'brandedToken';

        oThis.addressToNameMap[oThis.contractAddress.toLowerCase()] = oThis.contractName;

        return Promise.resolve(responseHelper.successWithData({addressToNameMap: oThis.addressToNameMap}));
      } else {
        return Promise.resolve(brandedTokenResponse);
      }
    } else {
      return Promise.resolve(responseHelper.successWithData({addressToNameMap: oThis.addressToNameMap}));
    }
  },

  /**
   * set token object
   *
   * @return {promise<result>}
   *
   */
  setTokenObj: async function() {
    const oThis = this
    ;

    if(!oThis.token) {
      const brandedTokenResponse = await oThis.brandedToken();

      if (brandedTokenResponse.isSuccess()) {
        const tokenAddress = brandedTokenResponse.data.brandedToken;
        oThis.token = new Token(tokenAddress, oThis.chainId);
        return Promise.resolve(responseHelper.successWithData({token: oThis.token}));
      } else {
        return Promise.resolve(brandedTokenResponse);
      }
    } else {
      return Promise.resolve(responseHelper.successWithData({token: oThis.token}));
    }
  },

  /**
  * Get branded token address of pricer from cache, if not found in cache get from contract
  *
  * @return {promise<result>}
  *
  */
  brandedToken: async function () {
    const oThis = this
      ;
    try{
      const cacheResult = await oThis.pricerCache.getBrandedTokenAddress();

      if (cacheResult.isSuccess() && cacheResult.data.response != null) {
        return Promise.resolve(responseHelper.successWithData({brandedToken: cacheResult.data.response}));
      } else {
        const getBrandedTokenAddressFromContractResponse = await oThis.getBrandedTokenAddressFromContract();
        if (getBrandedTokenAddressFromContractResponse.isSuccess()) {
          await oThis.pricerCache.setBrandedTokenAddress(getBrandedTokenAddressFromContractResponse.data.brandedToken);
        }
        return Promise.resolve(getBrandedTokenAddressFromContractResponse);
      }
    } catch(err) {
      logger.error("lib/contract_interact/pricer.js:brandedToken inside catch ", err);
      return Promise.resolve(responseHelper.error('l_ci_p_brandedToken_1', 'Something went wrong'));
    }
  },

  /**
  * Get branded token address of pricer from contract
  *
  * @return {promise<result>}
  *
  */
  getBrandedTokenAddressFromContract: async function() {
    const transactionObject = currContract.methods.brandedToken()
      , encodedABI = transactionObject.encodeABI()
      , transactionOutputs = helper.getTransactionOutputs(transactionObject)
      , response = await helper.call(web3Provider, this.contractAddress, encodedABI, {}, transactionOutputs);

    return Promise.resolve(responseHelper.successWithData({brandedToken: response[0]}));
  },

  /**
  * Get acceptable margin for the given currency
  *
  * @param {string} currency - quote currency
  *
  * @return {promise<result>}
  *
  */
  acceptedMargins: async function (currency) {
    const oThis = this;

    try {
      if (!helper.isValidCurrency(currency, false)) {
        return Promise.resolve(responseHelper.error('l_ci_p_acceptedMargins_1', 'currency is mandatory'));
      }

      const cacheResult =  await oThis.pricerCache.getAcceptedMargins(currency);
      if (cacheResult.isSuccess() && cacheResult.data.response != null) {
        return Promise.resolve(responseHelper.successWithData({acceptedMargins: cacheResult.data.response}));
      } else {
        const getAcceptedMarginsFromContractResponse = await oThis.getAcceptedMarginsFromContract(currency);
        if (getAcceptedMarginsFromContractResponse.isSuccess()) {
          await oThis.pricerCache.setAcceptedMargins(currency, getAcceptedMarginsFromContractResponse.data.acceptedMargins);
        }
        return Promise.resolve(getAcceptedMarginsFromContractResponse);
      }
    } catch(err) {
      //Format the error
      logger.error("lib/contract_interact/pricer.js:acceptedMargins inside catch ", err);
      return Promise.resolve(responseHelper.error('l_ci_p_acceptedMargins_2', 'Something went wrong'));
    }

  },

  /**
  * Get acceptable margin for the given currency from contract
  *
  * @param {string} currency - quote currency
  *
  * @return {promise<result>}
  *
  */
  getAcceptedMarginsFromContract: async function (currency) {
    const oThis = this
    ;

    if (!helper.isValidCurrency(currency, false)) {
      return Promise.resolve(responseHelper.error('l_ci_p_getAcceptedMarginsFromContract_1', 'currency is mandatory'));
    }

    const transactionObject = currContract.methods.acceptedMargins(web3Provider.utils.asciiToHex(currency))
      , encodedABI = transactionObject.encodeABI()
      , transactionOutputs = helper.getTransactionOutputs(transactionObject)
      , response = await helper.call(web3Provider, this.contractAddress, encodedABI, {}, transactionOutputs);

    return Promise.resolve(responseHelper.successWithData({acceptedMargins: response[0]}));
  },

  /**
  * Get address of price oracle for the given currency
  *
  * @param {string} currency - quote currency
  *
  * @return {promise<result>}
  *
  */
  priceOracles: async function (currency) {
    const oThis = this
    ;

    try {
      if (!helper.isValidCurrency(currency, false)) {
        return Promise.resolve(responseHelper.error('l_ci_p_priceOracles_1', 'currency is mandatory'));
      }

      const cacheResult = await oThis.pricerCache.getPriceOracles(currency);
      if (cacheResult.isSuccess() && cacheResult.data.response != null) {
        return Promise.resolve(responseHelper.successWithData({priceOracles: cacheResult.data.response}));
      } else {
        const getPriceOraclesFromContractResponse = await oThis.getPriceOraclesFromContract(currency);

        if (getPriceOraclesFromContractResponse.isSuccess()) {
          await oThis.pricerCache.setPriceOracles(currency, getPriceOraclesFromContractResponse.data.priceOracles);
        }

        return Promise.resolve(getPriceOraclesFromContractResponse);
      }
    } catch(err) {
      //Format the error
      logger.error("lib/contract_interact/pricer.js:priceOracles inside catch ", err);
      return Promise.resolve(responseHelper.error('l_ci_p_priceOracles_2', 'Something went wrong'));
    }
  },

  /**
  * Get address of price oracle for the given currency from contract
  *
  * @param {string} currency - quote currency
  *
  * @return {promise<result>}
  *
  */
  getPriceOraclesFromContract: async function (currency) {
    if (!helper.isValidCurrency(currency, false)) {
      return Promise.resolve(responseHelper.error('l_ci_p_getPriceOraclesFromContract_1', 'currency is mandatory'));
    }

    const transactionObject = currContract.methods.priceOracles(web3Provider.utils.asciiToHex(currency))
      , encodedABI = transactionObject.encodeABI()
      , transactionOutputs = helper.getTransactionOutputs(transactionObject)
      , response = await helper.call(web3Provider, this.contractAddress, encodedABI, {}, transactionOutputs);

    return Promise.resolve(responseHelper.successWithData({priceOracles: response[0]}));
  },

  /**
  * Get base currency of pricer
  *
  * @return {promise<result>}
  *
  */
  baseCurrency: async function () {
    const transactionObject = currContract.methods.baseCurrency()
      , encodedABI = transactionObject.encodeABI()
      , transactionOutputs = helper.getTransactionOutputs(transactionObject)
      , response = await helper.call(web3Provider, this.contractAddress, encodedABI, {}, transactionOutputs);

    return Promise.resolve(responseHelper.successWithData(
      {baseCurrency: response[0], symbol: web3Provider.utils.hexToString(response[0])}));
  },

  /**
  * Get decimal of pricer
  *
  * @return {promise<result>}
  *
  */
  decimals: async function () {
    const oThis = this
    ;

    try {
      const cacheResult = await oThis.pricerCache.getDecimals();

      if(cacheResult.isSuccess() && cacheResult.data.response != null) {
        return Promise.resolve(responseHelper.successWithData({decimals: cacheResult.data.response}));
      } else {
        const getDecimalsFromContractResponse = await oThis.getDecimalsFromContract();

        if (getDecimalsFromContractResponse.isSuccess()) {
          await oThis.pricerCache.setDecimals(getDecimalsFromContractResponse.data.decimals);
        }
        return Promise.resolve(getDecimalsFromContractResponse);
      }
    } catch(err) {
      //Format the error
      logger.error("lib/contract_interact/pricer.js:decimals inside catch ", err);
      return Promise.resolve(responseHelper.error('l_ci_p_decimals_1', 'Something went wrong'));
    }
  },

  /**
  * Get decimal of pricer from contract
  *
  * @return {promise<result>}
  *
  */
  getDecimalsFromContract: async function () {
    const transactionObject = currContract.methods.decimals()
      , encodedABI = transactionObject.encodeABI()
      , transactionOutputs = helper.getTransactionOutputs(transactionObject)
      , response = await helper.call(web3Provider, this.contractAddress, encodedABI, {}, transactionOutputs);

    return Promise.resolve(responseHelper.successWithData({decimals: response[0]}));
  },

  /**
  * Get conversion rate of pricer
  *
  * @return {promise<result>}
  *
  */
  conversionRate: async function () {
    const oThis = this
    ;

    try {
      const cacheResult = await oThis.pricerCache.getConversionRate();

      if (cacheResult.isSuccess() && cacheResult.data.response != null) {
        return Promise.resolve(responseHelper.successWithData({conversionRate: cacheResult.data.response}));
      } else {
        const getConversionRateFromContractResponse = await oThis.getConversionRateFromContract();
        if (getConversionRateFromContractResponse.isSuccess()) {
          await oThis.pricerCache.setConversionRate(getConversionRateFromContractResponse.data.conversionRate);
        }

        return Promise.resolve(getConversionRateFromContractResponse);
      }
    } catch(err) {
      //Format the error
      logger.error("lib/contract_interact/pricer.js:conversionRate inside catch ", err);
      return Promise.resolve(responseHelper.error('l_ci_p_conversionRate_1', 'Something went wrong'));
    }
  },

  /**
  * Get conversion rate of pricer from contract
  *
  * @return {promise<result>}
  *
  */
  getConversionRateFromContract: async function () {
    const transactionObject = currContract.methods.conversionRate()
      , encodedABI = transactionObject.encodeABI()
      , transactionOutputs = helper.getTransactionOutputs(transactionObject)
      , response = await helper.call(web3Provider, this.contractAddress, encodedABI, {}, transactionOutputs);

    return Promise.resolve(responseHelper.successWithData({conversionRate: response[0]}));
  },

  /**
  * Get conversion rate decimals of pricer
  *
  * @return {promise<result>}
  *
  */
  conversionRateDecimals: async function () {
    const oThis = this
    ;

    try {
      const cacheResult = await oThis.pricerCache.getConversionRateDecimals();

      if (cacheResult.isSuccess() && cacheResult.data.response != null) {
        return Promise.resolve(responseHelper.successWithData({conversionRateDecimals: cacheResult.data.response}));
      } else {
        const getConversionRateDecimalsFromContractResponse = await oThis.getConversionRateDecimalsFromContract();
        if (getConversionRateDecimalsFromContractResponse.isSuccess()) {
          await oThis.pricerCache.setConversionRateDecimals(
            getConversionRateDecimalsFromContractResponse.data.conversionRateDecimals);
        }

        return Promise.resolve(getConversionRateDecimalsFromContractResponse);
      }
    } catch(err) {
      //Format the error
      logger.error("lib/contract_interact/pricer.js:conversionRateDecimals inside catch ", err);
      return Promise.resolve(responseHelper.error('l_ci_p_conversionRateDecimals_1', 'Something went wrong'));
    }
  },


  /**
  * Get conversion rate decimals of pricer from contract
  *
  * @return {promise<result>}
  *
  */
  getConversionRateDecimalsFromContract: async function () {
    const transactionObject = currContract.methods.conversionRateDecimals()
      , encodedABI = transactionObject.encodeABI()
      , transactionOutputs = helper.getTransactionOutputs(transactionObject)
      , response = await helper.call(web3Provider, this.contractAddress, encodedABI, {}, transactionOutputs);

    return Promise.resolve(responseHelper.successWithData({conversionRateDecimals: response[0]}));
  },

  /**
  * Validate set price oracle parameters
  *
  * @param {string} senderAddress - address of sender
  * @param {string} currency - quote currency
  * @param {string} address - address of price pracle
  * @param {BigNumber} gasPrice - gas price
  *
  * @return {result}
  *
  */
  validateSetPriceOracleParams: function (senderAddress, currency, address, gasPrice) {
    if (!helper.isValidCurrency(currency, false)) {
      return responseHelper.error('l_ci_p_validateSetPriceOracleParams_1', 'currency is mandatory');
    }

    if (!gasPrice) {
      return responseHelper.error('l_ci_p_validateSetPriceOracleParams_2', 'gas is mandatory');
    }

    if (!basicHelper.isAddressValid(address)) {
      return responseHelper.error('l_ci_p_validateSetPriceOracleParams_3', 'address is invalid');
    }

    if (!basicHelper.isAddressValid(senderAddress)) {
      return responseHelper.error('l_ci_p_validateSetPriceOracleParams_4', 'address is invalid');
    }

    return responseHelper.successWithData({});
  },

  /**
  * Set or updates the price oracle address for a given currency
  *
  * @param {string} senderAddress - address of sender
  * @param {string} senderPassphrase - passphrase of sender
  * @param {string} currency - quote currency
  * @param {string} address - address of price pracle
  * @param {BigNumber} gasPrice - gas price
  * @param {object} options - for params like returnType, tag.
  *
  * @return {promise<result>}
  *
  */
  setPriceOracle: function (senderAddress, senderPassphrase, currency, address, gasPrice, options) {
    const oThis = this
    ;

    const validationResponse = oThis.validateSetPriceOracleParams(senderAddress, currency, address, gasPrice);

    if (validationResponse.isFailure()) return Promise.resolve(validationResponse);

    const returnType = basicHelper.getReturnType(options.returnType);

    const transactionObject = currContract.methods.setPriceOracle(
      web3Provider.utils.asciiToHex(currency),
      address);

    const notificationData = helper.getNotificationData(
      ['payments.pricer.setPriceOracle'],
      notificationGlobalConstant.publisher(),
      'setPriceOracle',
      oThis.contractName,
      oThis.contractAddress,
      web3Provider,
      oThis.chainId,
      options);

    const successCallback = function(receipt) {
      return oThis.pricerCache.clearPriceOracles(currency);
    };

    const params = {
      transactionObject: transactionObject,
      notificationData: notificationData,
      senderAddress: senderAddress,
      senderPassphrase: senderPassphrase,
      contractAddress: oThis.contractAddress,
      gasPrice: gasPrice,
      gasLimit: gasLimit,
      web3Provider: web3Provider,
      successCallback: successCallback,
      failCallback: null,
      errorCode: "l_ci_p_spo_5"
    };

    return helper.performSend(params, returnType);
  },


  /**
  * Validate unset price oracle parameters
  *
  * @param {string} senderAddress - address of sender
  * @param {string} currency - quote currency
  * @param {BigNumber} gasPrice - gas price
  *
  * @return {promise<result>}
  *
  */
  validateUnsetPriceOracleParams: function (senderAddress, currency, gasPrice) {
    if (!helper.isValidCurrency(currency, false)) {
      return responseHelper.error('l_ci_p_validateUnsetPriceOracleParams_1', 'currency is mandatory');
    }

    if (!gasPrice) return responseHelper.error('l_ci_p_validateUnsetPriceOracleParams_2', 'gas is mandatory');

    if (!basicHelper.isAddressValid(senderAddress)) {
      return responseHelper.error('l_ci_p_validateUnsetPriceOracleParams_3', 'address is invalid');
    }

    return responseHelper.successWithData({});
  },

  /**
  * Remove the price oracle address for a given currency
  *
  * @param {string} senderAddress - address of sender
  * @param {string} senderPassphrase - passphrase of sender
  * @param {string} currency - quote currency
  * @param {BigNumber} gasPrice - gas price
  * @param {object} options - for params like returnType, tag.
  *
  * @return {promise<result>}
  *
  */
  unsetPriceOracle: function (senderAddress, senderPassphrase, currency, gasPrice, options) {

    const oThis = this
    ;

    const validationResponse = oThis.validateUnsetPriceOracleParams(senderAddress, currency, gasPrice);

    if (validationResponse.isFailure()) return Promise.resolve(validationResponse);

    const returnType = basicHelper.getReturnType(options.returnType)
      , transactionObject = currContract.methods.unsetPriceOracle(web3Provider.utils.asciiToHex(currency));

    const notificationData = helper.getNotificationData(
      ['payments.pricer.unsetPriceOracle'],
      notificationGlobalConstant.publisher(),
      'unsetPriceOracle',
      oThis.contractName,
      oThis.contractAddress,
      web3Provider,
      oThis.chainId,
      options);

    const successCallback = function(receipt) {
      return oThis.pricerCache.clearPriceOracles(currency);
    };

    const params = {
      transactionObject: transactionObject,
      notificationData: notificationData,
      senderAddress: senderAddress,
      senderPassphrase: senderPassphrase,
      contractAddress: oThis.contractAddress,
      gasPrice: gasPrice,
      gasLimit: gasLimit,
      web3Provider: web3Provider,
      successCallback: successCallback,
      failCallback: null,
      errorCode: "l_ci_p_uspo_4"
    };

    return helper.performSend(params, returnType);
  },

  /**
  * Validate set accepted margin params parameters
  *
  * @param {string} senderAddress - address of sender
  * @param {string} currency - quote currency
  * @param {BigNumber} acceptedMargin - accepted margin for the given currency (in wei)
  * @param {BigNumber} gasPrice - gas price
  *
  * @return {result}
  *
  */
  validateSetAcceptedMarginParams: function (senderAddress, currency, acceptedMargin, gasPrice) {
    if (!helper.isValidCurrency(currency, false)) {
      return responseHelper.error('l_ci_p_validateSetAcceptedMarginParams_1', 'currency is mandatory');
    }

    if (!gasPrice) {
      return responseHelper.error('l_ci_p_validateSetAcceptedMarginParams_2', 'gas price is mandatory');
    }

    acceptedMargin = new BigNumber(acceptedMargin);

    if (acceptedMargin.isNaN() || !acceptedMargin.isInteger() || acceptedMargin.lt(0)) {
      return responseHelper.error('l_ci_p_validateSetAcceptedMarginParams_3', 'accepted margin cannot be negative');
    }

    if (!basicHelper.isAddressValid(senderAddress)) {
      return responseHelper.error('l_ci_p_validateSetAcceptedMarginParams_4', 'address is invalid');
    }

    return responseHelper.successWithData({});
  },

  /**
  * Set or update the acceptable margin range for a given currency
  *
  * @param {string} senderAddress - address of sender
  * @param {string} senderPassphrase - passphrase of sender
  * @param {string} currency - quote currency
  * @param {BigNumber} acceptedMargin - accepted margin for the given currency (in wei)
  * @param {BigNumber} gasPrice - gas price
  * @param {object} options - for params like returnType, tag.
  *
  * @return {promise<result>}
  *
  */
  setAcceptedMargin: function (senderAddress, senderPassphrase, currency, acceptedMargin, gasPrice, options) {
    const oThis = this
    ;

    const validationResponse = oThis.validateSetAcceptedMarginParams(senderAddress, currency, acceptedMargin, gasPrice);

    if (validationResponse.isFailure()) return Promise.resolve(validationResponse);

    const returnType = basicHelper.getReturnType(options.returnType);

    const transactionObject = currContract.methods.setAcceptedMargin(
      web3Provider.utils.asciiToHex(currency),
      acceptedMargin);

    const notificationData = helper.getNotificationData(
      ['payments.pricer.setAcceptedMargin'],
      notificationGlobalConstant.publisher(),
      'setAcceptedMargin',
      oThis.contractName,
      oThis.contractAddress,
      web3Provider,
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
      web3Provider: web3Provider,
      successCallback: successCallback,
      failCallback: null,
      errorCode: "l_ci_p_sam_6"
    };

    return helper.performSend(params, returnType);
  },


  /**
  * Verify receipt and update accepted margin in cache
  *
  * @param {BigNumber} acceptedMargin - accepted margin for the given currency (in wei)
  * @param {string} currency - quote currency
  * @param {Object} receipt - transaction receipt
  *
  * @return {promise<result>}
  *
  */
  verifyReceiptAndUpdateAcceptedMarginCache: async function (acceptedMargin, currency, receipt) {
    const oThis = this
    ;

    var isReceiptValid = false;
    // decode events

    const setAddressToNameMapResponse = await oThis.setAddressToNameMap();

    if (setAddressToNameMapResponse.isFailure()) return Promise.resolve(setAddressToNameMapResponse);

    const decodedEvent = web3EventsDecoder.perform(receipt, oThis.addressToNameMap);

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
      return oThis.pricerCache.clearAcceptedMargins(currency);
    } else {
      return Promise.resolve(responseHelper.error('l_ci_p_verifyReceiptAndUpdateAcceptedMarginCache_1',
        'Invalid event in receipt'));
    }
  },

  /**
  * Pay
  *
  * @param {string} senderAddress - address of sender
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
  * @return {promise<result>}
  *
  */
  pay: async function (senderAddress, senderPassphrase, beneficiaryAddress, transferAmount, commissionBeneficiaryAddress,
    commissionAmount, currency, intendedPricePoint, gasPrice, options) {

    const oThis = this
    ;

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
    if (!currency) {
      // If currency not present
      totalAmount = new BigNumber(0)
        .plus(transferAmount)
        .plus(commissionAmount);
    } else {
      // If currency is present
      totalAmount = await oThis.getEstimatedTotalAmount(transferAmount, commissionAmount, intendedPricePoint);
    }

    const senderAccountBalanceResponse = await oThis.getBalanceOf(senderAddress);

    if (senderAccountBalanceResponse.isFailure()) {
      return Promise.resolve(responseHelper.error('l_ci_p_pay_1', 'error while getting balance'));
    }
    const userInitialBalance = new BigNumber(senderAccountBalanceResponse.data.balance);
    if (userInitialBalance.lt(totalAmount)) {
      return Promise.resolve(responseHelper.error('l_ci_p_pay_2', 'insufficient balance'));
    }

    var brandedTokenAddress = null;
    const brandedTokenResponse = await oThis.brandedToken();
    if (brandedTokenResponse.isSuccess()) {
      brandedTokenAddress = brandedTokenResponse.data.brandedToken;
    } else {
      return Promise.resolve(brandedTokenResponse);
    }

    const returnType = basicHelper.getReturnType(options.returnType);

    const transactionObject = currContract.methods.pay(
      beneficiaryAddress,
      transferAmount,
      commissionBeneficiaryAddress,
      commissionAmount,
      web3Provider.utils.asciiToHex(currency),
      intendedPricePoint);

    const notificationData = helper.getNotificationData(
      ['transfer.payments.pricer.pay'],
      notificationGlobalConstant.publisher(),
      'pay',
      oThis.contractName,
      oThis.contractAddress,
      web3Provider,
      oThis.chainId,
      options);
    notificationData.message.payload.erc20_contract_address = brandedTokenAddress;

    const successCallback = async function(receipt) {
      const setAddressToNameMapResponse = await oThis.setAddressToNameMap();
      if (setAddressToNameMapResponse.isFailure()){
        return setAddressToNameMapResponse;
      }
      const actualAmountFromReceipt = oThis.transactionHelper.getActualAmountsFromReceipt(receipt,
        oThis.addressToNameMap, eventGlobalConstants.eventPayment());

      if (actualAmountFromReceipt.isSuccess()) {
        return oThis.transactionHelper.afterPaySuccess(
          brandedTokenAddress,
          senderAddress,
          totalAmount,
          beneficiaryAddress,
          actualAmountFromReceipt.data.actualBeneficiaryAmount,
          commissionBeneficiaryAddress,
          actualAmountFromReceipt.data.actualCommissionAmount);
      } else {
        return oThis.transactionHelper.afterPayFailure(brandedTokenAddress, senderAddress, totalAmount);
      }

    };

    const failCallback = function(reason) {
      return oThis.transactionHelper.afterPayFailure(brandedTokenAddress, senderAddress, totalAmount);
    };

    const params = {
      transactionObject: transactionObject,
      notificationData: notificationData,
      senderAddress: senderAddress,
      senderPassphrase: senderPassphrase,
      contractAddress: oThis.contractAddress,
      gasPrice: gasPrice,
      gasLimit: coreConstants.OST_PAY_GAS_LIMIT,
      web3Provider: web3Provider,
      successCallback: successCallback,
      failCallback: failCallback,
      errorCode: "l_ci_p_p_8"
    };

    const beforePayResponse = await oThis.transactionHelper.beforePay(brandedTokenAddress, senderAddress, totalAmount);

    if(beforePayResponse.isFailure()) return Promise.resolve(beforePayResponse);

    return Promise.resolve(helper.performSend(params, returnType));
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
  getEstimatedTotalAmount: async function (transferAmount, commissionAmount, intendedPricePoint) {

    const oThis = this
      , conversionRateResponse = await oThis.conversionRate()
      , pricerConversionRate = new BigNumber(conversionRateResponse.data.conversionRate)
      , conversionRateDecimalsResponse = await oThis.conversionRateDecimals()
      , pricerConversionRateDecimals = new BigNumber(conversionRateDecimalsResponse.data.conversionRateDecimals)
      , decimalsResponse = await oThis.decimals()
      , pricerDecimals = new BigNumber(decimalsResponse.data.decimals);

    transferAmount = new BigNumber(transferAmount);
    commissionAmount = new BigNumber(commissionAmount);
    intendedPricePoint = new BigNumber(intendedPricePoint);

    const adjConversionRate = ((pricerConversionRate.mul((new BigNumber(10).pow(pricerDecimals)))).div((
      new BigNumber(10).pow(pricerConversionRateDecimals)))).floor();

    const estimatedAmount = ((transferAmount.mul(adjConversionRate)).div(intendedPricePoint)).floor()
      , estimatedCommisionAmount = ((commissionAmount.mul(adjConversionRate)).div(intendedPricePoint)).floor();

    return estimatedAmount.plus(estimatedCommisionAmount);
  },

  /**
  * Get current price point from the price oracle for the give currency
  *
  * @param {string} currency - quote currency
  *
  * @return {promise<result>}
  *
  */
  getPricePoint: async function (currency) {

    const oThis = this
    ;

    try {
      if (!helper.isValidCurrency(currency, false)) {
        return Promise.resolve(responseHelper.error('l_ci_p_getPricePoint_1', 'currency is mandatory'));
      }

      const priceOraclesResponse = await oThis.priceOracles(currency);
      if (priceOraclesResponse.isFailure()) {
        return Promise.resolve(responseHelper.error('l_ci_p_getPricePoint_2', 'Something went wrong'));
      }
      const poAddress = priceOraclesResponse.data.priceOracles;

      const cacheResult = await oThis.pricerCache.getPricePoint(poAddress);
      if (cacheResult.isSuccess() && cacheResult.data.response != null) {
        return Promise.resolve(responseHelper.successWithData({pricePoint: cacheResult.data.response}));
      } else {
        const getPricePointFromContractResponse = await oThis.getPricePointFromContract(currency);
        if (getPricePointFromContractResponse.isSuccess()) {
          await oThis.pricerCache.setPricePoint(poAddress, getPricePointFromContractResponse.data.pricePoint);
        }
        return Promise.resolve(getPricePointFromContractResponse);
      }

    } catch(err) {
      //Format the error
      logger.error("lib/contract_interact/pricer.js:getPricePoint inside catch ", err);
      return Promise.resolve(responseHelper.error('l_ci_p_getPricePoint_3', 'Something went wrong'));
    }
  },

  /**
  * Get current price point from the price oracle for the give currency from contract
  *
  * @param {string} currency - quote currency
  *
  * @return {promise<result>}
  *
  */
  getPricePointFromContract: async function (currency) {
    if (!helper.isValidCurrency(currency, false))
      return Promise.resolve(responseHelper.error('l_ci_p_getPricePointFromContract_1', 'currency is mandatory'));

    const transactionObject = currContract.methods.getPricePoint(web3Provider.utils.asciiToHex(currency))
      , encodedABI = transactionObject.encodeABI()
      , transactionOutputs = helper.getTransactionOutputs(transactionObject);

    try {
      const response = await helper.call(web3Provider, this.contractAddress, encodedABI, {}, transactionOutputs);
      return Promise.resolve(responseHelper.successWithData({pricePoint: response[0]}));
    } catch(err) {
      //Format the error
      logger.error("lib/contract_interact/pricer.js:getPricePointFromContract inside catch ", err);
      return Promise.resolve(responseHelper.error('l_ci_p_getPricePointFromContract_2', 'Something went wrong'));
    }
  },

  /**
  * Get current price point and calculated token amounts
  *
  * @param {BigNumber} transferAmount - transfer amount (in wei)
  * @param {BigNumber} commissionAmount - commision amount (in wei)
  * @param {string} currency - quote currency
  *
  * @return {promise<result>}
  *
  */
  getPricePointAndCalculatedAmounts: async function (transferAmount, commissionAmount, currency) {
    if (!helper.isValidCurrency(currency, false))
      return Promise.resolve(responseHelper.error('l_ci_p_getPricePointAndCalculatedAmounts_1', 'currency is mandatory'));

    const transactionObject = currContract.methods.getPricePointAndCalculatedAmounts(transferAmount, commissionAmount,
      web3Provider.utils.asciiToHex(currency));

    const encodedABI = transactionObject.encodeABI()
      , transactionOutputs = helper.getTransactionOutputs(transactionObject);

    try {
      const response = await helper.call(web3Provider, this.contractAddress, encodedABI, {}, transactionOutputs);
      return Promise.resolve(responseHelper.successWithData({pricePoint: response[0], tokenAmount: response[1],
        commissionTokenAmount: response[2]}));
    } catch(err) {
      //Format the error
      logger.error("lib/contract_interact/pricer.js:getPricePointAndCalculatedAmounts inside catch ", err);
      return Promise.resolve(responseHelper.error('l_ci_p_getPricePointAndCalculatedAmounts_2', 'Something went wrong'));
    }
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
    return web3Provider.utils.toWei(value, "ether");
  },

  /**
  * Get transaction receipt from transaction hash
  *
  * @param {string} transactionHash - transaction hash
  *
  * @return {BigNumer} 10^18
  *
  */
  getTxReceipt: async function(transactionHash) {
    if (!transactionHash) {
      return responseHelper.error('l_ci_p_getTxReceipt_1', 'transaction hash is mandatory');
    }
    const transactionReceipt = await helper.getTxReceipt(web3Provider, transactionHash, {});
    return Promise.resolve(responseHelper.successWithData({transactionReceipt: transactionReceipt}));
  },

  /**
  * Get balance of the account
  *
  * @param {string} owner - account address
  *
  * @return {BigNumer} 10^18
  *
  */
  getBalanceOf: async function(owner) {
    const oThis = this;
    // Validate addresses
    if (!basicHelper.isAddressValid(owner)) {
      return Promise.resolve(responseHelper.error('l_ci_p_getBalanceOf_1', 'address is invalid'));
    }

    const setTokenResponse = await oThis.setTokenObj();
    if (setTokenResponse.isFailure()) {
      return Promise.resolve(setTokenResponse);
    }

    return oThis.token.getBalanceOf(owner);
  }
};

module.exports = Pricer;