"use strict";

const rootPrefix = '../..'
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , QueryDBKlass = require(rootPrefix + '/app/models/queryDb')
  , ModelBaseKlass = require(rootPrefix + '/app/models/base')
;

const dbName = coreConstants.MYSQL_DATABASE
  , QueryDBObj = new QueryDBKlass(dbName)
;

const AirdropKlass = function () {};

AirdropKlass.prototype = Object.create(ModelBaseKlass.prototype);

const AirdropKlassPrototype = {

  QueryDB: QueryDBObj,

  tableName: 'airdrops',

  getAll: async function (params) {

    var oThis = this
    ;

    var results = await oThis.QueryDB.read(
      oThis.tableName,
      []
    );

    return Promise.resolve(results);

  },

  getById: function (params) {
    var oThis = this;
    return oThis.QueryDB.read(oThis.tableName, [], 'id=?', [params['id']]);
  },

  getByContractAddress: function (params) {
    var oThis = this;
    return oThis.QueryDB.read(oThis.tableName, [], 'contract_address=?', [params['contract_address']]);
  }

};

Object.assign(AirdropKlass.prototype, AirdropKlassPrototype);

module.exports = AirdropKlass;