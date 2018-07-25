"use strict";

/**
 *
 * This is a utility file which would be used for allocating amount to airdrop users.<br><br>
 *
 * @module services/airdrop_management/batch_allocator
 *
 */

const BigNumber = require('bignumber.js')
;

const rootPrefix = '../..'
  , InstanceComposer = require( rootPrefix + "/instance_composer")
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , airdropConstants = require(rootPrefix + '/lib/global_constant/airdrop')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , paramErrorConfig = require(rootPrefix + '/config/param_error_config')
  , apiErrorConfig = require(rootPrefix + '/config/api_error_config')
;

const errorConfig = {
  param_error_config: paramErrorConfig,
  api_error_config: apiErrorConfig
};

require(rootPrefix + '/app/models/user_airdrop_detail');
require(rootPrefix + '/app/models/airdrop_allocation_proof_detail');
require(rootPrefix + '/lib/cache_multi_management/user_airdrop_detail');
require(rootPrefix + '/lib/cache_management/airdrop_model');

/**
 * Constructor to create object of batch allocator
 *
 * @constructor
 *
 * @param {object} params -
 * @param {string} params.airdrop_contract_address - airdrop contract address
 * @param {string} params.transaction_hash - airdrop transfer transactio hash
 * @param {object} params.airdrop_users - {userAddress: {airdropAmount: amountInWei, expiryTimestamp: 0}}
 * @param {number} params.chain_id - chain ID
 *
 * @return {object}
 */
const BatchAllocatorKlass = function(params) {
  const oThis = this;
  params = params || {};
  logger.debug("\n=========batchAllocator.params=========");
  logger.debug(params);
  oThis.airdropContractAddress = params.airdrop_contract_address;
  oThis.transactionHash = params.transaction_hash;
  oThis.airdropUsers = params.airdrop_users;
  oThis.chainId = params.chain_id;

  // New Variables
  oThis.airdropRecord = null;
  oThis.airdropAllocationProofDetailRecord = null;
  oThis.tableFields = ['user_address', 'airdrop_id', 'airdrop_amount', 'expiry_timestamp'];
  oThis.bulkInsertData = [];
  oThis.totalInputAirdropAmount = new BigNumber(0);
  oThis.totalAmountAfterAllocatingInputAmount = new BigNumber(0);
  oThis.userAddresses = [];
};

