"use strict";

/**
 *
 * This class would be used for calculating user airdrop balance.<br><br>
 *
 * @module lib/airdrop_management/adjust_airdrop_amount
 *
 */

const rootPrefix = '../..'
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , AirdropModelCacheKlass = require(rootPrefix + '/lib/cache_management/airdrop_model')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , userAirdropDetailKlass = require(rootPrefix + '/app/models/user_airdrop_detail')
  , BigNumber = require('bignumber.js')
;

/**
 * Constructor to create object of userBalance
 *
 * @constructor
 *
 * @param {Hex} airdropContractAddress - airdrop contract address
 * @param {Array} userAddress - Array of user addressed
 * @param {BigNumber} airdropAmountUsed - used airdrop amount
 *
 * @return {Object}
 *
 */
const AdjustAirdropAmountKlass = function(params) {
  logger.info("=======AdjustAirdropAmountKlass.params=======");
  logger.info(params);
  const oThis = this;
  oThis.airdropContractAddress = params.airdropContractAddress;
  oThis.userAddress = params.userAddress;
  oThis.airdropAmountUsed = params.airdropAmountUsed;
};

AdjustAirdropAmountKlass.prototype = {

  /**
   * Debit airdrop used amount
   *
   * @return {Promise}
   *
   */
  debitAirdropUsedAmount: function () {
    const oThis = this;
    return new Promise(async function (onResolve, onReject) {
      var amountAdjustedLog = {};
      try {
        const airdropModelCacheObject = new AirdropModelCacheKlass({useObject: true, contractAddress: oThis.airdropContractAddress})
          , airdropModelCacheResponse = await airdropModelCacheObject.fetch()
          , airdropRecord = airdropModelCacheResponse.data[oThis.airdropContractAddress]
        ;
        var totalRemainingAmountToAdjust = new BigNumber(oThis.airdropAmountUsed);
        // Zero airdrop amount is possible
        if (totalRemainingAmountToAdjust.equals(0)) {
          return onResolve(responseHelper.successWithData({}));
        }
        if (totalRemainingAmountToAdjust.lt(0)) {
          return onResolve(responseHelper.error('l_am_aaa_daua_1', 'negative airdropAmountUsed not allowed'));
        }
        if (!oThis.userAddress) {
          return onResolve(responseHelper.error('l_am_aaa_daua_2', 'Invalid User Address'));
        }
        var userAirdropDetailModel = new userAirdropDetailKlass();
        const userAirdropDetailResults = await userAirdropDetailModel.select("id, airdrop_id, user_address, CONVERT(airdrop_amount, char) as airdrop_amount, CONVERT(airdrop_used_amount, char) as airdrop_used_amount").
          where({airdrop_id: airdropRecord.id, user_address: oThis.userAddress}).
          where(["airdrop_amount > airdrop_used_amount"]).fire();
        logger.info("\n======debitAirdropUsedAmount.userAirdropDetailResults=========", userAirdropDetailResults);
        // Return error if no record found. Means airdrop_used_amount is not updated correctly in previous adjustments
        if (!userAirdropDetailResults[0]) {
          return onResolve(responseHelper.error('l_am_aaa_daua_3', 'no airdrop record available for adjusting: '));
        }
        for (var uadIndex in userAirdropDetailResults) {
          const uad = userAirdropDetailResults[uadIndex];
          const dbAirdropUsedAmount = new BigNumber(uad.airdrop_used_amount);
          const dbAmountForAdjusting = new BigNumber(uad.airdrop_amount).minus(dbAirdropUsedAmount);
          const amountToAdjustWithCurrentRecord = BigNumber.min(totalRemainingAmountToAdjust, dbAmountForAdjusting);
          if (amountToAdjustWithCurrentRecord.lte(0)) {
            return onResolve(responseHelper.successWithData({amountAdjustedLog: amountAdjustedLog}));
          }
          userAirdropDetailModel = new userAirdropDetailKlass();
          const updateResult = await userAirdropDetailModel.update(["airdrop_used_amount=airdrop_used_amount+?", amountToAdjustWithCurrentRecord.toString(10)]).
            where(["id = ? AND ((airdrop_used_amount+?) <= airdrop_amount)", uad.id, amountToAdjustWithCurrentRecord.toString(10)]).fire();
          logger.info("\ndebitAirdropUsedAmount.updateResult: ", updateResult);
          if (updateResult.affectedRows < 1) {
            continue; // Don't subtract totalRemainingAmountToAdjust if update is failed
          } else{
            amountAdjustedLog[uad.id] = amountToAdjustWithCurrentRecord.toString(10);
            totalRemainingAmountToAdjust = totalRemainingAmountToAdjust.minus(amountToAdjustWithCurrentRecord);
            logger.info("\n=====debitAirdropUsedAmount.updateSuccess=======", "\ntotalRemainingAmountToAdjust: ",totalRemainingAmountToAdjust.toString(10));
          }
        }
      } catch (err) {
        logger.error("debitAirdropUsedAmount error: ", err);
        // Rollback all adjusted amount
        if (Object.keys(amountAdjustedLog).length > 0){
          await oThis.rollbackDebitAirdropAdjustedAmount(amountAdjustedLog);
        }
        return onResolve(responseHelper.errorWithData({amountAdjustedLog: amountAdjustedLog}, 'l_am_aaa_daua_4', 'Error in debitAirdropUsedAmount: ' + err));
      }
      // In case totalRemainingAmountToAdjust > 0 means no record available for adjusting or parallel requests issue
      if (totalRemainingAmountToAdjust.gt(0)) {
        // Rollback all adjusted amount
        if (Object.keys(amountAdjustedLog).length > 0){
          await oThis.rollbackDebitAirdropAdjustedAmount(amountAdjustedLog);
        }
        return onResolve(responseHelper.errorWithData({amountAdjustedLog: amountAdjustedLog}, 'l_am_aaa_daua_5', 'Airdrop used Amount not adjusted. This could be because of same user payment requests in parallel'));
      }
      return onResolve(responseHelper.successWithData({amountAdjustedLog: amountAdjustedLog}));
    });

  },

  /**
   * Rollback debit airdrop used amount
   *
   * @return {}
   *
   */
  rollbackDebitAirdropAdjustedAmount: async function(amountAdjustedLog){
    for (var uadId in amountAdjustedLog) {
      const rollbackAmount = amountAdjustedLog[uadId];
      const userAirdropDetailModel = new userAirdropDetailKlass();
      await userAirdropDetailModel.update(["airdrop_used_amount=airdrop_used_amount-?", rollbackAmount]).
        where(["id = ?", uadId]).fire();
    }
  },

  /**
   * Credit airdrop used amount. decreases airdrop_used_amount of user_airdrop_details table
   *
   * @return {Promise}
   *
   */
  creditAirdropUsedAmount: function () {
    const oThis = this;
    return new Promise(async function (onResolve, onReject) {
      var amountAdjustedLog = {};
      try {
        const airdropModelCacheObject = new AirdropModelCacheKlass({useObject: true, contractAddress: oThis.airdropContractAddress})
          , airdropModelCacheResponse = await airdropModelCacheObject.fetch()
          , airdropRecord = airdropModelCacheResponse.data[oThis.airdropContractAddress]
        ;
        var totalRemainingAmountToAdjust = new BigNumber(oThis.airdropAmountUsed);
        // Zero airdrop amount is possible
        if (totalRemainingAmountToAdjust.equals(0)) {
          return onResolve(responseHelper.successWithData({}));
        }
        if (totalRemainingAmountToAdjust.lt(0)) {
          return onResolve(responseHelper.error('l_am_aaa_caua_1', 'negative airdropAmountUsed not allowed'));
        }
        if (!oThis.userAddress) {
          return onResolve(responseHelper.error('l_am_aaa_caua_2', 'Invalid User Address'));
        }
        var userAirdropDetailModel = new userAirdropDetailKlass();
        const userAirdropDetailResults = await userAirdropDetailModel.select("id, airdrop_id, user_address, CONVERT(airdrop_amount, char) as airdrop_amount, CONVERT(airdrop_used_amount, char) as airdrop_used_amount").
          where({airdrop_id: airdropRecord.id, user_address: oThis.userAddress}).
          where(["airdrop_used_amount > 0 AND airdrop_amount >= airdrop_used_amount"]).fire();
        logger.info("======creditAirdropUsedAmount.userAirdropDetailResults=========");
        logger.info(userAirdropDetailResults);
        // Return error if no record found to adjust
        if (!userAirdropDetailResults[0]) {
          return onResolve(responseHelper.error('l_am_aaa_caua_3', 'no airdrop record available for adjusting: '));
        }
        for (var uadIndex in userAirdropDetailResults) {
          const uad = userAirdropDetailResults[uadIndex];
          const dbAmount = new BigNumber(uad.airdrop_used_amount);
          const toAdjustAmount = BigNumber.min(dbAmount, totalRemainingAmountToAdjust);
          // Saves Query
          if (toAdjustAmount.lte(0)) {
            return onResolve(responseHelper.successWithData({amountAdjustedLog: amountAdjustedLog}));
          }
          userAirdropDetailModel = new userAirdropDetailKlass();
          const updateResult = await userAirdropDetailModel.update(["airdrop_used_amount=airdrop_used_amount-?",toAdjustAmount.toString(10)]).
            where(["id = ? AND (airdrop_amount >= airdrop_used_amount) AND (airdrop_used_amount-?)>=0", uad.id, toAdjustAmount.toString(10)]).fire();
          logger.info("\ndebitAirdropUsedAmount.updateResult: ", updateResult);
          if (updateResult.affectedRows < 1) {
            continue; // Don't subtract totalRemainingAmountToAdjust if update is failed
          } else {
            totalRemainingAmountToAdjust = totalRemainingAmountToAdjust.minus(toAdjustAmount);
            amountAdjustedLog[uad.id] = toAdjustAmount.toString(10);
            logger.info("\n=====creditAirdropUsedAmount.updateSuccess=======", "\ntotalRemainingAmountToAdjust: ",totalRemainingAmountToAdjust.toString(10));
          }
        }
      } catch (err) {
        logger.error("creditAirdropUsedAmount error: ", err);
        // Rollback all adjusted amount
        if (Object.keys(amountAdjustedLog).length > 0){
          await oThis.rollbackCreditAirdropAdjustedAmount(amountAdjustedLog);
        }
        return onResolve(responseHelper.errorWithData({amountAdjustedLog: amountAdjustedLog}, 'l_am_aaa_caua_4', 'Error in updateAirdropUsedAmount: ' + err));
      }
      // In case totalRemainingAmountToAdjust > 0 means no record available for adjusting or parallel requests issue
      if (totalRemainingAmountToAdjust.gt(0)) {
        // Rollback all adjusted amount
        if (Object.keys(amountAdjustedLog).length > 0){
          await oThis.rollbackCreditAirdropAdjustedAmount(amountAdjustedLog);
        }
        return onResolve(responseHelper.errorWithData({amountAdjustedLog: amountAdjustedLog}, 'l_am_aaa_caua_5', 'Airdrop used Amount not adjusted. This could be because of same user payment requests in parallel'));
      }
      return onResolve(responseHelper.successWithData({amountAdjustedLog: amountAdjustedLog}));
    });

  },

  /**
   * Rollback credit airdrop used amount
   *
   * @return {}
   *
   */
  rollbackCreditAirdropAdjustedAmount: async function(amountAdjustedLog){
    for (var uadId in amountAdjustedLog) {
      const rollbackAmount = amountAdjustedLog[uadId];
      const userAirdropDetailModel = new userAirdropDetailKlass();
      await userAirdropDetailModel.update(["airdrop_used_amount=airdrop_used_amount+?", rollbackAmount]).
      where(["id = ?", uadId]).fire();
    }
  },

};

module.exports = AdjustAirdropAmountKlass;

