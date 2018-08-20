'use strict';
/**
 *
 * This is a model file which would be used querying airdrop_allocation_proof_details model.<br><br>
 *
 * @module app/models/airdrop_allocation_proof_detail
 *
 */
const rootPrefix = '../..',
  InstanceComposer = require(rootPrefix + '/instance_composer'),
  ModelBaseKlass = require(rootPrefix + '/app/models/base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  paramErrorConfig = require(rootPrefix + '/config/param_error_config'),
  apiErrorConfig = require(rootPrefix + '/config/api_error_config');

require(rootPrefix + '/config/core_constants');

const errorConfig = {
  param_error_config: paramErrorConfig,
  api_error_config: apiErrorConfig
};

const AirdropAllocationProofDetailKlass = function() {
  const oThis = this,
    coreConstants = oThis.ic().getCoreConstants();

  ModelBaseKlass.call(this, { dbName: coreConstants.MYSQL_DATABASE });
};

AirdropAllocationProofDetailKlass.prototype = Object.create(ModelBaseKlass.prototype);

const AirdropAllocationProofDetailKlassPrototype = {
  tableName: 'airdrop_allocation_proof_details',

  /**
   * get data by transaction hash
   *
   * @param {Hex} transactionHash - airdrop transfer transaction hash
   *
   * @return {Promise}
   *
   */
  getByTransactionHash: function(transactionHash) {

    const oThis = this
      , coreConstants = oThis.ic().getCoreConstants()
    ;

    return oThis
      .select()
      .where(['transaction_hash=? AND chain_id=?', transactionHash, coreConstants.OST_UTILITY_CHAIN_ID])
      .fire();

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
  createRecord: async function(transactionHash, airdropAmount, airdropAllocatedAmount = 0) {

    const oThis = this
      , coreConstants = oThis.ic().getCoreConstants()
    ;

    try {
      const insertedRecord = await oThis
        .insert({
          transaction_hash: transactionHash,
          airdrop_amount: airdropAmount,
          airdrop_allocated_amount: airdropAllocatedAmount,
          chain_id: coreConstants.OST_UTILITY_CHAIN_ID
        })
        .fire();
      return responseHelper.successWithData({ response: insertedRecord });
    } catch (err) {
      let errorParams = {
        internal_error_identifier: 'l_aapd_cr_1',
        api_error_identifier: 'entry_creation_failed',
        error_config: errorConfig,
        debug_options: { err: err }
      };
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
  updateAllocatedAmount: async function(id, allocatedAmount) {
    const oThis = this;

    try {
      await oThis
        .update({ airdrop_allocated_amount: allocatedAmount })
        .where(['id=?', id])
        .fire();
      return responseHelper.successWithData({});
    } catch (err) {
      let errorParams = {
        internal_error_identifier: 'l_a_m_aapd_1',
        api_error_identifier: 'entry_updation_failed',
        error_config: errorConfig,
        debug_options: { err: err }
      };
      return responseHelper.error(errorParams);
    }
  }
};

Object.assign(AirdropAllocationProofDetailKlass.prototype, AirdropAllocationProofDetailKlassPrototype);

InstanceComposer.registerShadowableClass(
  AirdropAllocationProofDetailKlass,
  'getAirdropAllocationProofDetailModelKlass'
);

module.exports = AirdropAllocationProofDetailKlass;
