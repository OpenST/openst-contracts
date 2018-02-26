"use strict";

const rootPrefix = '../..'
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , QueryDBKlass = require(rootPrefix + '/app/models/queryDb')
  , ModelBaseKlass = require(rootPrefix + '/app/models/base')
;

const dbName = coreConstants.MYSQL_DATABASE
  , QueryDBObj = new QueryDBKlass(dbName)
;

const UserAirdropDetailKlass = function () {};

UserAirdropDetailKlass.prototype = Object.create(ModelBaseKlass.prototype);

const UserAirdropDetailKlassPrototype = {

  QueryDB: QueryDBObj,

  tableName: 'user_airdrop_details',

  /**
   * get airdrop amount object for multiple addresses
   *
   * @param {Array} userAddresses - user addresses
   *
   * @return {Promise}
   *
   */
  getByUserAddresses: function (userAddresses) {
    var oThis = this;
    return {
      'userAddress1': {totalAirdropAmount: 'amounInWei', airdropUsedAmount: 'amountInWei'},
      'userAddress2': {totalAirdropAmount: 'amounInWei', airdropUsedAmount: 'amountInWei'}
    };
  }
};

Object.assign(UserAirdropDetailKlass.prototype, UserAirdropDetailKlassPrototype);

module.exports = UserAirdropDetailKlass;