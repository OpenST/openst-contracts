"use strict";
/**
 *
 * This is a model file which would be used querying airdrop_allocation_proof_details model.<br><br>
 *
 * @module app/models/airdrop_allocation_proof_detail
 *
 */
const rootPrefix = '../..'
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , QueryDBKlass = require(rootPrefix + '/app/models/queryDb')
  , ModelBaseKlass = require(rootPrefix + '/app/models/base')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , paramErrorConfig = require(rootPrefix + '/config/param_error_config')
  , apiErrorConfig = require(rootPrefix + '/config/api_error_config')
;

const errorConfig = {
  param_error_config: paramErrorConfig,
  api_error_config: apiErrorConfig
};

const dbName = coreConstants.MYSQL_DATABASE
  , QueryDBObj = new QueryDBKlass(dbName)
;

const AirdropAllocationProofDetailKlass = function () {
  ModelBaseKlass.call(this, {dbName: dbName});
};

AirdropAllocationProofDetailKlass.prototype = Object.create(ModelBaseKlass.prototype);

const AirdropAllocationProofDetailKlassPrototype = {

  QueryDB: QueryDBObj,

  tableName: 'airdrop_allocation_proof_details',

  /**
   * get data by transaction hash
   *
   * @param {Hex} transactionHash - airdrop transfer transaction hash
   *
   * @return {Promise}
   *
   */
  getByTransactionHash: function (transactionHash) {
    var oThis = this;
    return oThis.select().where(["transaction_hash=?", transactionHash]).fire();
  },

  /**
   * Create Table record during transfer airdrop amount to airdropBudgetHolder
   *
   * @param {Hex} transactionHash - airdrop transfer transaction hash
   * @param {string} airdropAmount - airdropAmount in Wei
   * @param {String} airdropAllocatedAmount - airdropAllocatedAmount in Wei
   *
   * @return {Promise}
   *
   */
  createRecord: async function(transactionHash, airdropAmount, airdropAllocatedAmount=0) {
    var oThis = this;
      try {
        const insertedRecord = await oThis.create({
          transaction_hash: transactionHash,
          airdrop_amount: airdropAmount,
          airdrop_allocated_amount: airdropAllocatedAmount
        });
        return responseHelper.successWithData({response: insertedRecord});
      } catch(err){
        let errorParams = {
          internal_error_identifier: 'l_aapd_cr_1',
          api_error_identifier: 'entry_creation_failed',
          error_config: errorConfig,
          debug_options: {}
        };
        logger.error(err);
        return responseHelper.error(errorParams);
      }

  },

  /**
   * Update Allocated Amount
   *
   * @param {Integer} id - table id
   * @param {string} allocatedAmount - allocatedAmount in Wei
   *
   * @return {Promise}
   *
   */
  updateAllocatedAmount: async function(id, allocatedAmount){
    const oThis = this
    ;

    try {
      await oThis.update({airdrop_allocated_amount: allocatedAmount}).where(["id=?", id]).fire();
      return responseHelper.successWithData({});
    } catch(err){
      let errorParams = {
        internal_error_identifier: 'l_a_m_aapd_1',
        api_error_identifier: 'entry_updation_failed',
        error_config: errorConfig,
        debug_options: {}
      };
      logger.error(err);
      return responseHelper.error(errorParams);
    }
  },

};

Object.assign(AirdropAllocationProofDetailKlass.prototype, AirdropAllocationProofDetailKlassPrototype);

module.exports = AirdropAllocationProofDetailKlass;