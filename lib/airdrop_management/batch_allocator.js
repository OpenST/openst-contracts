/**
 *
 * This is a utility file which would be used for allocating amount to airdrop users.<br><br>
 *
 * @module lib/airdrop_management/batch_allocator
 *
 */

const rootPrefix = '../..'
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , airdropKlass = require(rootPrefix + '/app/models/airdrop')
  , userAirdropDetailKlass = require(rootPrefix + '/app/models/user_airdrop_detail')
  , airdropAllocationProofDetailKlass = require(rootPrefix + '/app/models/airdrop_allocation_proof_detail')
  , airdropContractInteract = require(rootPrefix + '/lib/contract_interact/airdrop')
  , airdropConstants = require(rootPrefix + '/lib/global_constant/airdrop')
  , BigNumber = require('bignumber.js')
  , helper = require(rootPrefix + '/lib/contract_interact/helper')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , userAirdropDetailCacheKlass = require(rootPrefix + '/lib/cache_management/user_airdrop_detail')
;

/**
 * Constructor to create object of batch allocator
 *
 * @constructor
 *
 * @param {Hex} airdropContractAddress - airdrop contract address
 * @param {Hex} transactionHash - airdrop transfer transactio hash
 * @param {Object} airdropUsers - {userAddress: {amount: inwei}}
 * @param {Number} chainId - chain ID
 *
 * @return {Object}
 */
const batchAllocator = module.exports = function(params) {
  logger.info("\n=========batchAllocator.params=========");
  logger.info(params);
  const oThis = this;
  oThis.airdropContractAddress = params.airdropContractAddress;
  oThis.transactionHash = params.transactionHash;
  oThis.airdropUsers = params.airdropUsers;
  oThis.chainId = params.chainId;

  // New Variables
  oThis.airdropRecord = null;
  oThis.airdropAllocationProofDetailRecord = null;
  oThis.tableFields = ['user_address', 'airdrop_id', 'airdrop_amount', 'expiry_timestamp'];
  oThis.bulkInsertData = [];
  oThis.totalInputAirdropAmount = new BigNumber(0);
  oThis.totalAmountAfterAllocatingInputAmount = new BigNumber(0);
  oThis.userAddresses = [];
};

