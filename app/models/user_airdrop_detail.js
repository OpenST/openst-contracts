"use strict";

const rootPrefix = '../..'
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , QueryDBKlass = require(rootPrefix + '/app/models/queryDb')
  , ModelBaseKlass = require(rootPrefix + '/app/models/base')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , BigNumber = require('bignumber.js')
;

const dbName = coreConstants.MYSQL_DATABASE
  , QueryDBObj = new QueryDBKlass(dbName)
;

const UserAirdropDetailKlass = function () {
  ModelBaseKlass.call(this, {dbName: dbName});
};

UserAirdropDetailKlass.prototype = Object.create(ModelBaseKlass.prototype);

const UserAirdropDetailKlassPrototype = {

  QueryDB: QueryDBObj,

  tableName: 'user_airdrop_details',

  /**
   * get airdrop total amount and used amount for multiple addresses
   *
   * @param {Hex} airdropId - airdrop table Id
   * @param {Array} userAddresses - user addresses
   *
   * @return {Promise} - {
   *   '0x934ebd34b2a4f16d4de16256df36a6013785557d': {totalAirdropAmount: '10000000000000000', totalAirdropUsedAmount: '10000000000000000', balanceAirdropAmount: '10000000000000000'},
   *   '0x934ebd34b2a4f16d4de16256df36a6013785557e': {totalAirdropAmount: '20000000000000000', totalAirdropUsedAmount: '20000000000000000', balanceAirdropAmount: '10000000000000000'}
   * }
   *
   */
  getByUserAddresses: async function (airdropId, userAddresses) {
    var oThis = this;
    logger.info("========user_airdrop_detail.getByUserAddresses().userAddresses=========");
    logger.info(userAddresses);
    return new Promise(async function(onResolve, onReject){
      var result = {}
        , userAirdropDetail = {}
      ;
      try{
        const userAirdropDetailResultArray = await oThis.select("user_address, sum(airdrop_amount) as total_airdrop_amount, sum(airdrop_used_amount) as total_airdrop_used_amount").
        where({airdrop_id: airdropId, user_address: userAddresses}).group_by("user_address").fire();

        for(var uad in userAirdropDetailResultArray){
          userAirdropDetail = userAirdropDetailResultArray[uad];
          var totalAirdropAmount = new BigNumber(userAirdropDetail.total_airdrop_amount)
            , totalAirdropUsedAmount = new BigNumber(userAirdropDetail.total_airdrop_used_amount)
            , balanceAirdropAmount = totalAirdropAmount.minus(totalAirdropUsedAmount)
          ;
          result[userAirdropDetail.user_address] = {
            totalAirdropAmount: totalAirdropAmount.toString(),
            totalAirdropUsedAmount: totalAirdropUsedAmount.toString(),
            balanceAirdropAmount: balanceAirdropAmount.toString()
          };
        }
        logger.info("========user_airdrop_detail.getByUserAddresses().result=========");
        logger.info(result);
        return onResolve(responseHelper.successWithData(result)) ;
      } catch(error){
        return onResolve(responseHelper.error('a_m_uad_1', 'error:'+error));
      }
    });

  },

  updateAirdropUsedAmount: function(userAddress, airdropAmountUsed){
    // const userAirdropDetailResult = await oThis.select("id, airdrop_amount, airdrop_used_amount").
    //   where("airdrop_amount > airdrop_used_amount").fire();
    // if (userAirdropDetailResult.isFailure()) {
    //   return onResolve(responseHelper.error('a_m_uaua_1', 'Invalid userAddress:'+userAddress));
    // }
    // var updatedAirdropUsedAmountResult = {};
    // for (var uad in userAirdropDetailResult){
    //   amountAdjustedWithCurrentRecord = airdrop_amount - airdrop_used_amount;
    //
    //   oThis.update({airdrop_used_amount: uad.airdrop_used_amount.plus(amountAdjustedWithCurrentRecord), id: 10});
    // }
  }


};

Object.assign(UserAirdropDetailKlass.prototype, UserAirdropDetailKlassPrototype);

module.exports = UserAirdropDetailKlass;