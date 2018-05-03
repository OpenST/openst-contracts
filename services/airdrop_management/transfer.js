"use strict";

/**
 *
 * This is a utility file which would be used for executing transfer amount to airdrop budget holder.<br><br>
 *
 * @module services/airdrop_management/transfer
 *
 */

const rootPrefix = '../..'
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , airdropAllocationProofDetailKlass = require(rootPrefix + '/app/models/airdrop_allocation_proof_detail')
  , airdropContractInteract = require(rootPrefix + '/lib/contract_interact/airdrop')
  , brandedTokenContractInteract = require(rootPrefix + '/lib/contract_interact/branded_token')
  , BigNumber = require('bignumber.js')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , AirdropModelCacheKlass = require(rootPrefix + '/lib/cache_management/airdrop_model')
  , BrandedTokenKlass = require(rootPrefix + '/lib/contract_interact/branded_token')
  , paramErrorConfig = require(rootPrefix + '/config/param_error_config')
  , apiErrorConfig = require(rootPrefix + '/config/api_error_config')
;

const errorConfig = {
  param_error_config: paramErrorConfig,
  api_error_config: apiErrorConfig
};

/**
 * Constructor to create object of transfer
 *
 * @constructor
 *
 * @params {object} - params
 * @param {string} sender_address - sender address
 * @param {string} sender_passphrase - sender Passphrase
 * @param {string} airdrop_contract_address - airdrop contract address
 * @param {string} amount - amount in wei
 * @param {string} gas_price - gas price
 * @param {number} chain_id - chain Id
 * @param {object} options - options
 *
 * @return {object}
 *
 */
const TransferKlass = function(params) {
  const oThis = this;
  params = params || {};
  logger.debug("\n=========Transfer params=========");
  // Don't log passphrase
  logger.debug(params.sender_address, params.airdrop_contract_address, params.amount, params.gas_price, params.chain_id, params.options);

  oThis.senderAddress = params.sender_address;
  oThis.senderPassphrase = params.sender_passphrase;
  oThis.airdropContractAddress = params.airdrop_contract_address;
  oThis.amount = params.amount;
  oThis.gasPrice = params.gas_price;
  oThis.chainId = params.chain_id;
  oThis.options = params.options;
  oThis.airdropBudgetHolder = null;
  oThis.brandedTokenContractAddress = null;

};

