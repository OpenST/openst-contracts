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
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , eventDecoder = require(rootPrefix + '/lib/web3/events/decoder')
  , helper = require(rootPrefix + '/lib/contract_interact/helper')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , web3RpcProvider = require(rootPrefix + '/lib/web3/providers/rpc')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , TrasactionHelperKlass = require(rootPrefix + '/lib/transaction_helper')
  , PricerCacheKlass = require(rootPrefix + '/lib/cache_management/pricer')
;

const notificationGlobalConstant = require(rootPrefix + '/lib/global_constant/notification')
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
  oThis.pricerCache = new PricerCacheKlass(chainId, pricerAddress);
  oThis.transactionHelper = new TrasactionHelperKlass(chainId);
  // create address to name map
  oThis.addressToNameMap[pricerAddress.toLowerCase()] = contractName;

  oThis.brandedToken().then(function(response) {
    oThis.token = new Token(response.data.brandedToken, oThis.chainId);
    oThis.addressToNameMap[response.data.brandedToken.toLowerCase()] = 'brandedtoken';
  });

};


Pricer.prototype = {
  // Define all the properties
  contractAddress: null,
  chainId: null,
  token: null,
  addressToNameMap: {},
  transactionHelper: null,
  pricerCache: null,


  /**
  * Get branded token address of pricer from cache, if not found in cache get from contract
  *
  * @return {Promise}
  *
  */
  brandedToken: function () {
    const oThis = this;

    return new Promise(function (onResolve, onReject) {
      const callback = async function (response) {
        var cacheResult = await oThis.pricerCache.getBrandedTokenAddress();
        if (cacheResult.isSuccess() && cacheResult.data.response != null) {
          //Ignore the balance we already have.
          responseHelper.successWithData({brandedToken: cacheResult.data.response});
        }
        //Cache it
        if (response.isSuccess()) {
          await oThis.pricerCache.setBrandedTokenAddress(response.data.brandedToken);
        }
        return response;
      };

      return oThis.pricerCache.getBrandedTokenAddress()
        .then(async function (cacheResult) {
          if (cacheResult.isSuccess() && cacheResult.data.response != null) {
            return onResolve(responseHelper.successWithData({brandedToken: cacheResult.data.response}));
          } else {
            return onResolve( await oThis.getBrandedTokenAddressFromContract().then(callback));
          }

        })
        .catch(function(err) {
          //Format the error
          return onResolve(responseHelper.error('l_ci_p_bt_1', 'Something went wrong'));
        });
    });

  },

  /**
  * Get branded token address of pricer from contract
  *
  * @return {Promise}
  *
  */
  getBrandedTokenAddressFromContract: async function() {
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
  acceptedMargins: function (currency) {
    const oThis = this;
    return new Promise(function (onResolve, onReject) {
      if (!helper.isValidCurrency(currency, false)) {
        return onResolve(responseHelper.error('l_ci_p_am_1', 'currency is mandatory'));
      }

      const callback = async function (response) {
        var cacheResult = await oThis.pricerCache.getAcceptedMargins(currency);
        if (cacheResult.isSuccess() && cacheResult.data.response != null) {
          //Ignore the balance we already have.
          responseHelper.successWithData({acceptedMargins: cacheResult.data.response});
        }
        //Cache it
        if (response.isSuccess()) {
          await oThis.pricerCache.setAcceptedMargins(currency, response.data.acceptedMargins);
        }
        return response;
      };

      return oThis.pricerCache.getAcceptedMargins(currency)
        .then(async function (cacheResult) {
          if (cacheResult.isSuccess() && cacheResult.data.response != null) {
            return onResolve(responseHelper.successWithData({acceptedMargins: cacheResult.data.response}));
          } else {
            return onResolve( await oThis.getAcceptedMarginsFromContract(currency).then(callback));
          }

        })
        .catch(function(err) {
          //Format the error
          return onResolve(responseHelper.error('l_ci_p_am_2', 'Something went wrong'));
        });
    });

  },

  /**
  * Get acceptable margin for the given currency from contract
  *
  * @param {string} currency - quote currency
  *
  * @return {Promise}
  *
  */
  getAcceptedMarginsFromContract: async function (currency) {
    const oThis = this;
    if (!helper.isValidCurrency(currency, false)) {
      return Promise.resolve(responseHelper.error('l_ci_p_am_1', 'currency is mandatory'));
    }
    const transactionObject = currContract.methods.acceptedMargins(web3RpcProvider.utils.asciiToHex(currency));
    const encodedABI = transactionObject.encodeABI();
    const transactionOutputs = helper.getTransactionOutputs(transactionObject);
    const response = await helper.call(web3RpcProvider, this.contractAddress, encodedABI, {}, transactionOutputs);
    return Promise.resolve(responseHelper.successWithData({acceptedMargins: response[0]}));
  },


  /**
  * Get address of price oracle for the given currency
  *
  * @param {string} currency - quote currency
  *
  * @return {Promise}
  *
  */
  priceOracles: function (currency) {

    const oThis = this;
    return new Promise(function (onResolve, onReject) {
      if (!helper.isValidCurrency(currency, false)) {
        return onResolve(responseHelper.error('l_ci_p_po_1', 'currency is mandatory'));
      }

      const callback = async function (response) {
        var cacheResult = await oThis.pricerCache.getPriceOracles(currency);
        if (cacheResult.isSuccess() && cacheResult.data.response != null) {
          //Ignore the balance we already have.
          responseHelper.successWithData({priceOracles: cacheResult.data.response});
        }
        //Cache it
        if (response.isSuccess()) {
          await oThis.pricerCache.setPriceOracles(currency, response.data.priceOracles);
        }
        return response;
      };

      return oThis.pricerCache.getPriceOracles(currency)
        .then(async function (cacheResult) {
          if (cacheResult.isSuccess() && cacheResult.data.response != null) {
            return onResolve(responseHelper.successWithData({priceOracles: cacheResult.data.response}));
          } else {
            return onResolve( await oThis.getPriceOraclesFromContract(currency).then(callback));
          }

        })
        .catch(function(err) {
          //Format the error
          return onResolve(responseHelper.error('l_ci_p_po_2', 'Something went wrong'));
        });
    });
  },


  /**
  * Get address of price oracle for the given currency from contract
  *
  * @param {string} currency - quote currency
  *
  * @return {Promise}
  *
  */
  getPriceOraclesFromContract: async function (currency) {
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
  decimals: function () {
    const oThis = this;

    return new Promise(function (onResolve, onReject) {
      const callback = async function (response) {
        var cacheResult = await oThis.pricerCache.getDecimals();
        if (cacheResult.isSuccess() && cacheResult.data.response != null) {
          //Ignore the balance we already have.
          responseHelper.successWithData({decimals: cacheResult.data.response});
        }
        //Cache it
        if (response.isSuccess()) {
          await oThis.pricerCache.setDecimals(response.data.decimals);
        }
        return response;
      };

      return oThis.pricerCache.getDecimals()
        .then(async function (cacheResult) {
          if (cacheResult.isSuccess() && cacheResult.data.response != null) {
            return onResolve(responseHelper.successWithData({decimals: cacheResult.data.response}));
          } else {
            return onResolve( await oThis.getDecimalsFromContract().then(callback));
          }

        })
        .catch(function(err) {
          //Format the error
          return onResolve(responseHelper.error('l_ci_p_d_1', 'Something went wrong'));
        });
    });
  },


  /**
  * Get decimal of pricer from contract
  *
  * @return {Promise}
  *
  */
  getDecimalsFromContract: async function () {
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
  conversionRate: function () {
    const oThis = this;

    return new Promise(function (onResolve, onReject) {
      const callback = async function (response) {
        var cacheResult = await oThis.pricerCache.getConversionRate();
        if (cacheResult.isSuccess() && cacheResult.data.response != null) {
          //Ignore the balance we already have.
          responseHelper.successWithData({conversionRate: cacheResult.data.response});
        }
        //Cache it
        if (response.isSuccess()) {
          await oThis.pricerCache.setConversionRate(response.data.conversionRate);
        }
        return response;
      };

      return oThis.pricerCache.getConversionRate()
        .then(async function (cacheResult) {
          if (cacheResult.isSuccess() && cacheResult.data.response != null) {
            return onResolve(responseHelper.successWithData({conversionRate: cacheResult.data.response}));
          } else {
            return onResolve( await oThis.getConversionRateFromContract().then(callback));
          }

        })
        .catch(function(err) {
          //Format the error
          return onResolve(responseHelper.error('l_ci_p_cr_1', 'Something went wrong'));
        });
    });
  },

  /**
  * Get conversion rate of pricer from contract
  *
  * @return {Promise}
  *
  */
  getConversionRateFromContract: async function () {
    const transactionObject = currContract.methods.conversionRate();
    const encodedABI = transactionObject.encodeABI();
    const transactionOutputs = helper.getTransactionOutputs(transactionObject);
    const response = await helper.call(web3RpcProvider, this.contractAddress, encodedABI, {}, transactionOutputs);
    return Promise.resolve(responseHelper.successWithData({conversionRate: response[0]}));
  },

  /**
  * Get conversion rate decimals of pricer
  *
  * @return {Promise}
  *
  */
  conversionRateDecimals: function () {
    const oThis = this;

    return new Promise(function (onResolve, onReject) {
      const callback = async function (response) {
        var cacheResult = await oThis.pricerCache.getConversionRateDecimals();
        if (cacheResult.isSuccess() && cacheResult.data.response != null) {
          //Ignore the balance we already have.
          responseHelper.successWithData({conversionRateDecimals: cacheResult.data.response});
        }
        //Cache it
        if (response.isSuccess()) {
          await oThis.pricerCache.setConversionRateDecimals(response.data.conversionRateDecimals);
        }
        return response;
      };

      return oThis.pricerCache.getConversionRateDecimals()
        .then(async function (cacheResult) {
          if (cacheResult.isSuccess() && cacheResult.data.response != null) {
            return onResolve(responseHelper.successWithData({conversionRateDecimals: cacheResult.data.response}));
          } else {
            return onResolve( await oThis.getConversionRateDecimalsFromContract().then(callback));
          }

        })
        .catch(function(err) {
          //Format the error
          return onResolve(responseHelper.error('l_ci_p_crd_1', 'Something went wrong'));
        });
    });
  },


  /**
  * Get conversion rate decimals of pricer from contract
  *
  * @return {Promise}
  *
  */
  getConversionRateDecimalsFromContract: async function () {
    const transactionObject = currContract.methods.conversionRateDecimals();
    const encodedABI = transactionObject.encodeABI();
    const transactionOutputs = helper.getTransactionOutputs(transactionObject);
    const response = await helper.call(web3RpcProvider, this.contractAddress, encodedABI, {}, transactionOutputs);
    return Promise.resolve(responseHelper.successWithData({conversionRateDecimals: response[0]}));
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
    if (!gasPrice) {
      return responseHelper.error('l_ci_p_spo_2', 'gas is mandatory');
    }
    if (!basicHelper.isAddressValid(address)) {
      return responseHelper.error('l_ci_p_spo_3', 'address is invalid');
    }
    if (!basicHelper.isAddressValid(senderAddress)) {
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
        ['payments.pricer.setPriceOracle'],
        notificationGlobalConstant.publisher(),
        'setPriceOracle',
        contractName,
        oThis.contractAddress,
        web3RpcProvider,
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
        web3RpcProvider: web3RpcProvider,
        successCallback: successCallback,
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
    if (!gasPrice) {
      return responseHelper.error('l_ci_p_uspo_2', 'gas is mandatory');
    }
    if (!basicHelper.isAddressValid(senderAddress)) {
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
        ['payments.pricer.unsetPriceOracle'],
        notificationGlobalConstant.publisher(),
        'unsetPriceOracle',
        contractName,
        oThis.contractAddress,
        web3RpcProvider,
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
        web3RpcProvider: web3RpcProvider,
        successCallback: successCallback,
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
    if (!gasPrice) {
      return responseHelper.error('l_ci_p_sam_2', 'gas price is mandatory');
    }
    acceptedMargin = new BigNumber(acceptedMargin);
    if (acceptedMargin.isNaN() || !acceptedMargin.isInteger() || acceptedMargin.lt(0)) {
      return responseHelper.error('l_ci_p_sam_3', 'accepted margin cannot be negative');
    }
    if (!basicHelper.isAddressValid(senderAddress)) {
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
        ['payments.pricer.setAcceptedMargin'],
        notificationGlobalConstant.publisher(),
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
        onResolve(oThis.pricerCache.clearAcceptedMargins(currency));
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
      return Promise.resolve(responseHelper.error('l_ci_p_p_6', 'error while getting balance'));
    }
    const userInitialBalance = new BigNumber(senderAccountBalanceResponse.data.balance);
    if (userInitialBalance.lt(totalAmount)) {
      return Promise.resolve(responseHelper.error('l_ci_p_p_7', 'insufficient balance'));
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
      web3RpcProvider.utils.asciiToHex(currency),
      intendedPricePoint);

    const notificationData = helper.getNotificationData(
      ['payments.pricer.pay'],
      notificationGlobalConstant.publisher(),
      'pay',
      contractName,
      oThis.contractAddress,
      web3RpcProvider,
      oThis.chainId,
      options);

    const successCallback = function(receipt) {

      console.log("Payer success callback");

      const actualAmountFromReceipt = oThis.transactionHelper.getActualAmountsFromReceipt(receipt, oThis.addressToNameMap);
      console.log("actualAmountFromReceipt");
      console.log(actualAmountFromReceipt);
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
        console.log("No event found so rollback");
        return oThis.transactionHelper.afterPayFailure(brandedTokenAddress, senderAddress, totalAmount);
      }

    };

    const failCallback = function(reason) {
      console.log("Payer fail callback");
      console.log(reason);
      return oThis.transactionHelper.afterPayFailure(brandedTokenAddress, senderAddress, totalAmount);
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

    return oThis.transactionHelper.beforePay(
      brandedTokenAddress,
      senderAddress,
      totalAmount)
      .then(function(beforePayResponse) {
        console.log("beforePayResponse");
        console.log(beforePayResponse);
        if (beforePayResponse.isSuccess()) {
          return Promise.resolve(helper.performSend(params, returnType));
        } else {
          return Promise.resolve(beforePayResponse);
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
  getEstimatedTotalAmount: async function (transferAmount, commissionAmount, intendedPricePoint) {

    const oThis = this;

    // While review please check if need to handle failure case here.
    const conversionRateResponse = await oThis.conversionRate();
    const pricerConversionRate = new BigNumber(conversionRateResponse.data.conversionRate);

    const conversionRateDecimalsResponse = await oThis.conversionRateDecimals();
    const pricerConversionRateDecimals = new BigNumber(conversionRateDecimalsResponse.data.conversionRateDecimals);

    const decimalsResponse = await oThis.decimals();
    const pricerDecimals = new BigNumber(decimalsResponse.data.decimals);

    const adjConversionRate = (pricerConversionRate.mul((new BigNumber(10).pow(pricerDecimals)))).div((new BigNumber(10).pow(pricerConversionRateDecimals)));
    const estimatedAmount = (transferAmount.mul(adjConversionRate)).div(intendedPricePoint);
    const estimatedCommisionAmount = (commissionAmount.mul(adjConversionRate)).div(intendedPricePoint);
    const totalEstimatedAmount = estimatedAmount.plus(estimatedCommisionAmount);

    return totalEstimatedAmount;
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

    const oThis = this;
    return new Promise(function (onResolve, onReject) {
      if (!helper.isValidCurrency(currency, false)) {
        return onResolve(responseHelper.error('l_ci_p_gpp_1', 'currency is mandatory'));
      }

      oThis.priceOracles(currency)
        .then(function(addressResponse) {
          if (addressResponse.isSuccess()) {
            const poAddress = addressResponse.data.priceOracles;
            const callback = async function (response) {
              var cacheResult = await oThis.pricerCache.getPricePoint(poAddress);
              if (cacheResult.isSuccess() && cacheResult.data.response != null) {
                //Ignore the balance we already have.
                responseHelper.successWithData({pricePoint: cacheResult.data.response});
              }
              //Cache it
              if (response.isSuccess()) {
                await oThis.pricerCache.setPricePoint(poAddress, response.data.pricePoint);
              }
              return response;
            };

            return oThis.pricerCache.getPricePoint(poAddress)
              .then(async function (cacheResult) {
                if (cacheResult.isSuccess() && cacheResult.data.response != null) {
                  return onResolve(responseHelper.successWithData({pricePoint: cacheResult.data.response}));
                } else {
                  return onResolve( await oThis.getPricePointFromContract(currency).then(callback));
                }

              })
              .catch(function(err) {
                //Format the error
                return onResolve(responseHelper.error('l_ci_p_gpp_2', 'Something went wrong'));
              });
          }else{
            return onResolve(responseHelper.error('l_ci_p_gpp_4', 'Something went wrong'));
          }
        })
        .catch(function(err) {
          //Format the error
          return onResolve(responseHelper.error('l_ci_p_gpp_3', 'Something went wrong'));
        });
    });

  },

  /**
  * Get current price point from the price oracle for the give currency from contract
  *
  * @param {string} currency - quote currency
  *
  * @return {Promise}
  *
  */
  getPricePointFromContract: function (currency) {

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
    if (!basicHelper.isAddressValid(owner)) {
      return Promise.resolve(responseHelper.error('l_ci_p_gbo_1', 'address is invalid'));
    }
    const oThis = this;
    return oThis.token.getBalanceOf(owner);
  }


};

