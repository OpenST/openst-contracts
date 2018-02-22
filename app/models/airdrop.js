"use strict";

var rootPrefix = '../..'
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , QueryDBKlass = require(rootPrefix + '/app/models/queryDb')
;

/*
 * Table configuration methods
 */

const dbName = "payment_"+coreConstants.ENVIRONMENT
  , QueryDB = new QueryDBKlass(dbName)
  , tableName = 'airdrops'
;

/*
 * Public methods
 */
const airdrop = {

  get: function (id) {
    return QueryDB.read(
      tableName,
      [],
      'id=?',
      [id]);
  }

};

module.exports = airdrop;