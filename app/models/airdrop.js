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

  getById: function (id) {
    var oThis = this;
    return oThis.QueryDB.read(oThis.tableName, [], 'id=?', [id]);
  },

  getByContractAddress: function (contractAddress) {
    var oThis = this;
    return oThis.QueryDB.read(oThis.tableName, [], 'contract_address=?', [contractAddress]);
  }

};

Object.assign(AirdropKlass.prototype, AirdropKlassPrototype);

module.exports = AirdropKlass;