"use strict";

/**
 *
 * This is a utility file which would be used for executing all methods on EIP20Token contract.<br><br>
 *
 * @module lib/contract_interact/branded_token
 *
 */
const BigNumber = require('bignumber.js')
;

const rootPrefix = '../..'
  , helper = require(rootPrefix + '/lib/contract_interact/helper')
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , web3RpcProvider = require(rootPrefix + '/lib/web3/providers/rpc')
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , notificationGlobalConstant = require(rootPrefix + '/lib/global_constant/notification')
  , BalanceCacheKlass = require(rootPrefix + '/lib/cache_management/balance')
;

const contractName = 'brandedToken'
  , contractAbi = coreAddresses.getAbiForContract(contractName)
  , currContract = new web3RpcProvider.eth.Contract(contractAbi)
  , gasLimit = coreConstants.OST_GAS_LIMIT
;

/**
 * Constructor to create object of BrandedToken
 *
 * @constructor
 *
 * @param {string} brandedTokenAddress - Branded token address
 * @param {number} chainId - chainId
 *
 */
const BrandedToken = function (brandedTokenAddress, chainId) {
  const oThis = this
  ;

  oThis.brandedTokenAddress = brandedTokenAddress;
  oThis.chainId = chainId;
  oThis.balanceCache = new BalanceCacheKlass(chainId, brandedTokenAddress);
  //currContract.setProvider(web3RpcProvider.currentProvider);
};

