"use strict";

const rootPrefix = '../..'
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , QueryDBKlass = require(rootPrefix + '/app/models/queryDb')
  , ModelBaseKlass = require(rootPrefix + '/app/models/base')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
;

const dbName = coreConstants.MYSQL_DATABASE
  , QueryDBObj = new QueryDBKlass(dbName)
;

const AirdropAllocationProofDetailKlass = function () {};

AirdropAllocationProofDetailKlass.prototype = Object.create(ModelBaseKlass.prototype);

const AirdropAllocationProofDetailKlassPrototype = {

  QueryDB: QueryDBObj,

  tableName: 'airdrop_allocation_proof_details',

  getById: function (id) {
    var oThis = this;
    return oThis.QueryDB.read(oThis.tableName, [], 'id=?', [id]);
  },

  getByTransactionHash: function (transactionHash) {
    var oThis = this;
    return oThis.QueryDB.read(oThis.tableName, [], 'transaction_hash=?', transactionHash);
  },

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
        return responseHelper.error('l_aapd_cr_1', 'Error creating airdrop_allocation_proof_details record:'+err);
      }

  },

  updateAllocatedAmount: async function(id, allocatedAmount){
    const oThis = this;
    var airdropAllocationProofDetailRecord = {};
    airdropAllocationProofDetailRecord.airdrop_allocated_amount = allocatedAmount;
    try {
      await oThis.edit(
        {
          qParams: airdropAllocationProofDetailRecord,
          whereCondition: {id: id}
        }
      );
    } catch(err){
      return responseHelper.error('l_a_m_aapd_1', 'Something went wrong while updating record id:'+id);
    }

    return responseHelper.successWithData({});
  },

};

Object.assign(AirdropAllocationProofDetailKlass.prototype, AirdropAllocationProofDetailKlassPrototype);

module.exports = AirdropAllocationProofDetailKlass;