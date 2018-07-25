"use strict";

const rootPrefix = '../..'
  , InstanceComposer = require(rootPrefix + "/instance_composer")
  , MysqlQueryKlass = require(rootPrefix + '/lib/query_builders/mysql')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
;

require(rootPrefix + "/lib/mysql_wrapper");

const ModelBaseKlass = function (params) {

  const oThis = this;

  oThis.dbName = params.dbName;

  MysqlQueryKlass.call(this, params);

};

ModelBaseKlass.prototype = Object.create(MysqlQueryKlass.prototype);

const ModelBaseKlassPrototype = {

  // get read connection
  onReadConnection: function () {

    const oThis = this
      , mysqlWrapper = oThis.ic().getMySqlPoolProvider()
    ;

    return mysqlWrapper.getPoolFor(oThis.dbName, 'master', oThis.ic());

  },

  // get read connection
  onWriteConnection: function () {

    const oThis = this
      , mysqlWrapper = oThis.ic().getMySqlPoolProvider()
    ;

    return mysqlWrapper.getPoolFor(this.dbName, 'master', oThis.ic());

  },

  enums: {},

  convertEnumForDB: function (params, readable) {
    var oThis = this
      , enumKeys = Object.keys(oThis.enums);

    for (var i = 0; i < enumKeys.length; i++) {
      var enum_k = enumKeys[i];

      if (params[enum_k]) {
        params[enum_k] = readable ? oThis.enums[enum_k]['val'][params[enum_k]] : oThis.enums[enum_k]['inverted'][params[enum_k]];
      }
    }
    return params;
  },

  convertEnumForResult: function (params) {
    return this.convertEnumForDB(params, true);
  },

  fire: function () {
    var oThis = this;

    return new Promise(
      function (onResolve, onReject) {

        const queryGenerator = oThis.generate();
        if (queryGenerator.isSuccess()) {
          //logger.debug(queryGenerator.data.query, queryGenerator.data.queryData);
        }

        var pre_query = Date.now();
        var qry = oThis.onWriteConnection().query(queryGenerator.data.query, queryGenerator.data.queryData, function (err, result, fields) {
          logger.debug("(", (Date.now() - pre_query), "ms)", qry.sql);
          if (err) {
            onReject(err);
          } else {
            onResolve(result);
          }
        });
      }
    );

  }

};

Object.assign(ModelBaseKlass.prototype, ModelBaseKlassPrototype);

InstanceComposer.registerShadowableClass(ModelBaseKlass, "getModelBaseKlass");

module.exports = ModelBaseKlass;