BrandedToken.prototype = {

  /**
   * branded token address
   */
  brandedTokenAddress: null,

  /**
   * chain id
   */
  chainId: null,

  /**
   * balance cache
   */
  balanceCache: null,

  /**
   * Fetch Balance For a given address
   *
   * @param {string} owner - address for which balance is to be fetched
   *
   * @return {promise<result>}
   *
   */
  getBalanceOf: async function (owner) {
    const oThis = this
    ;

    try {
      var cacheResult = await oThis.balanceCache.getBalance(owner);

      if (cacheResult.isSuccess() && cacheResult.data.response != null) {
        return Promise.resolve(responseHelper.successWithData({balance: cacheResult.data.response}));
      } else {
        const getBalanceFromContractResponse = await oThis.getBalanceFromContract(owner);

        cacheResult = await oThis.balanceCache.getBalance(owner);
        if (cacheResult.isSuccess() && cacheResult.data.response != null) {
          return Promise.resolve(responseHelper.successWithData({balance: cacheResult.data.response}));
        }

        if (getBalanceFromContractResponse.isFailure()) return Promise.resolve(getBalanceFromContractResponse);

        await oThis.balanceCache.setBalance(owner, new BigNumber(getBalanceFromContractResponse.data.balance));

        return Promise.resolve(responseHelper.successWithData({balance: getBalanceFromContractResponse.data.balance}));
      }
    } catch(err) {
      logger.error('lib/contract_interact/branded_token.js:getBalanceOf inside catch:', err);
      return Promise.resolve(responseHelper.error('l_ci_bt_getBalanceOf_2', 'Something went wrong.'));
    }
  },

  /**
   * Fetch Balance For a given address from contract
   *
   * @param {string} owner - address for which balance is to be fetched
   *
   * @return {promise<result>}
   *
   */
  getBalanceFromContract: async function (owner) {
    const oThis = this
    ;

    try {
      const transactionObject = currContract.methods.balanceOf(owner)
        , encodedABI = transactionObject.encodeABI()
        , transactionOutputs = helper.getTransactionOutputs(transactionObject)
        , response = await helper.call(web3RpcProvider, oThis.brandedTokenAddress, encodedABI, {}, transactionOutputs);

      return Promise.resolve(responseHelper.successWithData({balance: response[0]}));
    } catch(err) {
      logger.error('lib/contract_interact/branded_token.js:getBalanceFromContract inside catch:', err);
      return Promise.resolve(responseHelper.error('l_ci_bt_getBalanceFromContract_1', 'Something went wrong.'));
    }
  },

  /**
   * Transfer amount to budget holder
   *
   * @param {string} senderAddress - address of sender
   * @param {string} senderPassphrase - passphrase of sender
   * @param {string} airdropBudgetHolderAddress - recipient address
   * @param {BigNumber} amount - amount in wei
   * @param {BigNumber} gasPrice - gas price
   * @param {object} options - for params like returnType, tag.
   *
   * @return {promise<result>}
   *
   */
  transferToAirdropBudgetHolder: async function (senderAddress, senderPassphrase, airdropBudgetHolderAddress,
                                           amount, gasPrice, options) {
    const oThis = this
    ;

    try {
      const returnType = basicHelper.getReturnType(options.returnType)
        , transactionObject = currContract.methods.transfer(airdropBudgetHolderAddress, amount)
      ;

      const notificationData = helper.getNotificationData(
        ['transfer.payments.brandedToken.transferToBudgetHolder'],
        notificationGlobalConstant.publisher(),
        'transferToBudgetHolder',
        contractName,
        oThis.brandedTokenAddress,
        web3RpcProvider,
        oThis.chainId,
        options);
      notificationData.message.payload.erc20_contract_address = oThis.brandedTokenAddress;

      const onSuccess = async function(receipt) {
        await oThis._afterTransferSuccess(airdropBudgetHolderAddress, amount);
      };
      const onFail = async function(receipt) {
        await oThis._afterTransferFail(senderAddress, amount);
      };

      const params = {
        transactionObject: transactionObject,
        notificationData: notificationData,
        senderAddress: senderAddress,
        senderPassphrase: senderPassphrase,
        contractAddress: oThis.brandedTokenAddress,
        gasPrice: gasPrice,
        gasLimit: gasLimit,
        web3RpcProvider: web3RpcProvider,
        successCallback: onSuccess,
        failCallback: onFail,
        errorCode: "l_ci_bt_transferToAirdropBudgetHolder_1"
      };

      const beforeTransferResponse = await oThis._beforeTransfer(senderAddress, amount);

      if (beforeTransferResponse.isSuccess()) {
        return Promise.resolve(helper.performSend(params, returnType));
      } else {
        return Promise.resolve(beforeTransferResponse);
      }
    } catch(err) {
      logger.error('lib/contract_interact/branded_token.js:transferToAirdropBudgetHolder inside catch:', err);
      return Promise.resolve(responseHelper.error('l_ci_bt_transferToAirdropBudgetHolder_2', 'Something went wrong.'));
    }
  },

  /**
   * Credit balance in cache
   *
   * @param {string} owner - Account address
   * @param {BigNumber} bigAmount - amount to be credited
   *
   * @return {promise<result>}
   */
  creditBalance: async function (owner, bigAmount) {
    const oThis = this
    ;

    try {
      bigAmount = basicHelper.convertToBigNumber(bigAmount);
      
      if (bigAmount.gt(0)) {
        const getBalanceOfResponse = await oThis.getBalanceOf(owner);

        if (getBalanceOfResponse.isSuccess()) {
          const balance = new BigNumber(getBalanceOfResponse.data.balance);
          const newBalance = balance.plus(bigAmount);
          logger.debug('creditBalance called with params:', JSON.stringify({owner: owner,
            bigAmount: bigAmount.toString(10)}));
          await oThis.setBalanceInCache(owner, newBalance);
        } else {
          logger.error('lib/contract_interact/branded_token.js:creditBalance getBalanceOfResponse error',
            JSON.stringify(getBalanceOfResponse));
        }
      }
      
      return Promise.resolve(responseHelper.successWithData({}));
    } catch(err) {
      logger.error('lib/contract_interact/branded_token.js:creditBalance inside catch:', err);
      return Promise.resolve(responseHelper.error('l_ci_bt_creditBalance_1', 'Something went wrong.'));
    }
  },

  /**
   * Debit balance in cache
   *
   * @param {string} owner - Account address
   * @param {BigNumber} bigAmount - amount to be debited
   *
   * @return {promise<result>}
   */
  debitBalance: async function (owner, bigAmount) {
    const oThis = this
    ;

    try {

      bigAmount = basicHelper.convertToBigNumber(bigAmount);
      if (bigAmount.gt(0)) {
        const getBalanceOfResponse = await oThis.getBalanceOf(owner);

        if (getBalanceOfResponse.isSuccess()) {
          const balance = new BigNumber(getBalanceOfResponse.data.balance);
          const newBalance = balance.minus(bigAmount);
          logger.debug('debitBalance called with params:', JSON.stringify({owner: owner,
            bigAmount: bigAmount.toString(10)}));
          await oThis.setBalanceInCache(owner, newBalance);
        } else {
          logger.error('lib/contract_interact/branded_token.js:debitBalance getBalanceOfResponse error',
            JSON.stringify(getBalanceOfResponse));
        }
      }
      
      return Promise.resolve(responseHelper.successWithData({}));
    } catch(err) {
      logger.error('lib/contract_interact/branded_token.js:debitBalance inside catch:', err);
      return Promise.resolve(responseHelper.error('l_ci_bt_debitBalance_1', 'Something went wrong.'));
    }
  },

  /**
   * Set balance in cache
   *
   * @param {string} owner - Account address
   * @param {BigNumber} bigAmount - amount to be set
   *
   * @return {promise<result>}
   */
  setBalanceInCache: async function (owner, bigAmount) {
    const oThis = this
    ;

    try {
      const setBalanceResponse = await oThis.balanceCache.setBalance(owner, bigAmount);

      if (setBalanceResponse.isSuccess() && setBalanceResponse.data.response != null) {
        return Promise.resolve(responseHelper.successWithData({}));
      }
      return Promise.resolve(responseHelper.error('l_ci_bt_setBalanceInCache_1', setBalanceResponse));
    } catch(err) {
      logger.error('lib/contract_interact/branded_token.js:setBalanceInCache inside catch:', err);
      return Promise.resolve(responseHelper.error('l_ci_bt_setBalanceInCache_2', 'Something went wrong.'));
    }
  },

  /**
   * Approve amount to budget holder
   *
   * @param {string} airdropBudgetHolderAddress - address of airdropBudgetHolder
   * @param {string} airdropBudgetHolderPassphrase - Passphrase of airdropBudgetHolder
   * @param {string} airdropContractAddress - airdrop contract address
   * @param {BigNumber} amount - amount in wei
   * @param {BigNumber} gasPrice - gas price
   * @param {object} options - for params like returnType, tag.
   *
   * @return {promise<result>}
   *
   */
  approveByBudgetHolder: function (airdropBudgetHolderAddress, airdropBudgetHolderPassphrase, airdropContractAddress,
                                   amount, gasPrice, options) {

    const oThis = this
    ;

    try {
      const returnType = basicHelper.getReturnType(options.returnType)
        , transactionObject = currContract.methods.approve(airdropContractAddress, amount);

      const notificationData = helper.getNotificationData(
        ['payments.brandedToken.approveToBudgetHolder'],
        notificationGlobalConstant.publisher(),
        'approveByBudgetHolder',
        contractName,
        oThis.brandedTokenAddress,
        web3RpcProvider,
        oThis.chainId,
        options);

      const params = {
        transactionObject: transactionObject,
        notificationData: notificationData,
        senderAddress: airdropBudgetHolderAddress,
        senderPassphrase: airdropBudgetHolderPassphrase,
        contractAddress: oThis.brandedTokenAddress,
        gasPrice: gasPrice,
        gasLimit: gasLimit,
        web3RpcProvider: web3RpcProvider,
        successCallback: null,
        failCallback: null,
        errorCode: "l_ci_bt_approveByBudgetHolder_1"
      };

      return helper.performSend(params, returnType);
    } catch(err) {
      logger.error('lib/contract_interact/branded_token.js:approveByBudgetHolder inside catch:', err);
      return Promise.resolve(responseHelper.error('l_ci_bt_approveByBudgetHolder_2', 'Something went wrong.'));
    }
  },

  /**
   * Called before transfer to airdrop budget holder
   *
   * @param {string} address - address
   * @param {BigNumber} amount - amount in wei
   *
   * @return {Promise}
   * @ignore
   * @private
   *
   */
  _beforeTransfer: function(address, amount) {
    const oThis = this
    ;

    logger.debug('_beforeTransfer called with params:', JSON.stringify({address: address, amount: amount}));

    return oThis.debitBalance(address, amount);
  },

  /**
   * Called after successful transfer to airdrop budget holder
   *
   * @param {string} address - address
   * @param {BigNumber} amount - amount in wei
   *
   * @return {Promise}
   * @ignore
   * @private
   *
   */
  _afterTransferSuccess: function(address, amount) {
    const oThis = this
    ;

    logger.debug('_afterTransferSuccess called with params:', JSON.stringify({address: address, amount: amount}));

    return oThis.creditBalance(address, amount);
  },

  /**
   * Called after unsuccessful transfer to airdrop budget holder
   *
   * @param {string} address - address
   * @param {BigNumber} amount - amount in wei
   *
   * @return {Promise}
   * @ignore
   * @private
   *
   */
  _afterTransferFail: function(address, amount) {
    const oThis = this
    ;

    logger.debug('_afterTransferFail called with params:', JSON.stringify({address: address, amount: amount}));

    return oThis.creditBalance(address, amount);
  },

};

module.exports = BrandedToken;

