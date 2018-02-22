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
};

Object.assign(UserAirdropDetailKlass.prototype, UserAirdropDetailKlassPrototype);

module.exports = UserAirdropDetailKlass;