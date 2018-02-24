/**
 *
 * This is a utility file which would be used for allocating amount to airdrop users.<br><br>
 *
 * @module lib/airdrop_management/batch_allocator
 *
 */

// TODO Bulk Insert
const rootPrefix = '../..'
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , airdropKlass = require(rootPrefix + '/app/models/airdrop')
  , airdropModel = new airdropKlass()
  , userAirdropDetailKlass = require(rootPrefix + '/app/models/user_airdrop_detail')
  , userAirdropDetailModel = new userAirdropDetailKlass()
  , airdropAllocationProofDetailKlass = require(rootPrefix + '/app/models/airdrop_allocation_proof_detail')
  , airdropAllocationProofDetailModel = new airdropAllocationProofDetailKlass()
  , airdropContractInteract = require(rootPrefix + '/lib/contract_interact/airdrop')
  , airdropConstants = require(rootPrefix + '/lib/global_constant/airdrop')
  , BigNumber = require('bignumber.js')
  , helper = require(rootPrefix + '/lib/contract_interact/helper')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
  , logger = require(rootPrefix + '/helpers/custom_console_logger');
;

/**
 * Constructor to create object of batch allocator
 *
 * @constructor
 *
 * @param {Hex} airdropContractAddress - airdrop contract address
 * @param {Hex} transactionHash - airdrop transfer transactio hash
 * @param {Object} airdropUsers - {userAddress: {amount: inwei}}
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

  // New Variables
  oThis.airdropRecord = null;
  oThis.airdropAllocationProofDetailRecord = null;
  oThis.tableFields = ['user_address', 'airdrop_id', 'total_airdrop_amount', 'expiry_timestamp'];
  oThis.bulkInsertData = [];
  oThis.totalInputAirdropAmount = new BigNumber(0);
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

    r = oThis.allocateAirdropAmountToUsers();
    logger.info("\n=========batchAllocator.allocateAirdropAmountToUsers.result=========");
    logger.info(r);

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

      var result = await airdropModel.getByContractAddress(oThis.airdropContractAddress);
      oThis.airdropRecord = result[0];
      if (!oThis.airdropRecord){
        return onResolve(responseHelper.error('l_am_ba_vp_3', 'given airdrop record is not present in DB'));
      }

      result = await airdropAllocationProofDetailModel.getByTransactionHash(oThis.airdropContractAddress);
      oThis.airdropAllocationProofRecord = result[0];
      if (!oThis.airdropAllocationProofRecord){
        return onResolve(responseHelper.error('l_am_ba_vp_4', 'Invalid transactionHash. Given airdropAllocationProofRecord is not present in DB'));
      }

      if (oThis.airdropAllocationProofRecord['airdrop_allocated_amount'] >= oThis.airdropAllocationProofRecord['airdrop_amount']){
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
      for (var key in oThis.airdropUsers) {
        value = oThis.airdropUsers[key];
        userAddress = value.userAddress;

        if (!basicHelper.isAddressValid(userAddress)) {
          return onResolve(responseHelper.error('l_am_ba_vp_8', 'userAddress'+ userAddress +' is invalid'));
        }

        userAirdropAmount = new BigNumber(value.airdropAmount);
        if (userAirdropAmount.isNaN() || !userAirdropAmount.isInteger()) {
          return onResolve(responseHelper.error('l_am_ba_vp_9', 'userAddress'+ userAddress +' airdrop amount is invalid'));
        }

        expiryTimestamp = new BigNumber(value.expiryTimestamp);
        if (expiryTimestamp.isNaN() || !expiryTimestamp.isInteger()) {
          return onResolve(responseHelper.error('l_am_ba_vp_10', 'userAddress'+ userAddress +' expiry Timestamp is invalid'));
        }

        oThis.totalInputAirdropAmount = oThis.totalInputAirdropAmount.plus(userAirdropAmount);
        insertData = [
          userAddress,
          oThis.airdropRecord['id'],
          userAirdropAmount.toString(),
          expiryTimestamp.toString()
        ];

        oThis.bulkInsertData.push(insertData);
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

      const totalAmountToAllocate = (new BigNumber(oThis.airdropAllocationProofDetailRecord['allocated_amount'])).plus(oThis.totalInputAirdropAmount);
      // Allocate Amount
      var r = await oThis.addAndValidateAllocatedAmount();
      if(r.isFailure()) return r;

      try {
        await userAirdropDetailModel.bulkInsert(oThis.tableFields, oThis.bulkInsertData);
        return onResolve(responseHelper.successWithData({}));
      } catch(err){
        // If it fails rollback allocated amount
        await airdropAllocationProofDetailModel.updateAllocatedAmount(oThis.airdropAllocationProofDetailRecord['id'],
          (totalAmountToAllocate.minus(oThis.totalInputAirdropAmount)).toString());
        return onResolve(responseHelper.error('l_am_ba_vp_12', 'Error bulk inserting for transaction hash: '+oThis.transactionHash));
      }

    });

  },

  /**
   * Add allocated amount to Db and check if it goes greater than airdrop amount
   *
   * @return {Promise}
   *
   */
  addAndValidateAllocatedAmount: async function(){
    const oThis = this;

    return new Promise(async function (onResolve, onReject) {
      await airdropAllocationProofDetailModel.updateAllocatedAmount(oThis.airdropAllocationProofDetailRecord['id'],
        oThis.totalInputAirdropAmount.toString());

      var result = await airdropAllocationProofDetailModel.getById(oThis.airdropAllocationProofDetailRecord['id']);
      oThis.airdropAllocationProofDetailRecord = result[0];
      // Check if allocated is greater than airdrop_amount after adding allocated amount
      if (oThis.airdropAllocationProofDetailRecord['allocated_amount'] > oThis.airdropAllocationProofDetailRecord['airdrop_amount']) {
        return onResolve(responseHelper.error('l_am_ba_vp_11', 'allocated_amount is greater than airdrop amount for id: ' + oThis.airdropAllocationProofDetailRecord['id']));
      }
      return onResolve(responseHelper.successWithData({}));
    });
  }

};

module.exports = batchAllocator;