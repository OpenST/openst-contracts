"use strict";

/**
 *
 * This is a utility file which would be used for executing all methods on EIP20Token contract.<br><br>
 *
 * @module lib/contract_interact/branded_token
 *
 */
const openSTStorage = require('@openstfoundation/openst-storage')
;

const rootPrefix = '../..'
  , helper = require(rootPrefix + '/lib/contract_interact/helper')
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , web3Provider = require(rootPrefix + '/lib/web3/providers/ws')
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , notificationGlobalConstant = require(rootPrefix + '/lib/global_constant/notification')
  , gasLimitGlobalConstant = require(rootPrefix + '/lib/global_constant/gas_limit')
  , paramErrorConfig = require(rootPrefix + '/config/param_error_config')
  , apiErrorConfig = require(rootPrefix + '/config/api_error_config')
  , ddbServiceObj = require(rootPrefix + '/lib/dynamoDB_service')
;

const errorConfig = {
  param_error_config: paramErrorConfig,
  api_error_config: apiErrorConfig
};

const contractName = 'brandedToken'
  , contractAbi = coreAddresses.getAbiForContract(contractName)
  , currContract = new web3Provider.eth.Contract(contractAbi)
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

      // Validate addresses
      if (!basicHelper.isAddressValid(owner)) {
        let errObj = responseHelper.error({
          internal_error_identifier: 'l_ci_bt_getBalanceOf_1',
          api_error_identifier: 'invalid_address',
          error_config: errorConfig
        });

        return Promise.resolve(errObj);
      }

      const balanceResponse = await new openSTStorage.TokenBalanceCache({
        erc20_contract_address: oThis.brandedTokenAddress, ethereum_addresses: [owner]
      }).fetch();

      if (balanceResponse.isFailure()) {
        return Promise.resolve(balanceResponse);
      }

      const ownerBalance = balanceResponse.data[owner].available_balance;

      return responseHelper.successWithData({balance: ownerBalance});

    } catch(err) {
      let errorParams = {
        internal_error_identifier: 'l_ci_bt_getBalanceOf_2',
        api_error_identifier: 'unhandled_api_error',
        error_config: errorConfig,
        debug_options: {}
      };
      logger.error('lib/contract_interact/branded_token.js:getBalanceOf inside catch:', err);
      return Promise.resolve(responseHelper.error(errorParams));
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
        web3Provider,
        oThis.chainId,
        options);
      notificationData.message.payload.erc20_contract_address = oThis.brandedTokenAddress;

      const onSuccess = async function(receipt) {
        if(coreConstants.STANDALONE_MODE == '1') {
          await oThis._afterTransferSuccess(senderAddress, airdropBudgetHolderAddress, amount);
        }
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
        gasLimit: gasLimitGlobalConstant.transferToAirdropBudgetHolder(),
        web3Provider: web3Provider,
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
      let errorParams = {
        internal_error_identifier: 'l_ci_bt_transferToAirdropBudgetHolder_2',
        api_error_identifier: 'unhandled_api_error',
        error_config: errorConfig,
        debug_options: {}
      };
      logger.error('lib/contract_interact/branded_token.js:transferToAirdropBudgetHolder inside catch:', err);
      return Promise.resolve(responseHelper.error(errorParams));
    }
  },

  /**
   * Credit balance in cache
   *
   * @param {string} owner - Account address
   * @param {BigNumber} amount - amount to be credited
   *
   * @return {promise<result>}
   */
  creditBalance: async function (owner, amount) {
    const oThis = this
      , bigAmount = basicHelper.convertToBigNumber(amount)
    ;

    try {

      const balanceUpdateResponse = await new openSTStorage.TokenBalanceModel({
        ddb_service: ddbServiceObj,
        auto_scaling: null,
        erc20_contract_address: oThis.brandedTokenAddress
      }).update({
        ethereum_address: owner,
        settle_amount: bigAmount.toString(10)
      }).catch(function (error) {
        return error;
      });

      if (balanceUpdateResponse.isFailure()) {
        return balanceUpdateResponse;
      }
      return Promise.resolve(responseHelper.successWithData({}));

    } catch(err) {
      let errorParams = {
        internal_error_identifier: 'l_ci_bt_creditBalance_1',
        api_error_identifier: 'unhandled_api_error',
        error_config: errorConfig,
        debug_options: {}
      };
      logger.error('lib/contract_interact/branded_token.js:creditBalance inside catch:', err);
      return Promise.resolve(responseHelper.error(errorParams));
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
  debitBalance: async function (owner, amount) {
    const oThis = this
      ,  debitAmount = (basicHelper.convertToBigNumber(amount)).mul(basicHelper.convertToBigNumber(-1));

    try {

      const balanceUpdateResponse = await new openSTStorage.TokenBalanceModel({
        ddb_service: ddbServiceObj,
        auto_scaling: null,
        erc20_contract_address: oThis.brandedTokenAddress
      }).update({
        ethereum_address: owner,
        settle_amount: debitAmount.toString(10),
        un_settled_debit_amount: debitAmount.toString(10)
      }).catch(function (error) {
        return error;
      });

      if (balanceUpdateResponse.isFailure()) {
        return balanceUpdateResponse;
      }
      return Promise.resolve(responseHelper.successWithData({}));

    } catch(err) {
      let errorParams = {
        internal_error_identifier: 'l_ci_bt_debitBalance_1',
        api_error_identifier: 'unhandled_api_error',
        error_config: errorConfig,
        debug_options: {}
      };
      logger.error('lib/contract_interact/branded_token.js:debitBalance inside catch:', err);
      return Promise.resolve(responseHelper.error(errorParams));
    }
  },


  /**
   * Debit balance in cache for pessimistic caching
   *
   * @param {string} owner - Account address
   * @param {BigNumber} bigAmount - amount to be debited
   *
   * @return {promise<result>}
   *
   * @ignore
   */
  pessimisticDebit: async function (owner, amount) {

    const oThis = this
      , bigAmount = basicHelper.convertToBigNumber(amount)
    ;

    const balanceUpdateResponse = await new openSTStorage.TokenBalanceModel({
      ddb_service: ddbServiceObj,
      auto_scaling: null,
      erc20_contract_address: oThis.brandedTokenAddress
    }).update({
      ethereum_address: owner,
      un_settled_debit_amount: bigAmount.toString(10)
    }).catch(function (error) {
      return error;
    });

    if (balanceUpdateResponse.isFailure()) {
      return balanceUpdateResponse;
    }
    return responseHelper.successWithData({});

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
        web3Provider,
        oThis.chainId,
        options);

      const params = {
        transactionObject: transactionObject,
        notificationData: notificationData,
        senderAddress: airdropBudgetHolderAddress,
        senderPassphrase: airdropBudgetHolderPassphrase,
        contractAddress: oThis.brandedTokenAddress,
        gasPrice: gasPrice,
        gasLimit: gasLimitGlobalConstant.approveByBudgetHolder(),
        web3Provider: web3Provider,
        successCallback: null,
        failCallback: null,
        errorCode: "l_ci_bt_approveByBudgetHolder_1"
      };

      return helper.performSend(params, returnType);
    } catch(err) {
      let errorParams = {
        internal_error_identifier: 'l_ci_bt_approveByBudgetHolder_2',
        api_error_identifier: 'unhandled_api_error',
        error_config: errorConfig,
        debug_options: {}
      };
      logger.error('lib/contract_interact/branded_token.js:approveByBudgetHolder inside catch:', err);
      return Promise.resolve(responseHelper.error(errorParams));
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

    return oThis.pessimisticDebit(address, amount);
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
  _afterTransferSuccess: async function(senderAddress, airdropBudgetHolderAddress, amount) {
    const oThis = this
    ;

    logger.debug('_afterTransferSuccess called with params:', JSON.stringify({address: address, amount: amount}));

    //Credit the amount to the recipient.
    await oThis.creditBalance(airdropBudgetHolderAddress, amount);
    //Debit the amount to the sender.
    await oThis.debitBalance(senderAddress, amount);

    return Promise.resolve(responseHelper.successWithData({}));
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

    return oThis.pessimisticDebit(address, (basicHelper.convertToBigNumber(amount)).mul(basicHelper.convertToBigNumber(-1)));
  },

};

module.exports = BrandedToken;

