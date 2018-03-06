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
    return new Promise(async function (onResolve, onReject) {
      var result = {}
        , userAirdropDetail = {}
      ;

      try {
        const userAirdropDetailResultArray = await oThis.select(
          "user_address, CONVERT(sum(airdrop_amount), char) " +
          "as total_airdrop_amount, CONVERT(sum(airdrop_used_amount), char) as total_airdrop_used_amount").where({
          airdrop_id: airdropId,
          user_address: userAddresses
        }).group_by("user_address").fire();

        for (var uadIndex in userAirdropDetailResultArray) {
          userAirdropDetail = userAirdropDetailResultArray[uadIndex];
          var totalAirdropAmount = new BigNumber(userAirdropDetail.total_airdrop_amount)
            , totalAirdropUsedAmount = new BigNumber(userAirdropDetail.total_airdrop_used_amount)
            , balanceAirdropAmount = totalAirdropAmount.minus(totalAirdropUsedAmount)
          ;
          result[userAirdropDetail.user_address] = {
            totalAirdropAmount: totalAirdropAmount.toString(10),
            totalAirdropUsedAmount: totalAirdropUsedAmount.toString(10),
            balanceAirdropAmount: balanceAirdropAmount.toString(10)
          };
        }
        logger.info("========user_airdrop_detail.getByUserAddresses().result=========");
        logger.info(result);
        return onResolve(responseHelper.successWithData(result));
      } catch (error) {
        return onResolve(responseHelper.error('a_m_uad_1', 'error:' + error));
      }
    });

  },

  /**
   * Debit airdrop used amount
   *
   * @param {Hex} airdropContractAddress - airdrop contract address
   * @param {Hex} userAddress - user address
   * @param {String} airdropAmountUsed - wei value
   *
   * @return {Promise}
   *
   */
  debitAirdropUsedAmount: function (airdropContractAddress, userAddress, airdropAmountUsed) {
    const oThis = this;
    logger.info("==========user_airdrop_detail.debitAirdropUsedAmount.params============");
    logger.info("airdropContractAddress: " + airdropContractAddress,
      "userAddress: ", userAddress,
      "airdropAmountUsed: ", airdropAmountUsed, "\n");
    return new Promise(async function (onResolve, onReject) {
      try {
        const airdropModel = new airdropKlass();
        const airdropModelResult = await airdropModel.getByContractAddress(airdropContractAddress);
        const airdropRecord = airdropModelResult[0];
        var totalRemainingAmountToAdjust = new BigNumber(airdropAmountUsed);
        if (totalRemainingAmountToAdjust.lte(0)) {
          return onResolve(responseHelper.successWithData());
        }
        if (!userAddress) {
          return onResolve(responseHelper.error('uad_daua_1', 'Invalid User Address'));
        }
        const userAirdropDetailResults = await oThis.select("id, airdrop_id, user_address, CONVERT(airdrop_amount, char) as airdrop_amount, CONVERT(airdrop_used_amount, char) as airdrop_used_amount").where(["airdrop_id = ? AND airdrop_amount > airdrop_used_amount AND user_address=?", airdropRecord.id, userAddress]).fire();
        logger.info("======debitAirdropUsedAmount.userAirdropDetailResults=========");
        logger.info(userAirdropDetailResults);
        // Return error if no record found. Means airdrop_used_amount is not updated correctly in previous adjustments
        if (!userAirdropDetailResults[0]) {
          return onResolve(responseHelper.error('uad_daua_2', 'no airdrop record available for adjusting: '));
        }

        var amountToAdjustWithCurrentRecord = new BigNumber(0)
          , dbAmountForAdjusting = new BigNumber(0)
          , dbAirdropUsedAmount = new BigNumber(0)
          , airdropUsedAmountToUpdate = new BigNumber(0)
        ;
        for (var uadIndex in userAirdropDetailResults) {
          var uad = userAirdropDetailResults[uadIndex];
          dbAmountForAdjusting = new BigNumber(uad.airdrop_amount).minus(dbAirdropUsedAmount);
          dbAirdropUsedAmount = new BigNumber(uad.airdrop_used_amount);
          amountToAdjustWithCurrentRecord = BigNumber.min(totalRemainingAmountToAdjust, dbAmountForAdjusting);
          if (amountToAdjustWithCurrentRecord.lte(0)) {
            return onResolve(responseHelper.successWithData());
          }
          var airdropUsedAmountToUpdate = (dbAirdropUsedAmount.plus(amountToAdjustWithCurrentRecord)).toString(10);
          logger.info("==========user_airdrop_detail.debitAirdropUsedAmount.updating============");
          logger.info("\nid: ", uad.id, "airdropUsedAmountToUpdate: ", airdropUsedAmountToUpdate);
          await oThis.update({airdrop_used_amount: airdropUsedAmountToUpdate}).where(["id = ?", uad.id]).fire();
          totalRemainingAmountToAdjust = totalRemainingAmountToAdjust.minus(amountToAdjustWithCurrentRecord);
        }
      } catch (err) {
        return onResolve(responseHelper.error('uad_daua_4', 'Error in debitAirdropUsedAmount: ' + err));
      }
      return onResolve(responseHelper.successWithData());
    });

  },

  /**
   * Credit airdrop used amount. decreases airdrop_used_amount of user_airdrop_details table
   *
   * @param {Hex} airdropContractAddress - airdrop contract address
   * @param {Hex} userAddress - user address
   * @param {String} airdropAmountUsed - wei value
   *
   * @return {Promise}
   *
   */
  creditAirdropUsedAmount: function (airdropContractAddress, userAddress, airdropAmountUsed) {
    const oThis = this;
    logger.info("==========user_airdrop_detail.creditAirdropUsedAmount.params============");
    logger.info("airdropContractAddress: " + airdropContractAddress,
      "userAddress: ", userAddress,
      "airdropAmountUsed: ", airdropAmountUsed, "\n");
    return new Promise(async function (onResolve, onReject) {
      try {
        const airdropModel = new airdropKlass();
        const airdropModelResult = await airdropModel.getByContractAddress(airdropContractAddress);
        const airdropRecord = airdropModelResult[0];
        var totalRemainingAmountToAdjust = new BigNumber(airdropAmountUsed);
        if (totalRemainingAmountToAdjust.lte(0)) {
          return onResolve(responseHelper.successWithData());
        }
        if (!userAddress) {
          return onResolve(responseHelper.error('uad_caua_1', 'Invalid User Address'));
        }
        const userAirdropDetailResults = await oThis.select("id, airdrop_id, user_address, CONVERT(airdrop_amount, char) as airdrop_amount, CONVERT(airdrop_used_amount, char) as airdrop_used_amount").where(["airdrop_id = ? AND airdrop_used_amount > 0 AND user_address=?", airdropRecord.id, userAddress]).fire();
        logger.info("======creditAirdropUsedAmount.userAirdropDetailResults=========");
        logger.info(userAirdropDetailResults);
        // Return error if no record found to adjust
        if (!userAirdropDetailResults[0]) {
          return onResolve(responseHelper.error('uad_caua_2', 'no airdrop record available for adjusting: '));
        }

        for (var uadIndex in userAirdropDetailResults) {
          const uad = userAirdropDetailResults[uadIndex];
          const dbAmount = new BigNumber(uad.airdrop_used_amount);

          const toAdjustAmount = BigNumber.min(dbAmount, totalRemainingAmountToAdjust);
          const amountToUpdate = dbAmount.minus(toAdjustAmount);

          await oThis.update({airdrop_used_amount: amountToUpdate.toString()}).where(["id = ?", uad.id]).fire();
          totalRemainingAmountToAdjust = totalRemainingAmountToAdjust.minus(toAdjustAmount);
          if (totalRemainingAmountToAdjust.lte(0)) {
            return onResolve(responseHelper.successWithData());
          }
        }
      } catch (err) {
        return onResolve(responseHelper.error('uad_caua_3', 'Error in updateAirdropUsedAmount: ' + err));
      }
      return onResolve(responseHelper.successWithData());
    });

  }


};

Object.assign(UserAirdropDetailKlass.prototype, UserAirdropDetailKlassPrototype);

module.exports = UserAirdropDetailKlass;