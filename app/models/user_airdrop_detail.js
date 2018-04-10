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
    logger.debug("========user_airdrop_detail.getByUserAddresses().userAddresses=========");
    logger.debug(userAddresses);
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

        const userAddressesMap = {};
        for (var i in userAddresses) {
          userAddressesMap[userAddresses[i].toLowerCase()] = userAddresses[i];
        }
        logger.debug("userAddressesMap ", userAddressesMap);

        for (var uadIndex in userAirdropDetailResultArray) {
          userAirdropDetail = userAirdropDetailResultArray[uadIndex];
          var totalAirdropAmount = new BigNumber(userAirdropDetail.total_airdrop_amount)
            , totalAirdropUsedAmount = new BigNumber(userAirdropDetail.total_airdrop_used_amount)
            , balanceAirdropAmount = totalAirdropAmount.minus(totalAirdropUsedAmount)
            , userAddressInProperCase = userAddressesMap[userAirdropDetail.user_address.toLowerCase()]
          ;
          result[userAddressInProperCase] = {
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


};

Object.assign(UserAirdropDetailKlass.prototype, UserAirdropDetailKlassPrototype);

module.exports = UserAirdropDetailKlass;