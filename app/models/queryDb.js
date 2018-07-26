'use strict';

var rootPrefix = '../..',
  InstanceComposer = require(rootPrefix + '/instance_composer'),
  logger = require(rootPrefix + '/helpers/custom_console_logger');

const QueryDB = function(dbName) {
  this.dbName = dbName;
};

QueryDB.prototype = {
  constructor: QueryDB,

  // get read connection
  onReadConnection: function() {
    const oThis = this,
      mysqlWrapper = oThis.ic().getMySqlPoolProvider();
    return mysqlWrapper.getPoolFor(this.dbName, 'master', oThis.ic());
  },

  // get read connection
  onWriteConnection: function() {
    const oThis = this,
      mysqlWrapper = oThis.ic().getMySqlPoolProvider();
    return mysqlWrapper.getPoolFor(this.dbName, 'master', oThis.ic());
  },

  migrate: function(query) {
    var oThis = this;
    return new Promise(function(onResolve, onReject) {
      if (!query) {
        return onReject('Invalid query');
      }
      // Only Whitelisted Migration Queries Allowed
      var allowed_queries = ['CREATE', 'ALTER', 'create', 'alter'];
      var querySubstring = query.substring(0, 6);
      if (allowed_queries.indexOf(querySubstring) < 0) {
        return onReject('Wrong Migration. Allowed Queries: ' + allowed_queries);
      }

      var pre_query = Date.now();
      var qry = oThis.onWriteConnection().query(query, [], function(err, result, fields) {
        logger.debug('(%s ms) %s', Date.now() - pre_query, qry.sql);
        if (err) {
          onReject(err);
        } else {
          onResolve(result);
        }
      });
    });
  }
};

InstanceComposer.registerShadowableClass(QueryDB, 'getQueryDBKlass');

module.exports = QueryDB;