BatchAllocatorKlass.prototype = {
  /**
   * Perform batch allocation to airdrop users
   *
   * @return {promise}
   *
   */
  perform: function () {
    const oThis = this;
    
    return oThis.asyncPerform()
      .catch(function (error) {
        if (responseHelper.isCustomResult(error)) {
          return error;
        } else {
          logger.error('openst-platform::services/airdrop_management/batch_allocator.js::perform::catch');
          logger.error(error);
    
          return responseHelper.error({
            internal_error_identifier: 's_am_ba_perform_1',
            api_error_identifier: 'unhandled_api_error',
            error_config: basicHelper.fetchErrorConfig(),
            debug_options: {err: error}
          });
        }
      });
  },
  /**
   * Async Perform
   *
   * @return {promise<result>}
   */
  asyncPerform: async function () {

    const oThis = this;
    var r = null;
    r = await oThis.validateParams();
    logger.debug("\n=========batchAllocator.validateParams.result=========");
    logger.debug(r);
    if(r.isFailure()) return r;
  
    r = await oThis.allocateAirdropAmountToUsers();
    logger.debug("\n=========batchAllocator.allocateAirdropAmountToUsers.result=========");
    logger.debug(r);
    return r;
  },

  /**
   * Validate params
   *
   * @return {promise<result>}
   *
   */
  validateParams: function() {

    const oThis = this
      , airdropAllocationProofDetailKlass = oThis.ic().getAirdropAllocationProofDetailModelKlass()
      , AirdropModelCacheKlass = oThis.ic().getCacheManagementAirdropModelClass()
    ;

    return new Promise(async function (onResolve, onReject) {

      if (!basicHelper.isAddressValid(oThis.airdropContractAddress)) {
        let errorParams = {
          internal_error_identifier: 's_am_ba_validateParams_1',
          api_error_identifier: 'invalid_api_params',
          error_config: errorConfig,
          params_error_identifiers: ['airdrop_contract_address_invalid'],
          debug_options: {}
        };
        return onResolve(responseHelper.paramValidationError(errorParams));
      }

      if (!basicHelper.isTxHashValid(oThis.transactionHash)) {
        let errorParams = {
          internal_error_identifier: 's_am_ba_validateParams_2',
          api_error_identifier: 'invalid_api_params',
          error_config: errorConfig,
          params_error_identifiers: ['invalid_transaction_hash'],
          debug_options: {}
        };
        return onResolve(responseHelper.paramValidationError(errorParams));
      }

      // Check if airdropContractAddress is registered or not
      const airdropModelCacheObject = new AirdropModelCacheKlass({useObject: true, contractAddress: oThis.airdropContractAddress})
        , airdropModelCacheResponse = await airdropModelCacheObject.fetch()
      ;
      oThis.airdropRecord = airdropModelCacheResponse.data[oThis.airdropContractAddress];
      if (!oThis.airdropRecord) {
        let errorParams = {
          internal_error_identifier: 's_am_ba_validateParams_3',
          api_error_identifier: 'db_get_failed',
          error_config: errorConfig,
          debug_options: {}
        };
        return onResolve(responseHelper.error(errorParams));
      }
      var airdropAllocationProofDetailModel = new airdropAllocationProofDetailKlass();
      const result = await airdropAllocationProofDetailModel.getByTransactionHash(oThis.transactionHash);
      oThis.airdropAllocationProofDetailRecord = result[0];
      if (!oThis.airdropAllocationProofDetailRecord) {
        let errorParams = {
          internal_error_identifier: 's_am_ba_validateParams_4',
          api_error_identifier: 'db_get_failed',
          error_config: errorConfig,
          debug_options: {}
        };
        logger.error('%Error - Invalid transactionHash. Given airdropAllocationProofDetailRecord is not present in DB')
        return onResolve(responseHelper.error(errorParams));
      }

      if (new BigNumber(oThis.airdropAllocationProofDetailRecord.airdrop_allocated_amount).gte(new BigNumber(oThis.airdropAllocationProofDetailRecord.airdrop_amount))) {
        let errorParams = {
          internal_error_identifier: 's_am_ba_validateParams_5',
          api_error_identifier: 'invalid_amount',
          error_config: errorConfig,
          debug_options: {}
        };
        return onResolve(responseHelper.error(errorParams));
      }

      if(!oThis.airdropUsers || !(typeof oThis.airdropUsers === "object")) {
        let errorParams = {
          internal_error_identifier: 's_am_ba_validateParams_6',
          api_error_identifier: 'invalid_object',
          error_config: errorConfig,
          debug_options: {}
        };
        return onResolve(responseHelper.error(errorParams));
      }

      const batchSize = Object.keys(oThis.airdropUsers).length;
      if (batchSize > airdropConstants.batchSize()) {
        let errorParams = {
          internal_error_identifier: 's_am_ba_validateParams_7',
          api_error_identifier: 'airdrop_batch_size_exceeded',
          error_config: errorConfig,
          debug_options: { batchSize: batchSize }
        };
        return onResolve(responseHelper.error(errorParams));
      }

      var value = null
        , userAddress = ''
        , userAirdropAmount = 0
        , expiryTimestamp = 0
        , insertData = []
      ;
      for (var userAddress in oThis.airdropUsers) {
        value = oThis.airdropUsers[userAddress];

        if (!basicHelper.isAddressValid(userAddress)) {
          let errorParams = {
            internal_error_identifier: 's_am_ba_validateParams_8',
            api_error_identifier: 'invalid_api_params',
            error_config: errorConfig,
            params_error_identifiers: ['invalid_user_address'],
            debug_options: { userAddress: userAddress }
          };
          return onResolve(responseHelper.paramValidationError(errorParams));
        }

        userAirdropAmount = new BigNumber(value.airdropAmount);
        if (userAirdropAmount.isNaN() || !userAirdropAmount.isInteger()) {
          let errorParams = {
            internal_error_identifier: 's_am_ba_validateParams_9',
            api_error_identifier: 'invalid_api_params',
            error_config: errorConfig,
            params_error_identifiers: ['airdrop_amount_invalid'],
            debug_options: { userAddress: userAddress }
          };
          return onResolve(responseHelper.paramValidationError(errorParams));
        }

        if (userAirdropAmount.lte(0)) {
          let errorParams = {
            internal_error_identifier: 's_am_ba_validateParams_10',
            api_error_identifier: 'invalid_api_params',
            error_config: errorConfig,
            params_error_identifiers: ['airdrop_amount_invalid'],
            debug_options: { userAddress: userAddress }
          };
          return onResolve(responseHelper.paramValidationError(errorParams));
        }

        expiryTimestamp = new BigNumber(value.expiryTimestamp);
        if (expiryTimestamp.isNaN() || !expiryTimestamp.isInteger()) {
          let errorParams = {
            internal_error_identifier: 's_am_ba_validateParams_11',
            api_error_identifier: 'timestamp_invalid',
            error_config: errorConfig,
            debug_options: { userAddress: userAddress }
          };
          return onResolve(responseHelper.error(errorParams));
        }

        oThis.totalInputAirdropAmount = oThis.totalInputAirdropAmount.plus(userAirdropAmount);
        insertData = [
          userAddress,
          oThis.airdropRecord.id,
          userAirdropAmount.toString(10),
          expiryTimestamp.toNumber()
        ];
        oThis.userAddresses.push(userAddress);
        oThis.bulkInsertData.push(insertData);
      }

      // Calculate totalAmountToAllocate after adding input amount
      oThis.totalAmountAfterAllocatingInputAmount = (new BigNumber(oThis.airdropAllocationProofDetailRecord.airdrop_allocated_amount)).
        plus(oThis.totalInputAirdropAmount);
      const airdropAmountBigNumber = new BigNumber(oThis.airdropAllocationProofDetailRecord.airdrop_amount);      
      if (oThis.totalAmountAfterAllocatingInputAmount.gt(airdropAmountBigNumber)) {
        let errorParams = {
          internal_error_identifier: 's_am_ba_validateParams_12',
          api_error_identifier: 'invalid_amount',
          error_config: errorConfig,
          debug_options: {}
        };
        return onResolve(responseHelper.error(errorParams));
      }

      if (!basicHelper.isValidChainId(oThis.chainId)) {
        let errorParams = {
          internal_error_identifier: 's_am_ba_validateParams_14',
          api_error_identifier: 'invalid_api_params',
          error_config: errorConfig,
          params_error_identifiers: ['invalid_chain_id'],
          debug_options: {}
        };
        return onResolve(responseHelper.paramValidationError(errorParams));
      }

      return onResolve(responseHelper.successWithData({}));

    });

  },

  /**
   * Allocate airdrop amount to users
   *
   * @return {promise<result>}
   *
   */
  allocateAirdropAmountToUsers: async function() {

    const oThis = this
      , userAirdropDetailKlass = oThis.ic().getUserAirdropDetailModelClass()
      , airdropAllocationProofDetailKlass = oThis.ic().getAirdropAllocationProofDetailModelKlass()
    ;

    return new Promise(async function (onResolve, onReject) {
      try {
        // Allocate and update Amount in db
        var airdropAllocationProofDetailModel = new airdropAllocationProofDetailKlass();
        var r = await airdropAllocationProofDetailModel.updateAllocatedAmount(
          oThis.airdropAllocationProofDetailRecord.id,
          oThis.totalAmountAfterAllocatingInputAmount.toString(10)
        );

        logger.debug("=========allocateAirdropAmountToUsers.airdropAllocationProofDetailModel===========");
        logger.debug(r);
        if(r.isFailure()) return r;
        var userAirdropDetailModel = new userAirdropDetailKlass();
        await userAirdropDetailModel.insertMultiple(oThis.tableFields, oThis.bulkInsertData).fire();
        oThis.clearCache();
        return onResolve(responseHelper.successWithData({}));

      } catch(err){
        // If it fails rollback allocated amount
        r = await airdropAllocationProofDetailModel.updateAllocatedAmount(
          oThis.airdropAllocationProofDetailRecord.id,
          (oThis.totalAmountAfterAllocatingInputAmount.minus(oThis.totalInputAirdropAmount)).toString(10)
        );
        logger.debug("=========allocateAirdropAmountToUsers.airdropAllocationProofDetailModel===========");
        logger.debug(r);

        let errorParams = {
          internal_error_identifier: 's_am_ba_allocate_1',
          api_error_identifier: 'unhandled_api_error',
          error_config: errorConfig,
          debug_options: { err: err, transactionHash: oThis.transactionHash }
        };
        return onResolve(responseHelper.error(errorParams));
      }

    });

  },

  /**
   *
   * Clear all users cache
   *
   */
  clearCache: async function() {

    const oThis = this
      , userAirdropDetailCacheKlass = oThis.ic().getMultiCacheManagementUserAirdropDetailKlass()
    ;

    const userAirdropDetailCacheKlassObject = new userAirdropDetailCacheKlass({
      chainId: oThis.chainId,
      airdropId: oThis.airdropRecord.id,
      userAddresses: oThis.userAddresses
    });
    await userAirdropDetailCacheKlassObject.clear();
  }

};

InstanceComposer.registerShadowableClass(BatchAllocatorKlass, 'getAirdropBatchAllocatorClass');

module.exports = BatchAllocatorKlass;