TransferKlass.prototype = {

  /**
   * Perform method
   *
   * @return {promise<result>}
   *
   */
  perform: async function () {

    const oThis = this;

    try {
      var r = null;

      r = await oThis.validateParams();
      logger.debug("\n=========Transfer.validateParams.result=========");
      logger.debug(r);
      if(r.isFailure()) return r;

      r = oThis.doTransfer();
      logger.debug("\n=========Transfer.doTransfer.result=========");
      logger.debug(r);
      return r;
    } catch(err) {
      let errorParams = {
        internal_error_identifier: 's_am_t_perform_1',
        api_error_identifier: 'unhandled_api_error',
        error_config: errorConfig,
        debug_options: {}
      };
      logger.error(err.message);
      return responseHelper.error(errorParams);
    }

  },

  /**
   * validation of params
   *
   * @return {promise<result>}
   *
   */
  validateParams: function() {
    const oThis = this;
    return new Promise(async function (onResolve, onReject) {

      if (!basicHelper.isAddressValid(oThis.senderAddress)) {
        let errorParams = {
          internal_error_identifier: 's_am_t_validateParams_1',
          api_error_identifier: 'invalid_api_params',
          error_config: errorConfig,
          params_error_identifiers: ['invalid_sender_address'],
          debug_options: {}
        };
        return onResolve(responseHelper.paramValidationError(errorParams));
      }

      if (!basicHelper.isAddressValid(oThis.airdropContractAddress)) {
        let errorParams = {
          internal_error_identifier: 's_am_t_validateParams_2',
          api_error_identifier: 'invalid_api_params',
          error_config: errorConfig,
          params_error_identifiers: ['airdrop_contract_address_invalid'],
          debug_options: {}
        };
        return onResolve(responseHelper.paramValidationError(errorParams));
      }

      // Check if airdropContractAddress is registered or not

      const airdropModelCacheObject = new AirdropModelCacheKlass({useObject: true, contractAddress: oThis.airdropContractAddress})
        , airdropModelCacheResponse = await airdropModelCacheObject.fetch()
      ;
      oThis.airdropRecord = airdropModelCacheResponse.data[oThis.airdropContractAddress];
      if (!oThis.airdropRecord){
        let errorParams = {
          internal_error_identifier: 's_am_t_validateParams_3',
          api_error_identifier: 'invalid_api_params',
          error_config: errorConfig,
          params_error_identifiers: ['airdrop_contract_address_invalid'],
          debug_options: {}
        };
        return onResolve(responseHelper.paramValidationError(errorParams));
      }

      const airdropContractInteractObject = new airdropContractInteract(oThis.airdropContractAddress, oThis.chainId);
      var result = await airdropContractInteractObject.brandedToken();
      oThis.brandedTokenContractAddress = result.data.brandedToken;
      logger.debug("\n==========transfer.validateParams.brandedToken===========");
      logger.debug("\nairdropContractInteractObject.brandedToken():", result,"\noThis.brandedTokenContractAddress:", oThis.brandedTokenContractAddress);
      if (!basicHelper.isAddressValid(oThis.brandedTokenContractAddress)) {
        let errorParams = {
          internal_error_identifier: 's_am_t_validateParams_4',
          api_error_identifier: 'invalid_api_params',
          error_config: errorConfig,
          params_error_identifiers: ['branded_token_address_invalid'],
          debug_options: {}
        };
        return onResolve(responseHelper.paramValidationError(errorParams));
      }

      result = await airdropContractInteractObject.airdropBudgetHolder();
      oThis.airdropBudgetHolderAddress = result.data.airdropBudgetHolder;
      if (!basicHelper.isAddressValid(oThis.brandedTokenContractAddress)) {
        let errorParams = {
          internal_error_identifier: 's_am_t_validateParams_5',
          api_error_identifier: 'invalid_api_params',
          error_config: errorConfig,
          params_error_identifiers: ['airdrop_budget_holder_invalid'],
          debug_options: {}
        };
        return onResolve(responseHelper.paramValidationError(errorParams));
      }

      const amountInBigNumber = new BigNumber(oThis.amount);
      if (amountInBigNumber.isNaN() || !amountInBigNumber.isInteger()){
        let errorParams = {
          internal_error_identifier: 's_am_t_validateParams_6',
          api_error_identifier: 'invalid_api_params',
          error_config: errorConfig,
          params_error_identifiers: ['invalid_amount'],
          debug_options: {}
        };
        return onResolve(responseHelper.paramValidationError(errorParams));
      }

      if (!basicHelper.isValidChainId(oThis.chainId)) {
        let errorParams = {
          internal_error_identifier: 's_am_t_validateParams_7',
          api_error_identifier: 'invalid_api_params',
          error_config: errorConfig,
          params_error_identifiers: ['chain_id_invalid'],
          debug_options: {}
        };
        return onResolve(responseHelper.paramValidationError(errorParams));
      }

      const brandedTokenObject = new BrandedTokenKlass(oThis.brandedTokenContractAddress, oThis.chainId);
      const senderBalanceResponse = await brandedTokenObject.getBalanceOf(oThis.senderAddress);

      if (senderBalanceResponse.isFailure()) {
        let errorParams = {
          internal_error_identifier: 's_am_t_validateParams_8',
          api_error_identifier: 'get_balance_failed',
          error_config: errorConfig,
          debug_options: {}
        };
        return onResolve(responseHelper.error(errorParams));
      }

      const senderBalance = new BigNumber(senderBalanceResponse.data.balance);
      //logger.debug("senderBalance: "+senderBalance.toString(10), "amount to transfer: "+amountInBigNumber);
      if (senderBalance.lt(amountInBigNumber)){
        let errorParams = {
          internal_error_identifier: 's_am_t_validateParams_9',
          api_error_identifier: 'insufficient_funds',
          error_config: errorConfig,
          debug_options: {}
        };
        return onResolve(responseHelper.error(errorParams));
      }

      if (!oThis.gasPrice) {
        let errorParams = {
          internal_error_identifier: 's_am_t_validateParams_10',
          api_error_identifier: 'invalid_api_params',
          error_config: errorConfig,
          params_error_identifiers: ['gas_price_invalid'],
          debug_options: {}
        };
        return onResolve(responseHelper.paramValidationError(errorParams));
      }

      if (!basicHelper.isValidChainId(oThis.chainId)) {
        let errorParams = {
          internal_error_identifier: 's_am_t_validateParams_11',
          api_error_identifier: 'invalid_api_params',
          error_config: errorConfig,
          params_error_identifiers: ['chain_id_invalid'],
          debug_options: {}
        };
        return onResolve(responseHelper.paramValidationError(errorParams));
      }

      return onResolve(responseHelper.successWithData({}));

    });

  },

  /**
   * Transfer amount to airdrop budget holder
   *
   * @return {promise<result>}
   *
   */
  doTransfer: async function() {
    const oThis = this;

    return new Promise(async function (onResolve, onReject) {
      // BrandedToken transfer
      logger.debug("\n==========doTransfer.oThis.brandedTokenContractAddress===========");
      logger.debug(oThis.brandedTokenContractAddress);
      var brandedTokenObject = new brandedTokenContractInteract(oThis.brandedTokenContractAddress, oThis.chainId);
      const transactionResponse = await brandedTokenObject.transferToAirdropBudgetHolder(oThis.senderAddress,
        oThis.senderPassphrase,
        oThis.airdropBudgetHolderAddress,
        oThis.amount,
        oThis.gasPrice,
        oThis.options);
      if (transactionResponse.isSuccess()){
        var airdropAllocationProofDetailModel = new airdropAllocationProofDetailKlass();
        const airdropAllocationProofDetailCreateResult = await airdropAllocationProofDetailModel.createRecord(transactionResponse.data.transaction_hash, oThis.amount, 0);
        if (airdropAllocationProofDetailCreateResult.isFailure()) {
          return onResolve(airdropAllocationProofDetailCreateResult);
        }
      }
      return onResolve(transactionResponse);
    });
  }

};

module.exports = TransferKlass;

