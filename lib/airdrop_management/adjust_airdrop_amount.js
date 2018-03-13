/**
 *
 * This class would be used for calculating user airdrop balance.<br><br>
 *
 * @module lib/airdrop_management/user_balance
 *
 */

const rootPrefix = '../..'
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , airdropKlass = require(rootPrefix + '/app/models/airdrop')
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
      try {
        const airdropModel = new airdropKlass();
        const airdropModelResult = await airdropModel.getByContractAddress(oThis.airdropContractAddress);
        const airdropRecord = airdropModelResult[0];
        var totalRemainingAmountToAdjust = new BigNumber(oThis.airdropAmountUsed);
        if (totalRemainingAmountToAdjust.lte(0)) {
          return onResolve(responseHelper.successWithData());
        }
        if (!oThis.userAddress) {
          return onResolve(responseHelper.error('uad_daua_1', 'Invalid User Address'));
        }
        var userAirdropDetailModel = new userAirdropDetailKlass();
        const userAirdropDetailResults = await userAirdropDetailModel.select("id, airdrop_id, user_address, CONVERT(airdrop_amount, char) as airdrop_amount, CONVERT(airdrop_used_amount, char) as airdrop_used_amount").
          where({airdrop_id: airdropRecord.id, user_address: oThis.userAddress}).
          where(["airdrop_amount > airdrop_used_amount"]).fire();
        logger.info("\n======debitAirdropUsedAmount.userAirdropDetailResults=========", userAirdropDetailResults);
        // Return error if no record found. Means airdrop_used_amount is not updated correctly in previous adjustments
        if (!userAirdropDetailResults[0]) {
          return onResolve(responseHelper.error('uad_daua_2', 'no airdrop record available for adjusting: '));
        }
        var amountAdjustedLog = {};
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
        return onResolve(responseHelper.errorWithData({amountAdjustedLog: amountAdjustedLog}, 'uad_daua_4', 'Error in debitAirdropUsedAmount: ' + err));
      }
      // In case totalRemainingAmountToAdjust > 0 means no record available for adjusting or parallel requests issue
      if (totalRemainingAmountToAdjust.gt(0)) {
        return onResolve(responseHelper.errorWithData({amountAdjustedLog: amountAdjustedLog}, 'uad_daua_5', 'Amount fully not adjusted'));
      }
      return onResolve(responseHelper.successWithData({amountAdjustedLog: amountAdjustedLog}));
    });

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
      try {
        const airdropModel = new airdropKlass();
        const airdropModelResult = await airdropModel.getByContractAddress(oThis.airdropContractAddress);
        const airdropRecord = airdropModelResult[0];
        var totalRemainingAmountToAdjust = new BigNumber(oThis.airdropAmountUsed);
        if (totalRemainingAmountToAdjust.lte(0)) {
          return onResolve(responseHelper.successWithData());
        }
        if (!oThis.userAddress) {
          return onResolve(responseHelper.error('uad_caua_1', 'Invalid User Address'));
        }
        var userAirdropDetailModel = new userAirdropDetailKlass();
        const userAirdropDetailResults = await userAirdropDetailModel.select("id, airdrop_id, user_address, CONVERT(airdrop_amount, char) as airdrop_amount, CONVERT(airdrop_used_amount, char) as airdrop_used_amount").
          where({airdrop_id: airdropRecord.id, user_address: oThis.userAddress}).
          where(["airdrop_used_amount > 0 AND airdrop_amount >= airdrop_used_amount"]).fire();
        logger.info("======creditAirdropUsedAmount.userAirdropDetailResults=========");
        logger.info(userAirdropDetailResults);
        // Return error if no record found to adjust
        if (!userAirdropDetailResults[0]) {
          return onResolve(responseHelper.error('uad_caua_2', 'no airdrop record available for adjusting: '));
        }
        var amountAdjustedLog = {};
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
        return onResolve(responseHelper.errorWithData({amountAdjustedLog: amountAdjustedLog}, 'uad_caua_3', 'Error in updateAirdropUsedAmount: ' + err));
      }
      // In case totalRemainingAmountToAdjust > 0 means no record available for adjusting or parallel requests issue
      if (totalRemainingAmountToAdjust.gt(0)) {
        return onResolve(responseHelper.errorWithData({amountAdjustedLog: amountAdjustedLog}, 'uad_caua_4', 'Amount fully not adjusted'));
      }
      return onResolve(responseHelper.successWithData({amountAdjustedLog: amountAdjustedLog}));
    });

  },

};

module.exports = AdjustAirdropAmountKlass;

