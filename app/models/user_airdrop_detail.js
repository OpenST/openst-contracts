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
  , airdropKlass = require(rootPrefix + '/app/models/airdrop')
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

  /**
   * Update airdrop used amount
   *
   * @param {Hex} userAddress - user address
   * @param {String} airdropAmountUsed - wei value
   * @param {Bool} debit - true/false
   *
   * @return {Promise}
   *
   */
  updateAirdropUsedAmount: function(airdropContractAddress, userAddress, airdropAmountUsed){
    const oThis = this;
    logger.info("==========user_airdrop_detail.updateAirdropUsedAmount.params============");
    logger.info("airdropContractAddress: "+ airdropContractAddress,
      "userAddress: ", userAddress,
      "airdropAmountUsed: ", airdropAmountUsed, "\n");
    return new Promise(async function(onResolve, onReject){
      try {
        const airdropModel = new airdropKlass();
        const airdropModelResult =  await airdropModel.getByContractAddress(airdropContractAddress);
        const airdropRecord = airdropModelResult[0];
        var totalRemainingAmountToAdjust = new BigNumber(airdropAmountUsed);
        if (totalRemainingAmountToAdjust.lte(0)){
          return onResolve(responseHelper.successWithData());
        }
        if (!userAddress){
          return onResolve(responseHelper.error('uad_uaua_1', 'Invalid User Address'));
        }
        const userAirdropDetailResults = await oThis.select("id, airdrop_id, user_address, airdrop_amount, airdrop_used_amount").
        where(["airdrop_id = ? AND airdrop_amount > airdrop_used_amount AND user_address=?", airdropRecord.id, userAddress]).fire();
        logger.info("======updateAirdropUsedAmount.userAirdropDetailResults=========");
        logger.info(userAirdropDetailResults);
        // Return success if no record found
        if (!userAirdropDetailResults[0]){
          return onResolve(responseHelper.error('uad_uaua_3', 'airdrop amount not available for adjusting: '));
        }

        var amountToAdjustWithCurrentRecord = new BigNumber(0)
          , dbAmountForAdjusting = new BigNumber(0)
          , dbAirdropUsedAmount = new BigNumber(0)
          , airdropUsedAmountToUpdate = new BigNumber(0)
        ;
        for (var uadIndex in userAirdropDetailResults){
          var uad = userAirdropDetailResults[uadIndex];
          dbAmountForAdjusting = new BigNumber(uad.airdrop_amount).minus(dbAirdropUsedAmount);
          dbAirdropUsedAmount = new BigNumber(uad.airdrop_used_amount);
          amountToAdjustWithCurrentRecord = new BigNumber(Math.min(totalRemainingAmountToAdjust.toNumber(), dbAmountForAdjusting.toNumber()));
          if (amountToAdjustWithCurrentRecord.lte(0)){
            return onResolve(responseHelper.successWithData());
          }
          var airdropUsedAmountToUpdate = (dbAirdropUsedAmount.plus(amountToAdjustWithCurrentRecord)).toString();
          logger.info("==========user_airdrop_detail.updateAirdropUsedAmount.updating============");
          logger.info("\nid: ", uad.id, "airdropUsedAmountToUpdate: ", airdropUsedAmountToUpdate);
          await oThis.update({airdrop_used_amount: airdropUsedAmountToUpdate}).where(["id = ?",uad.id]).fire();
          totalRemainingAmountToAdjust = totalRemainingAmountToAdjust.minus(amountToAdjustWithCurrentRecord);
        }
      } catch(err) {
        return onResolve(responseHelper.error('uad_uaua_2', 'Error in updateAirdropUsedAmount: ' + err));
      }
      return onResolve(responseHelper.successWithData());
    });

  }


};

Object.assign(UserAirdropDetailKlass.prototype, UserAirdropDetailKlassPrototype);

module.exports = UserAirdropDetailKlass;