batchAllocator.prototype = {

  /**
   * Perform batch allocation to airdrop users
   *
   * @return {Promise}
   *
   */
  perform: async function () {

    const oThis = this;

    var r = null;

    r = await oThis.validateParams();
    logger.info("\n=========batchAllocator.validateParams.result=========");
    logger.info(r);
    if(r.isFailure()) return r;

    r = await oThis.allocateAirdropAmountToUsers();
    logger.info("\n=========batchAllocator.allocateAirdropAmountToUsers.result=========");
    logger.info(r);
    return r;
  },

  /**
   * Validate params
   *
   * @return {Promise}
   *
   */
  validateParams: function(){
    const oThis = this;
    return new Promise(async function (onResolve, onReject) {

      if (!basicHelper.isAddressValid(oThis.airdropContractAddress)) {
        return onResolve(responseHelper.error('l_am_ba_vp_1', 'airdrop contract address is invalid'));
      }

      if (!basicHelper.isTxHashValid(oThis.transactionHash)) {
        return onResolve(responseHelper.error('l_am_ba_vp_2', 'transaction hash is invalid'));
      }

      var airdropModel = new airdropKlass();
      var result = await airdropModel.getByContractAddress(oThis.airdropContractAddress);
      oThis.airdropRecord = result[0];
      if (!oThis.airdropRecord){
        return onResolve(responseHelper.error('l_am_ba_vp_3', 'given airdrop record is not present in DB'));
      }
      var airdropAllocationProofDetailModel = new airdropAllocationProofDetailKlass();
      result = await airdropAllocationProofDetailModel.getByTransactionHash(oThis.transactionHash);
      oThis.airdropAllocationProofDetailRecord = result[0];
      if (!oThis.airdropAllocationProofDetailRecord){
        return onResolve(responseHelper.error('l_am_ba_vp_4', 'Invalid transactionHash. Given airdropAllocationProofDetailRecord is not present in DB'));
      }

      if (new BigNumber(oThis.airdropAllocationProofDetailRecord.airdrop_allocated_amount).toNumber() >= new BigNumber(oThis.airdropAllocationProofDetailRecord.airdrop_amount).toNumber()){
        return onResolve(responseHelper.error('l_am_ba_vp_5', 'Allocated amount is greater or equal to airdrop amount'));
      }

      if(!oThis.airdropUsers || !(typeof oThis.airdropUsers === "object")){
        return onResolve(responseHelper.error('l_am_ba_vp_6', 'Invalid airdrop users object'));
      }

      const batchSize = Object.keys(oThis.airdropUsers).length;
      if (batchSize > airdropConstants.batchSize()){
        return onResolve(responseHelper.error('l_am_ba_vp_7', 'airdrop Users Batch size should be: '+batchSize));
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
          return onResolve(responseHelper.error('l_am_ba_vp_8', 'userAddress'+ userAddress +' is invalid'));
        }

        userAirdropAmount = new BigNumber(value.airdropAmount);
        if (userAirdropAmount.isNaN() || !userAirdropAmount.isInteger()) {
          return onResolve(responseHelper.error('l_am_ba_vp_9', 'userAddress'+ userAddress +' airdrop amount is invalid'));
        }

        if (userAirdropAmount.lte(0)) {
          return onResolve(responseHelper.error('l_am_ba_vp_10', 'Airdrop amount 0 or less than 0 for user'+ userAddress +' is not allowed'));
        }

        expiryTimestamp = new BigNumber(value.expiryTimestamp);
        if (expiryTimestamp.isNaN() || !expiryTimestamp.isInteger()) {
          return onResolve(responseHelper.error('l_am_ba_vp_11', 'userAddress: '+ userAddress +' expiry Timestamp is invalid'));
        }

        oThis.totalInputAirdropAmount = oThis.totalInputAirdropAmount.plus(userAirdropAmount);
        insertData = [
          userAddress,
          oThis.airdropRecord.id,
          userAirdropAmount.toString(),
          expiryTimestamp.toNumber()
        ];
        oThis.userAddresses.push(userAddress);
        oThis.bulkInsertData.push(insertData);
      }

      // Calculate totalAmountToAllocate after adding input amount
      oThis.totalAmountAfterAllocatingInputAmount = (new BigNumber(oThis.airdropAllocationProofDetailRecord.airdrop_allocated_amount)).
      plus(oThis.totalInputAirdropAmount);
      const airdropAmountBigNumber = new BigNumber(oThis.airdropAllocationProofDetailRecord.airdrop_amount);
      if (oThis.totalAmountAfterAllocatingInputAmount.toNumber() > airdropAmountBigNumber.toNumber()){
        return onResolve(responseHelper.error('l_am_ba_vp_12', 'totalAmountAfterAllocatingInputAmount is greater than transferred airdrop amount'));
      }

      return onResolve(responseHelper.successWithData({}));

    });

  },

  /**
   * Allocate airdrop amount to users
   *
   * @return {Promise}
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
          oThis.totalAmountAfterAllocatingInputAmount.toString()
        );

        logger.info("=========allocateAirdropAmountToUsers.airdropAllocationProofDetailModel===========");
        logger.info(r);
        if(r.isFailure()) return r;
        var userAirdropDetailModel = new userAirdropDetailKlass();
        await userAirdropDetailModel.insertMultiple(oThis.tableFields, oThis.bulkInsertData).fire();
        oThis.clearCache();
        return onResolve(responseHelper.successWithData({}));

      } catch(err){
        // If it fails rollback allocated amount
        r = await airdropAllocationProofDetailModel.updateAllocatedAmount(
          oThis.airdropAllocationProofDetailRecord.id,
          (oThis.totalAmountAfterAllocatingInputAmount.minus(oThis.totalInputAirdropAmount)).toString()
        );
        logger.info("=========allocateAirdropAmountToUsers.airdropAllocationProofDetailModel===========");
        logger.info(r);
        return onResolve(responseHelper.error('l_am_ba_vp_13', 'Error:'+ err +' in inserting for transaction hash: '+oThis.transactionHash, ));
      }

    });

  },

  /**
   * Clear all users cache
   *
   * @return {nil}
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

module.exports = batchAllocator;