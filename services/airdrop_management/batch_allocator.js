"use strict";

/**
 *
 * This is a utility file which would be used for allocating amount to airdrop users.<br><br>
 *
 * @module services/airdrop_management/batch_allocator
 *
 */

const rootPrefix = '../..'
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , userAirdropDetailKlass = require(rootPrefix + '/app/models/user_airdrop_detail')
  , airdropAllocationProofDetailKlass = require(rootPrefix + '/app/models/airdrop_allocation_proof_detail')
  , airdropConstants = require(rootPrefix + '/lib/global_constant/airdrop')
  , BigNumber = require('bignumber.js')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , userAirdropDetailCacheKlass = require(rootPrefix + '/lib/cache_multi_management/user_airdrop_detail')
  , AirdropModelCacheKlass = require(rootPrefix + '/lib/cache_management/airdrop_model')
;

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
   * @return {promise<result>}
   *
   */
  perform: async function () {

    const oThis = this;

    try {

      var r = null;

      r = await oThis.validateParams();
      logger.debug("\n=========batchAllocator.validateParams.result=========");
      logger.debug(r);
      if(r.isFailure()) return r;

      r = await oThis.allocateAirdropAmountToUsers();
      logger.debug("\n=========batchAllocator.allocateAirdropAmountToUsers.result=========");
      logger.debug(r);
      return r;

    } catch(err){
      return responseHelper.error('s_am_ba_perform_1', 'Something went wrong. ' + err.message)
    }
  },

  /**
   * Validate params
   *
   * @return {promise<result>}
   *
   */
  validateParams: function() {
    const oThis = this;
    return new Promise(async function (onResolve, onReject) {

      if (!basicHelper.isAddressValid(oThis.airdropContractAddress)) {
        return onResolve(responseHelper.error('s_am_ba_validateParams_1', 'airdrop contract address is invalid'));
      }

      if (!basicHelper.isTxHashValid(oThis.transactionHash)) {
        return onResolve(responseHelper.error('s_am_ba_validateParams_2', 'transaction hash is invalid'));
      }

      // Check if airdropContractAddress is registered or not
      const airdropModelCacheObject = new AirdropModelCacheKlass({useObject: true, contractAddress: oThis.airdropContractAddress})
        , airdropModelCacheResponse = await airdropModelCacheObject.fetch()
      ;
      oThis.airdropRecord = airdropModelCacheResponse.data[oThis.airdropContractAddress];
      if (!oThis.airdropRecord) {
        return onResolve(responseHelper.error('s_am_ba_validateParams_3', 'given airdrop record is not present in DB'));
      }
      var airdropAllocationProofDetailModel = new airdropAllocationProofDetailKlass();
      const result = await airdropAllocationProofDetailModel.getByTransactionHash(oThis.transactionHash);
      oThis.airdropAllocationProofDetailRecord = result[0];
      if (!oThis.airdropAllocationProofDetailRecord) {
        return onResolve(responseHelper.error('s_am_ba_validateParams_4', 'Invalid transactionHash. Given airdropAllocationProofDetailRecord is not present in DB'));
      }

      if (new BigNumber(oThis.airdropAllocationProofDetailRecord.airdrop_allocated_amount).gte(new BigNumber(oThis.airdropAllocationProofDetailRecord.airdrop_amount))) {
        return onResolve(responseHelper.error('s_am_ba_validateParams_5', 'Allocated amount is greater or equal to airdrop amount'));
      }

      if(!oThis.airdropUsers || !(typeof oThis.airdropUsers === "object")) {
        return onResolve(responseHelper.error('s_am_ba_validateParams_6', 'Invalid airdrop users object'));
      }

      const batchSize = Object.keys(oThis.airdropUsers).length;
      if (batchSize > airdropConstants.batchSize()) {
        return onResolve(responseHelper.error('s_am_ba_validateParams_7', 'airdrop Users Batch size should be: '+batchSize));
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
          return onResolve(responseHelper.error('s_am_ba_validateParams_8', 'userAddress'+ userAddress +' is invalid'));
        }

        userAirdropAmount = new BigNumber(value.airdropAmount);
        if (userAirdropAmount.isNaN() || !userAirdropAmount.isInteger()) {
          return onResolve(responseHelper.error('s_am_ba_validateParams_9', 'userAddress'+ userAddress +' airdrop amount is invalid'));
        }

        if (userAirdropAmount.lte(0)) {
          return onResolve(responseHelper.error('s_am_ba_validateParams_10', 'Airdrop amount 0 or less than 0 for user'+ userAddress +' is not allowed'));
        }

        expiryTimestamp = new BigNumber(value.expiryTimestamp);
        if (expiryTimestamp.isNaN() || !expiryTimestamp.isInteger()) {
          return onResolve(responseHelper.error('s_am_ba_validateParams_11', 'userAddress: '+ userAddress +' expiry Timestamp is invalid'));
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
        return onResolve(responseHelper.error('s_am_ba_validateParams_12', 'totalAmountAfterAllocatingInputAmount is greater than transferred airdrop amount'));
      }

      if (!basicHelper.isValidChainId(oThis.chainId)) {
        return onResolve(responseHelper.error('s_am_ba_validateParams_14', 'ChainId is invalid'));
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
    const oThis = this;

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
        return onResolve(responseHelper.error('l_am_ba_vp_13', 'Error:'+ err +' in inserting for transaction hash: '+oThis.transactionHash, ));
      }

    });

  },

  /**
   *
   * Clear all users cache
   *
   */
  clearCache: async function() {
    const oThis = this;
    const userAirdropDetailCacheKlassObject = new userAirdropDetailCacheKlass({
      chainId: oThis.chainId,
      airdropId: oThis.airdropRecord.id,
      userAddresses: oThis.userAddresses
    });
    await userAirdropDetailCacheKlassObject.clear();
  }

};

module.exports = BatchAllocatorKlass;