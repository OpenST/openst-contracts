'use strict';

/**
 *
 * This is a utility file which would be used for executing all methods on Pricer contract.<br><br>
 *
 * @module lib/contract_interact/pricer
 *
 */

const BigNumber = require('bignumber.js');

const rootPrefix = '../..',
  InstanceComposer = require(rootPrefix + '/instance_composer'),
  basicHelper = require(rootPrefix + '/helpers/basic_helper'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/helpers/custom_console_logger'),
  eventGlobalConstants = require(rootPrefix + '/lib/global_constant/events'),
  notificationGlobalConstant = require(rootPrefix + '/lib/global_constant/notification'),
  gasLimitGlobalConstant = require(rootPrefix + '/lib/global_constant/gas_limit'),
  paramErrorConfig = require(rootPrefix + '/config/param_error_config'),
  apiErrorConfig = require(rootPrefix + '/config/api_error_config');

require(rootPrefix + '/lib/contract_interact/branded_token');
require(rootPrefix + '/config/core_addresses');
require(rootPrefix + '/lib/web3/events/decoder');
require(rootPrefix + '/lib/contract_interact/helper');
require(rootPrefix + '/lib/providers/web3_factory');
require(rootPrefix + '/lib/transaction_helper');
require(rootPrefix + '/lib/cache_management/pricer');

const errorConfig = {
  param_error_config: paramErrorConfig,
  api_error_config: apiErrorConfig
};

/**
 * @constructor
 *
 * @param {string} pricerAddress - Pricer contract address
 * @param {string} chainId - chain ID
 *
 */
const Pricer = function(pricerAddress, chainId) {
  const oThis = this,
    TransactionHelperKlass = oThis.ic().getTransactionHelperClass(),
    PricerCacheKlass = oThis.ic().getCacheManagementPricerClass();

  oThis.addressToNameMap = {};
  oThis.contractAddress = pricerAddress;
  oThis.chainId = chainId;
  oThis.contractName = 'pricer';

  oThis.pricerCache = new PricerCacheKlass(chainId, pricerAddress);
  oThis.transactionHelper = new TransactionHelperKlass(chainId);
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
    const oThis = this;

    if (Object.keys(oThis.addressToNameMap).length === 0) {
      const brandedTokenResponse = await oThis.brandedToken();

      if (brandedTokenResponse.isSuccess()) {
        const tokenAddress = brandedTokenResponse.data.brandedToken;
        oThis.addressToNameMap[tokenAddress.toLowerCase()] = 'brandedToken';

        oThis.addressToNameMap[oThis.contractAddress.toLowerCase()] = oThis.contractName;

        return Promise.resolve(responseHelper.successWithData({ addressToNameMap: oThis.addressToNameMap }));
      } else {
        return Promise.resolve(brandedTokenResponse);
      }
    } else {
      return Promise.resolve(responseHelper.successWithData({ addressToNameMap: oThis.addressToNameMap }));
    }
  },

  /**
   * set token object
   *
   * @return {promise<result>}
   *
   */
  setTokenObj: async function() {
    const oThis = this,
      Token = oThis.ic().getBrandedTokenInteractClass();

    if (!oThis.token) {
      const brandedTokenResponse = await oThis.brandedToken();

      if (brandedTokenResponse.isSuccess()) {
        const tokenAddress = brandedTokenResponse.data.brandedToken;
        oThis.token = new Token(tokenAddress, oThis.chainId);
        return Promise.resolve(responseHelper.successWithData({ token: oThis.token }));
      } else {
        return Promise.resolve(brandedTokenResponse);
      }
    } else {
      return Promise.resolve(responseHelper.successWithData({ token: oThis.token }));
    }
  },

  /**
   * Get branded token address of pricer from cache, if not found in cache get from contract
   *
   * @return {promise<result>}
   *
   */
  brandedToken: async function() {
    const oThis = this;
    try {
      const cacheResult = await oThis.pricerCache.getBrandedTokenAddress();

      if (cacheResult.isSuccess() && cacheResult.data.response != null) {
        return Promise.resolve(responseHelper.successWithData({ brandedToken: cacheResult.data.response }));
      } else {
        const getBrandedTokenAddressFromContractResponse = await oThis.getBrandedTokenAddressFromContract();
        if (getBrandedTokenAddressFromContractResponse.isSuccess()) {
          await oThis.pricerCache.setBrandedTokenAddress(getBrandedTokenAddressFromContractResponse.data.brandedToken);
        }
        return Promise.resolve(getBrandedTokenAddressFromContractResponse);
      }
    } catch (err) {
      let errorParams = {
        internal_error_identifier: 'l_ci_p_brandedToken_1',
        api_error_identifier: 'unhandled_api_error',
        error_config: errorConfig,
        debug_options: {}
      };
      logger.error('lib/contract_interact/pricer.js:brandedToken inside catch ', err);
      return Promise.resolve(responseHelper.error(errorParams));
    }
  },

  /**
   * Get branded token address of pricer from contract
   *
   * @return {promise<result>}
   *
   */
  getBrandedTokenAddressFromContract: async function() {
    const oThis = this,
      coreAddresses = oThis.ic().getCoreAddresses(),
      helper = oThis.ic().getContractInteractHelper(),
      web3ProviderFactory = oThis.ic().getWeb3ProviderFactory(),
      web3Provider = web3ProviderFactory.getProvider(web3ProviderFactory.typeWS),
      contractAbi = coreAddresses.getAbiForContract('pricer'),
      currContract = new web3Provider.eth.Contract(contractAbi);

    const transactionObject = currContract.methods.brandedToken(),
      encodedABI = transactionObject.encodeABI(),
      transactionOutputs = helper.getTransactionOutputs(transactionObject),
      response = await helper.call(web3Provider, this.contractAddress, encodedABI, {}, transactionOutputs);

    return Promise.resolve(responseHelper.successWithData({ brandedToken: response[0] }));
  },

  /**
   * Get acceptable margin for the given currency
   *
   * @param {string} currency - quote currency
   *
   * @return {promise<result>}
   *
   */
  acceptedMargins: async function(currency) {
    const oThis = this,
      helper = oThis.ic().getContractInteractHelper();

    try {
      if (!helper.isValidCurrency(currency, false)) {
        let errorParams = {
          internal_error_identifier: 'l_ci_p_acceptedMargins_1',
          api_error_identifier: 'invalid_api_params',
          error_config: errorConfig,
          params_error_identifiers: ['invalid_currency'],
          debug_options: {}
        };
        return Promise.resolve(responseHelper.paramValidationError(errorParams));
      }

      const cacheResult = await oThis.pricerCache.getAcceptedMargins(currency);
      if (cacheResult.isSuccess() && cacheResult.data.response != null) {
        return Promise.resolve(responseHelper.successWithData({ acceptedMargins: cacheResult.data.response }));
      } else {
        const getAcceptedMarginsFromContractResponse = await oThis.getAcceptedMarginsFromContract(currency);
        if (getAcceptedMarginsFromContractResponse.isSuccess()) {
          await oThis.pricerCache.setAcceptedMargins(
            currency,
            getAcceptedMarginsFromContractResponse.data.acceptedMargins
          );
        }
        return Promise.resolve(getAcceptedMarginsFromContractResponse);
      }
    } catch (err) {
      let errorParams = {
        internal_error_identifier: 'l_ci_p_acceptedMargins_2',
        api_error_identifier: 'unhandled_api_error',
        error_config: errorConfig,
        debug_options: {}
      };
      //Format the error
      logger.error('lib/contract_interact/pricer.js:acceptedMargins inside catch ', err);
      return Promise.resolve(responseHelper.error(errorParams));
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
  getAcceptedMarginsFromContract: async function(currency) {
    const oThis = this,
      coreAddresses = oThis.ic().getCoreAddresses(),
      helper = oThis.ic().getContractInteractHelper(),
      web3ProviderFactory = oThis.ic().getWeb3ProviderFactory(),
      web3Provider = web3ProviderFactory.getProvider(web3ProviderFactory.typeWS),
      contractAbi = coreAddresses.getAbiForContract('pricer'),
      currContract = new web3Provider.eth.Contract(contractAbi);

    if (!helper.isValidCurrency(currency, false)) {
      let errorParams = {
        internal_error_identifier: 'l_ci_p_getAcceptedMarginsFromContract_1',
        api_error_identifier: 'invalid_api_params',
        error_config: errorConfig,
        params_error_identifiers: ['invalid_currency'],
        debug_options: {}
      };
      return Promise.resolve(responseHelper.paramValidationError(errorParams));
    }

    const transactionObject = currContract.methods.acceptedMargins(web3Provider.utils.asciiToHex(currency)),
      encodedABI = transactionObject.encodeABI(),
      transactionOutputs = helper.getTransactionOutputs(transactionObject),
      response = await helper.call(web3Provider, this.contractAddress, encodedABI, {}, transactionOutputs);

    return Promise.resolve(responseHelper.successWithData({ acceptedMargins: response[0] }));
  },

  /**
   * Get address of price oracle for the given currency
   *
   * @param {string} currency - quote currency
   *
   * @return {promise<result>}
   *
   */
  priceOracles: async function(currency) {
    const oThis = this,
      helper = oThis.ic().getContractInteractHelper();

    try {
      if (!helper.isValidCurrency(currency, false)) {
        let errorParams = {
          internal_error_identifier: 'l_ci_p_priceOracles_1',
          api_error_identifier: 'invalid_api_params',
          error_config: errorConfig,
          params_error_identifiers: ['invalid_currency'],
          debug_options: {}
        };
        return Promise.resolve(responseHelper.paramValidationError(errorParams));
      }

      const cacheResult = await oThis.pricerCache.getPriceOracles(currency);
      if (cacheResult.isSuccess() && cacheResult.data.response != null) {
        return Promise.resolve(responseHelper.successWithData({ priceOracles: cacheResult.data.response }));
      } else {
        const getPriceOraclesFromContractResponse = await oThis.getPriceOraclesFromContract(currency);

        if (getPriceOraclesFromContractResponse.isSuccess()) {
          await oThis.pricerCache.setPriceOracles(currency, getPriceOraclesFromContractResponse.data.priceOracles);
        }

        return Promise.resolve(getPriceOraclesFromContractResponse);
      }
    } catch (err) {
      let errorParams = {
        internal_error_identifier: 'l_ci_p_priceOracles_2',
        api_error_identifier: 'unhandled_api_error',
        error_config: errorConfig,
        debug_options: {}
      };
      //Format the error
      logger.error('lib/contract_interact/pricer.js:priceOracles inside catch ', err);
      return Promise.resolve(responseHelper.error(errorParams));
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
  getPriceOraclesFromContract: async function(currency) {
    const oThis = this,
      coreAddresses = oThis.ic().getCoreAddresses(),
      helper = oThis.ic().getContractInteractHelper(),
      web3ProviderFactory = oThis.ic().getWeb3ProviderFactory(),
      web3Provider = web3ProviderFactory.getProvider(web3ProviderFactory.typeWS),
      contractAbi = coreAddresses.getAbiForContract('pricer'),
      currContract = new web3Provider.eth.Contract(contractAbi);

    if (!helper.isValidCurrency(currency, false)) {
      let errorParams = {
        internal_error_identifier: 'l_ci_p_getPriceOraclesFromContract_1',
        api_error_identifier: 'invalid_api_params',
        error_config: errorConfig,
        params_error_identifiers: ['invalid_currency'],
        debug_options: {}
      };
      return Promise.resolve(responseHelper.error(errorParams));
    }

    const transactionObject = currContract.methods.priceOracles(web3Provider.utils.asciiToHex(currency)),
      encodedABI = transactionObject.encodeABI(),
      transactionOutputs = helper.getTransactionOutputs(transactionObject),
      response = await helper.call(web3Provider, this.contractAddress, encodedABI, {}, transactionOutputs);

    return Promise.resolve(responseHelper.successWithData({ priceOracles: response[0] }));
  },

  /**
   * Get base currency of pricer
   *
   * @return {promise<result>}
   *
   */
  baseCurrency: async function() {
    const oThis = this,
      coreAddresses = oThis.ic().getCoreAddresses(),
      helper = oThis.ic().getContractInteractHelper(),
      web3ProviderFactory = oThis.ic().getWeb3ProviderFactory(),
      web3Provider = web3ProviderFactory.getProvider(web3ProviderFactory.typeWS),
      contractAbi = coreAddresses.getAbiForContract('pricer'),
      currContract = new web3Provider.eth.Contract(contractAbi);

    const transactionObject = currContract.methods.baseCurrency(),
      encodedABI = transactionObject.encodeABI(),
      transactionOutputs = helper.getTransactionOutputs(transactionObject),
      response = await helper.call(web3Provider, this.contractAddress, encodedABI, {}, transactionOutputs);

    return Promise.resolve(
      responseHelper.successWithData({ baseCurrency: response[0], symbol: web3Provider.utils.hexToString(response[0]) })
    );
  },

  /**
   * Get decimal of pricer
   *
   * @return {promise<result>}
   *
   */
  decimals: async function() {
    const oThis = this;

    try {
      const cacheResult = await oThis.pricerCache.getDecimals();

      if (cacheResult.isSuccess() && cacheResult.data.response != null) {
        return Promise.resolve(responseHelper.successWithData({ decimals: cacheResult.data.response }));
      } else {
        const getDecimalsFromContractResponse = await oThis.getDecimalsFromContract();

        if (getDecimalsFromContractResponse.isSuccess()) {
          await oThis.pricerCache.setDecimals(getDecimalsFromContractResponse.data.decimals);
        }
        return Promise.resolve(getDecimalsFromContractResponse);
      }
    } catch (err) {
      let errorParams = {
        internal_error_identifier: 'l_ci_p_decimals_1',
        api_error_identifier: 'unhandled_api_error',
        error_config: errorConfig,
        debug_options: {}
      };
      //Format the error
      logger.error('lib/contract_interact/pricer.js:decimals inside catch ', err);
      return Promise.resolve(responseHelper.error(errorParams));
    }
  },

  /**
   * Get decimal of pricer from contract
   *
   * @return {promise<result>}
   *
   */
  getDecimalsFromContract: async function() {
    const oThis = this,
      coreAddresses = oThis.ic().getCoreAddresses(),
      helper = oThis.ic().getContractInteractHelper(),
      web3ProviderFactory = oThis.ic().getWeb3ProviderFactory(),
      web3Provider = web3ProviderFactory.getProvider(web3ProviderFactory.typeWS),
      contractAbi = coreAddresses.getAbiForContract('pricer'),
      currContract = new web3Provider.eth.Contract(contractAbi);

    const transactionObject = currContract.methods.decimals(),
      encodedABI = transactionObject.encodeABI(),
      transactionOutputs = helper.getTransactionOutputs(transactionObject),
      response = await helper.call(web3Provider, this.contractAddress, encodedABI, {}, transactionOutputs);

    return Promise.resolve(responseHelper.successWithData({ decimals: response[0] }));
  },

  /**
   * Get conversion rate of pricer
   *
   * @return {promise<result>}
   *
   */
  conversionRate: async function() {
    const oThis = this;

    try {
      const cacheResult = await oThis.pricerCache.getConversionRate();

      if (cacheResult.isSuccess() && cacheResult.data.response != null) {
        return Promise.resolve(responseHelper.successWithData({ conversionRate: cacheResult.data.response }));
      } else {
        const getConversionRateFromContractResponse = await oThis.getConversionRateFromContract();
        if (getConversionRateFromContractResponse.isSuccess()) {
          await oThis.pricerCache.setConversionRate(getConversionRateFromContractResponse.data.conversionRate);
        }

        return Promise.resolve(getConversionRateFromContractResponse);
      }
    } catch (err) {
      let errorParams = {
        internal_error_identifier: 'l_ci_p_conversionRate_1',
        api_error_identifier: 'unhandled_api_error',
        error_config: errorConfig,
        debug_options: {}
      };
      //Format the error
      logger.error('lib/contract_interact/pricer.js:conversionRate inside catch ', err);
      return Promise.resolve(responseHelper.error(errorParams));
    }
  },

  /**
   * Get conversion rate of pricer from contract
   *
   * @return {promise<result>}
   *
   */
  getConversionRateFromContract: async function() {
    const oThis = this,
      coreAddresses = oThis.ic().getCoreAddresses(),
      helper = oThis.ic().getContractInteractHelper(),
      web3ProviderFactory = oThis.ic().getWeb3ProviderFactory(),
      web3Provider = web3ProviderFactory.getProvider(web3ProviderFactory.typeWS),
      contractAbi = coreAddresses.getAbiForContract('pricer'),
      currContract = new web3Provider.eth.Contract(contractAbi);

    const transactionObject = currContract.methods.conversionRate(),
      encodedABI = transactionObject.encodeABI(),
      transactionOutputs = helper.getTransactionOutputs(transactionObject),
      response = await helper.call(web3Provider, this.contractAddress, encodedABI, {}, transactionOutputs);

    return Promise.resolve(responseHelper.successWithData({ conversionRate: response[0] }));
  },

  /**
   * Get conversion rate decimals of pricer
   *
   * @return {promise<result>}
   *
   */
  conversionRateDecimals: async function() {
    const oThis = this;

    try {
      const cacheResult = await oThis.pricerCache.getConversionRateDecimals();

      if (cacheResult.isSuccess() && cacheResult.data.response != null) {
        return Promise.resolve(responseHelper.successWithData({ conversionRateDecimals: cacheResult.data.response }));
      } else {
        const getConversionRateDecimalsFromContractResponse = await oThis.getConversionRateDecimalsFromContract();
        if (getConversionRateDecimalsFromContractResponse.isSuccess()) {
          await oThis.pricerCache.setConversionRateDecimals(
            getConversionRateDecimalsFromContractResponse.data.conversionRateDecimals
          );
        }

        return Promise.resolve(getConversionRateDecimalsFromContractResponse);
      }
    } catch (err) {
      let errorParams = {
        internal_error_identifier: 'l_ci_p_conversionRateDecimals_1',
        api_error_identifier: 'unhandled_api_error',
        error_config: errorConfig,
        debug_options: {}
      };
      //Format the error
      logger.error('lib/contract_interact/pricer.js:conversionRateDecimals inside catch ', err);
      return Promise.resolve(responseHelper.error(errorParams));
    }
  },

  /**
   * Get conversion rate decimals of pricer from contract
   *
   * @return {promise<result>}
   *
   */
  getConversionRateDecimalsFromContract: async function() {
    const oThis = this,
      coreAddresses = oThis.ic().getCoreAddresses(),
      helper = oThis.ic().getContractInteractHelper(),
      web3ProviderFactory = oThis.ic().getWeb3ProviderFactory(),
      web3Provider = web3ProviderFactory.getProvider(web3ProviderFactory.typeWS),
      contractAbi = coreAddresses.getAbiForContract('pricer'),
      currContract = new web3Provider.eth.Contract(contractAbi);

    const transactionObject = currContract.methods.conversionRateDecimals(),
      encodedABI = transactionObject.encodeABI(),
      transactionOutputs = helper.getTransactionOutputs(transactionObject),
      response = await helper.call(web3Provider, this.contractAddress, encodedABI, {}, transactionOutputs);

    return Promise.resolve(responseHelper.successWithData({ conversionRateDecimals: response[0] }));
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
  validateSetPriceOracleParams: function(senderAddress, currency, address, gasPrice) {
    const oThis = this,
      helper = oThis.ic().getContractInteractHelper();

    if (!helper.isValidCurrency(currency, false)) {
      let errorParams = {
        internal_error_identifier: 'l_ci_p_validateSetPriceOracleParams_1',
        api_error_identifier: 'invalid_api_params',
        error_config: errorConfig,
        params_error_identifiers: ['invalid_currency'],
        debug_options: {}
      };
      return responseHelper.error(errorParams);
    }

    if (!gasPrice) {
      let errorParams = {
        internal_error_identifier: 'l_ci_p_validateSetPriceOracleParams_2',
        api_error_identifier: 'invalid_api_params',
        error_config: errorConfig,
        params_error_identifiers: ['gas_price_invalid'],
        debug_options: {}
      };
      return responseHelper.paramValidationError(errorParams);
    }

    if (!basicHelper.isAddressValid(address)) {
      let errorParams = {
        internal_error_identifier: 'l_ci_p_validateSetPriceOracleParams_3',
        api_error_identifier: 'contract_address_invalid',
        error_config: errorConfig,
        debug_options: {}
      };
      return responseHelper.error(errorParams);
    }

    if (!basicHelper.isAddressValid(senderAddress)) {
      let errorParams = {
        internal_error_identifier: 'l_ci_p_validateSetPriceOracleParams_4',
        api_error_identifier: 'invalid_api_params',
        error_config: errorConfig,
        params_error_identifiers: ['invalid_sender_address'],
        debug_options: {}
      };
      return responseHelper.paramValidationError(errorParams);
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
  setPriceOracle: function(senderAddress, senderPassphrase, currency, address, gasPrice, options) {
    const oThis = this,
      coreAddresses = oThis.ic().getCoreAddresses(),
      web3ProviderFactory = oThis.ic().getWeb3ProviderFactory(),
      helper = oThis.ic().getContractInteractHelper(),
      web3Provider = web3ProviderFactory.getProvider(web3ProviderFactory.typeWS),
      contractAbi = coreAddresses.getAbiForContract('pricer'),
      currContract = new web3Provider.eth.Contract(contractAbi);

    const validationResponse = oThis.validateSetPriceOracleParams(senderAddress, currency, address, gasPrice);

    if (validationResponse.isFailure()) return Promise.resolve(validationResponse);

    const returnType = basicHelper.getReturnType(options.returnType);

    const transactionObject = currContract.methods.setPriceOracle(web3Provider.utils.asciiToHex(currency), address);

    const notificationData = helper.getNotificationData(
      ['payments.pricer.setPriceOracle'],
      notificationGlobalConstant.publisher(),
      'setPriceOracle',
      oThis.contractName,
      oThis.contractAddress,
      web3Provider,
      oThis.chainId,
      options
    );

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
      gasLimit: gasLimitGlobalConstant.setPriceOracle(),
      web3Provider: web3Provider,
      successCallback: successCallback,
      failCallback: null,
      errorCode: 'l_ci_p_spo_5'
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
  validateUnsetPriceOracleParams: function(senderAddress, currency, gasPrice) {
    const oThis = this,
      helper = oThis.ic().getContractInteractHelper();

    if (!helper.isValidCurrency(currency, false)) {
      let errorParams = {
        internal_error_identifier: 'l_ci_p_validateUnsetPriceOracleParams_1',
        api_error_identifier: 'invalid_api_params',
        error_config: errorConfig,
        params_error_identifiers: ['invalid_currency'],
        debug_options: {}
      };
      return responseHelper.paramValidationError(errorParams);
    }

    if (!gasPrice) {
      let errorParams = {
        internal_error_identifier: 'l_ci_p_validateUnsetPriceOracleParams_2',
        api_error_identifier: 'invalid_api_params',
        error_config: errorConfig,
        params_error_identifiers: ['gas_price_invalid'],
        debug_options: {}
      };
      return responseHelper.paramValidationError(errorParams);
    }

    if (!basicHelper.isAddressValid(senderAddress)) {
      let errorParams = {
        internal_error_identifier: 'l_ci_p_validateUnsetPriceOracleParams_3',
        api_error_identifier: 'invalid_api_params',
        error_config: errorConfig,
        params_error_identifiers: ['invalid_sender_address'],
        debug_options: {}
      };
      return responseHelper.error(errorParams);
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
  unsetPriceOracle: function(senderAddress, senderPassphrase, currency, gasPrice, options) {
    const oThis = this,
      coreAddresses = oThis.ic().getCoreAddresses(),
      web3ProviderFactory = oThis.ic().getWeb3ProviderFactory(),
      helper = oThis.ic().getContractInteractHelper(),
      web3Provider = web3ProviderFactory.getProvider(web3ProviderFactory.typeWS),
      contractAbi = coreAddresses.getAbiForContract('pricer'),
      currContract = new web3Provider.eth.Contract(contractAbi);

    const validationResponse = oThis.validateUnsetPriceOracleParams(senderAddress, currency, gasPrice);

    if (validationResponse.isFailure()) return Promise.resolve(validationResponse);

    const returnType = basicHelper.getReturnType(options.returnType),
      transactionObject = currContract.methods.unsetPriceOracle(web3Provider.utils.asciiToHex(currency));

    const notificationData = helper.getNotificationData(
      ['payments.pricer.unsetPriceOracle'],
      notificationGlobalConstant.publisher(),
      'unsetPriceOracle',
      oThis.contractName,
      oThis.contractAddress,
      web3Provider,
      oThis.chainId,
      options
    );

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
      gasLimit: gasLimitGlobalConstant.default(),
      web3Provider: web3Provider,
      successCallback: successCallback,
      failCallback: null,
      errorCode: 'l_ci_p_uspo_4'
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
  validateSetAcceptedMarginParams: function(senderAddress, currency, acceptedMargin, gasPrice) {
    const oThis = this,
      helper = oThis.ic().getContractInteractHelper();

    if (!helper.isValidCurrency(currency, false)) {
      let errorParams = {
        internal_error_identifier: 'l_ci_p_validateSetAcceptedMarginParams_1',
        api_error_identifier: 'invalid_api_params',
        error_config: errorConfig,
        params_error_identifiers: ['invalid_currency'],
        debug_options: {}
      };
      return responseHelper.paramValidationError(errorParams);
    }

    if (!gasPrice) {
      let errorParams = {
        internal_error_identifier: 'l_ci_p_validateSetAcceptedMarginParams_2',
        api_error_identifier: 'invalid_api_params',
        error_config: errorConfig,
        params_error_identifiers: ['gas_price_invalid'],
        debug_options: {}
      };
      return responseHelper.paramValidationError(errorParams);
    }

    const bigNumberAcceptedMargin = new BigNumber(acceptedMargin);

    if (bigNumberAcceptedMargin.isNaN() || !bigNumberAcceptedMargin.isInteger() || bigNumberAcceptedMargin.lt(0)) {
      let errorParams = {
        internal_error_identifier: 'l_ci_p_validateSetAcceptedMarginParams_3',
        api_error_identifier: 'invalid_api_params',
        error_config: errorConfig,
        params_error_identifiers: ['accepted_margin_invalid'],
        debug_options: {}
      };
      return responseHelper.paramValidationError(errorParams);
    }

    if (!basicHelper.isAddressValid(senderAddress)) {
      let errorParams = {
        internal_error_identifier: 'l_ci_p_validateSetAcceptedMarginParams_4',
        api_error_identifier: 'invalid_api_params',
        error_config: errorConfig,
        params_error_identifiers: ['invalid_sender_address'],
        debug_options: {}
      };
      return responseHelper.paramValidationError(errorParams);
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
  setAcceptedMargin: function(senderAddress, senderPassphrase, currency, acceptedMargin, gasPrice, options) {
    const oThis = this,
      coreAddresses = oThis.ic().getCoreAddresses(),
      web3ProviderFactory = oThis.ic().getWeb3ProviderFactory(),
      helper = oThis.ic().getContractInteractHelper(),
      web3Provider = web3ProviderFactory.getProvider(web3ProviderFactory.typeWS),
      contractAbi = coreAddresses.getAbiForContract('pricer'),
      currContract = new web3Provider.eth.Contract(contractAbi);

    const validationResponse = oThis.validateSetAcceptedMarginParams(senderAddress, currency, acceptedMargin, gasPrice);

    if (validationResponse.isFailure()) return Promise.resolve(validationResponse);

    const returnType = basicHelper.getReturnType(options.returnType);

    const transactionObject = currContract.methods.setAcceptedMargin(
      web3Provider.utils.asciiToHex(currency),
      acceptedMargin
    );

    const notificationData = helper.getNotificationData(
      ['payments.pricer.setAcceptedMargin'],
      notificationGlobalConstant.publisher(),
      'setAcceptedMargin',
      oThis.contractName,
      oThis.contractAddress,
      web3Provider,
      oThis.chainId,
      options
    );

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
      gasLimit: gasLimitGlobalConstant.setAcceptedMargin(),
      web3Provider: web3Provider,
      successCallback: successCallback,
      failCallback: null,
      errorCode: 'l_ci_p_sam_6'
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
  verifyReceiptAndUpdateAcceptedMarginCache: async function(acceptedMargin, currency, receipt) {
    const oThis = this,
      web3EventsDecoder = oThis.ic().getWeb3EventsDecoder();

    var isReceiptValid = false;
    // decode events

    const setAddressToNameMapResponse = await oThis.setAddressToNameMap();

    if (setAddressToNameMapResponse.isFailure()) return Promise.resolve(setAddressToNameMapResponse);

    const decodedEvent = web3EventsDecoder.perform(receipt, oThis.addressToNameMap);

    if (decodedEvent != undefined || decodedEvent != null) {
      // get event data
      const eventData = decodedEvent.formattedTransactionReceipt.eventsData[0];
      if (eventData != undefined || eventData != null) {
        for (var i = 0; i < eventData.events.length; i++) {
          const eventItem = eventData.events[i];
          if (eventItem.name == '_acceptedMargin') {
            isReceiptValid = eventItem.value == acceptedMargin;
            break;
          }
        }
      }
    }

    if (isReceiptValid) {
      // update cache
      return oThis.pricerCache.clearAcceptedMargins(currency);
    } else {
      let errorParams = {
        internal_error_identifier: 'l_ci_p_verifyReceiptAndUpdateAcceptedMarginCache_1',
        api_error_identifier: 'invalid_receipt',
        error_config: errorConfig,
        debug_options: {}
      };
      return Promise.resolve(responseHelper.error(errorParams));
    }
  },

  /**
   * Pay
   *
   * @param {string} spenderAddress - address of sender
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
  pay: function(
    spenderAddress,
    senderPassphrase,
    beneficiaryAddress,
    transferAmount,
    commissionBeneficiaryAddress,
    commissionAmount,
    currency,
    intendedPricePoint,
    gasPrice,
    options
  ) {
    const oThis = this;

    return oThis
      ._asyncPay(
        spenderAddress,
        senderPassphrase,
        beneficiaryAddress,
        transferAmount,
        commissionBeneficiaryAddress,
        commissionAmount,
        currency,
        intendedPricePoint,
        gasPrice,
        options
      )
      .catch(function(error) {
        if (responseHelper.isCustomResult(error)) {
          return error;
        } else {
          logger.error(`${__filename}::pay::catch`);
          logger.error(error);
          return responseHelper.error({
            internal_error_identifier: 'l_ci_p_pay_1',
            api_error_identifier: 'unhandled_api_error',
            error_config: errorConfig,
            debug_options: {}
          });
        }
      });
  },

  /**
   * Actual Pay - can give rejections of promise
   *
   * @param {string} spenderAddress - address of sender
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
  _asyncPay: async function(
    spenderAddress,
    senderPassphrase,
    beneficiaryAddress,
    transferAmount,
    commissionBeneficiaryAddress,
    commissionAmount,
    currency,
    intendedPricePoint,
    gasPrice,
    options
  ) {
    const oThis = this,
      web3ProviderFactory = oThis.ic().getWeb3ProviderFactory(),
      helper = oThis.ic().getContractInteractHelper(),
      web3Provider = web3ProviderFactory.getProvider(web3ProviderFactory.typeWS);

    await helper.validatePayParams(
      spenderAddress,
      beneficiaryAddress,
      transferAmount,
      commissionBeneficiaryAddress,
      commissionAmount,
      currency,
      intendedPricePoint,
      gasPrice
    );

    // validate if user has the balance
    var totalTransferAmount = 0;
    if (!currency) {
      // If currency not present
      totalTransferAmount = new BigNumber(0).plus(transferAmount).plus(commissionAmount);
    } else {
      // If currency is present
      totalTransferAmount = await oThis.getEstimatedTotalAmount(transferAmount, commissionAmount, intendedPricePoint);
    }

    const senderAccountBalanceResponse = await oThis.getBalanceOf(spenderAddress);

    if (senderAccountBalanceResponse.isFailure()) {
      let errorParams = {
        internal_error_identifier: 'l_ci_p_async_pay_1',
        api_error_identifier: 'get_balance_failed',
        error_config: errorConfig,
        debug_options: {}
      };
      return Promise.reject(responseHelper.error(errorParams));
    }
    const spenderOnChainAvailableBalanceResponse = new BigNumber(senderAccountBalanceResponse.data.balance);

    // if available balance is insufficient, error out
    if (spenderOnChainAvailableBalanceResponse.lt(totalTransferAmount)) {
      let errorParams = {
        internal_error_identifier: 'l_ci_p_async_pay_2',
        api_error_identifier: 'insufficient_funds',
        error_config: errorConfig,
        debug_options: {}
      };
      return Promise.reject(responseHelper.error(errorParams));
    }

    const brandedTokenResponse = await oThis.brandedToken();
    if (brandedTokenResponse.isFailure()) return Promise.reject(brandedTokenResponse);

    let brandedTokenAddress = brandedTokenResponse.data.brandedToken;

    const returnType = basicHelper.getReturnType(options.returnType);

    const successCallback = async function(receipt) {
      const setAddressToNameMapResponse = await oThis.setAddressToNameMap();
      if (setAddressToNameMapResponse.isFailure()) {
        return setAddressToNameMapResponse;
      }
      const actualAmountFromReceipt = oThis.transactionHelper.getActualAmountsFromReceipt(
        receipt,
        oThis.addressToNameMap,
        eventGlobalConstants.eventPayment()
      );

      if (actualAmountFromReceipt.isSuccess()) {
        return oThis.transactionHelper.afterPaySuccess(
          brandedTokenAddress,
          spenderAddress,
          totalTransferAmount,
          beneficiaryAddress,
          actualAmountFromReceipt.data.actualBeneficiaryAmount,
          commissionBeneficiaryAddress,
          actualAmountFromReceipt.data.actualCommissionAmount
        );
      } else {
        return oThis.transactionHelper.afterPayFailure(brandedTokenAddress, spenderAddress, totalTransferAmount);
      }
    };

    const failCallback = function(reason) {
      return oThis.transactionHelper.afterPayFailure(brandedTokenAddress, spenderAddress, totalTransferAmount);
    };

    const transactionObject = currContract.methods.pay(
      beneficiaryAddress,
      transferAmount,
      commissionBeneficiaryAddress,
      commissionAmount,
      web3Provider.utils.asciiToHex(currency),
      intendedPricePoint
    );

    const notificationData = helper.getNotificationData(
      ['transfer.payments.pricer.pay'],
      notificationGlobalConstant.publisher(),
      'pay',
      oThis.contractName,
      oThis.contractAddress,
      web3Provider,
      oThis.chainId,
      options
    );
    notificationData.message.payload.erc20_contract_address = brandedTokenAddress;

    const performSendParams = {
      transactionObject: transactionObject,
      notificationData: notificationData,
      senderAddress: spenderAddress,
      senderPassphrase: senderPassphrase,
      contractAddress: oThis.contractAddress,
      gasPrice: gasPrice,
      gasLimit: gasLimitGlobalConstant.airdropPay(),
      web3Provider: web3Provider,
      successCallback: successCallback,
      failCallback: failCallback,
      errorCode: 'l_ci_p_p_8'
    };

    console.log('------Pricer 11');

    const beforePayResponse = await oThis.transactionHelper.beforePay(
      brandedTokenAddress,
      spenderAddress,
      totalTransferAmount
    );
    if (beforePayResponse.isFailure()) return Promise.reject(beforePayResponse);

    return Promise.resolve(helper.performSend(performSendParams, returnType));
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
  getEstimatedTotalAmount: async function(transferAmount, commissionAmount, intendedPricePoint) {
    const oThis = this,
      conversionRateResponse = await oThis.conversionRate(),
      pricerConversionRate = new BigNumber(conversionRateResponse.data.conversionRate),
      conversionRateDecimalsResponse = await oThis.conversionRateDecimals(),
      pricerConversionRateDecimals = new BigNumber(conversionRateDecimalsResponse.data.conversionRateDecimals),
      decimalsResponse = await oThis.decimals(),
      pricerDecimals = new BigNumber(decimalsResponse.data.decimals);

    transferAmount = new BigNumber(transferAmount);
    commissionAmount = new BigNumber(commissionAmount);
    intendedPricePoint = new BigNumber(intendedPricePoint);

    const adjConversionRate = pricerConversionRate
      .mul(new BigNumber(10).pow(pricerDecimals))
      .div(new BigNumber(10).pow(pricerConversionRateDecimals))
      .floor();

    const estimatedAmount = transferAmount
        .mul(adjConversionRate)
        .div(intendedPricePoint)
        .floor(),
      estimatedCommisionAmount = commissionAmount
        .mul(adjConversionRate)
        .div(intendedPricePoint)
        .floor();

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
  getPricePoint: async function(currency) {
    const oThis = this,
      helper = oThis.ic().getContractInteractHelper();

    try {
      if (!helper.isValidCurrency(currency, false)) {
        let errorParams = {
          internal_error_identifier: 'l_ci_p_getPricePoint_1',
          api_error_identifier: 'invalid_api_params',
          error_config: errorConfig,
          params_error_identifiers: ['invalid_currency'],
          debug_options: {}
        };
        return Promise.resolve(responseHelper.paramValidationError(errorParams));
      }

      const priceOraclesResponse = await oThis.priceOracles(currency);
      if (priceOraclesResponse.isFailure()) {
        let errorParams = {
          internal_error_identifier: 'l_ci_p_getPricePoint_2',
          api_error_identifier: 'unhandled_api_error',
          error_config: errorConfig,
          debug_options: {}
        };
        return Promise.resolve(responseHelper.error(errorParams));
      }
      const poAddress = priceOraclesResponse.data.priceOracles;

      const cacheResult = await oThis.pricerCache.getPricePoint(poAddress);
      if (cacheResult.isSuccess() && cacheResult.data.response != null) {
        return Promise.resolve(responseHelper.successWithData({ pricePoint: cacheResult.data.response }));
      } else {
        const getPricePointFromContractResponse = await oThis.getPricePointFromContract(currency);
        if (getPricePointFromContractResponse.isSuccess()) {
          await oThis.pricerCache.setPricePoint(poAddress, getPricePointFromContractResponse.data.pricePoint);
        }
        return Promise.resolve(getPricePointFromContractResponse);
      }
    } catch (err) {
      let errorParams = {
        internal_error_identifier: 'l_ci_p_getPricePoint_3',
        api_error_identifier: 'unhandled_api_error',
        error_config: errorConfig,
        debug_options: {}
      };
      //Format the error
      logger.error('lib/contract_interact/pricer.js:getPricePoint inside catch ', err);
      return Promise.resolve(responseHelper.error(errorParams));
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
  getPricePointFromContract: async function(currency) {
    const oThis = this,
      coreAddresses = oThis.ic().getCoreAddresses(),
      web3ProviderFactory = oThis.ic().getWeb3ProviderFactory(),
      helper = oThis.ic().getContractInteractHelper(),
      web3Provider = web3ProviderFactory.getProvider(web3ProviderFactory.typeWS),
      contractAbi = coreAddresses.getAbiForContract('pricer'),
      currContract = new web3Provider.eth.Contract(contractAbi);

    if (!helper.isValidCurrency(currency, false)) {
      let errorParams = {
        internal_error_identifier: 'l_ci_p_getPricePointFromContract_1',
        api_error_identifier: 'invalid_api_params',
        error_config: errorConfig,
        params_error_identifiers: ['invalid_currency'],
        debug_options: {}
      };
      return Promise.resolve(responseHelper.paramValidationError(errorParams));
    }

    const transactionObject = currContract.methods.getPricePoint(web3Provider.utils.asciiToHex(currency)),
      encodedABI = transactionObject.encodeABI(),
      transactionOutputs = helper.getTransactionOutputs(transactionObject);

    try {
      const response = await helper.call(web3Provider, this.contractAddress, encodedABI, {}, transactionOutputs);
      return Promise.resolve(responseHelper.successWithData({ pricePoint: response[0] }));
    } catch (err) {
      let errorParams = {
        internal_error_identifier: 'l_ci_p_getPriceOraclesFromContract_1',
        api_error_identifier: 'unhandled_api_error',
        error_config: errorConfig,
        debug_options: {}
      };
      //Format the error
      logger.error('lib/contract_interact/pricer.js:getPricePointFromContract inside catch ', err);
      return Promise.resolve(responseHelper.error(errorParams));
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
  getPricePointAndCalculatedAmounts: async function(transferAmount, commissionAmount, currency) {
    const oThis = this,
      coreAddresses = oThis.ic().getCoreAddresses(),
      web3ProviderFactory = oThis.ic().getWeb3ProviderFactory(),
      helper = oThis.ic().getContractInteractHelper(),
      web3Provider = web3ProviderFactory.getProvider(web3ProviderFactory.typeWS),
      contractAbi = coreAddresses.getAbiForContract('pricer'),
      currContract = new web3Provider.eth.Contract(contractAbi);

    if (!helper.isValidCurrency(currency, false)) {
      let errorParams = {
        internal_error_identifier: 'l_ci_p_getPricePointAndCalculatedAmounts_1',
        api_error_identifier: 'invalid_api_params',
        error_config: errorConfig,
        params_error_identifiers: ['invalid_currency'],
        debug_options: {}
      };
      return Promise.resolve(responseHelper.paramValidationError(errorParams));
    }

    const transactionObject = currContract.methods.getPricePointAndCalculatedAmounts(
      transferAmount,
      commissionAmount,
      web3Provider.utils.asciiToHex(currency)
    );

    const encodedABI = transactionObject.encodeABI(),
      transactionOutputs = helper.getTransactionOutputs(transactionObject);

    try {
      const response = await helper.call(web3Provider, this.contractAddress, encodedABI, {}, transactionOutputs);
      return Promise.resolve(
        responseHelper.successWithData({
          pricePoint: response[0],
          tokenAmount: response[1],
          commissionTokenAmount: response[2]
        })
      );
    } catch (err) {
      let errorParams = {
        internal_error_identifier: 'l_ci_p_getPricePointAndCalculatedAmounts_2',
        api_error_identifier: 'unhandled_api_error',
        error_config: errorConfig,
        debug_options: {}
      };
      //Format the error
      logger.error('lib/contract_interact/pricer.js:getPricePointAndCalculatedAmounts inside catch ', err);
      return Promise.resolve(responseHelper.error(errorParams));
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
    const oThis = this,
      web3ProviderFactory = oThis.ic().getWeb3ProviderFactory(),
      web3Provider = web3ProviderFactory.getProvider(web3ProviderFactory.typeWS);
    return web3Provider.utils.toWei(value, 'ether');
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
    const oThis = this,
      web3ProviderFactory = oThis.ic().getWeb3ProviderFactory(),
      helper = oThis.ic().getContractInteractHelper(),
      web3Provider = web3ProviderFactory.getProvider(web3ProviderFactory.typeWS);
    if (!transactionHash) {
      let errorParams = {
        internal_error_identifier: 'l_ci_p_getTxReceipt_1',
        api_error_identifier: 'invalid_api_params',
        error_config: errorConfig,
        params_error_identifiers: ['invalid_transaction_hash'],
        debug_options: {}
      };
      return responseHelper.paramValidationError(errorParams);
    }
    const transactionReceipt = await helper.getTxReceipt(web3Provider, transactionHash, {});
    return Promise.resolve(responseHelper.successWithData({ transactionReceipt: transactionReceipt }));
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
      let errorParams = {
        internal_error_identifier: 'l_ci_p_getBalanceOf_1',
        api_error_identifier: 'invalid_api_params',
        error_config: errorConfig,
        params_error_identifiers: ['invalid_sender_address'],
        debug_options: {}
      };
      return Promise.resolve(responseHelper.paramValidationError(errorParams));
    }

    const setTokenResponse = await oThis.setTokenObj();
    if (setTokenResponse.isFailure()) {
      return Promise.resolve(setTokenResponse);
    }

    return oThis.token.getBalanceOf(owner);
  }
};

InstanceComposer.registerShadowableClass(Pricer, 'getPricerInteractClass');

module.exports = Pricer;
