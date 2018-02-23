"use strict";

var rootPrefix = '../..'
  , mysqlWrapper = require(rootPrefix + "/lib/mysql_wrapper")
  , util = require(rootPrefix + '/lib/utils')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
;

const QueryDB = function(dbName){

  this.dbName = dbName

};

QueryDB.prototype = {

  constructor: QueryDB,

  // get read connection
  onReadConnection: function() {
    return mysqlWrapper.getPoolFor(this.dbName, 'master');
  },

  // get read connection
  onWriteConnection: function() {
    return mysqlWrapper.getPoolFor(this.dbName, 'master');
  },

  read: function(tableName, fields, whereClause, whereClauseValues, orderByClause, paginationClause) {
    var oThis = this
      , selectFields = ((!fields || fields.length==0) ? '*' : fields.join(','))
      , selectWhereClause = ((!whereClause || whereClause.length==0) ? '' : ' where '+whereClause)
      , whereClauseValues = (!whereClauseValues) ? [] : whereClauseValues
      , q = 'SELECT '+selectFields+' FROM '+tableName+' '+selectWhereClause;

    if (orderByClause){
      q = q + ' ' + orderByClause;
    }

    if (paginationClause) {
      q = q + ' ' + paginationClause;
    }

    return new Promise(
      function (onResolve, onReject) {
        // get a timestamp before running the query
        var pre_query = Date.now();
        var qry = oThis.onReadConnection().query(q, whereClauseValues, function (err, result, fields) {
          logger.info("(%s ms) %s", (Date.now() - pre_query), qry.sql);
          if (err) {
            onReject(err);
          } else {
            onResolve(result);
          }
        });

      }
    );
  },

  readByInQuery: function(tableName, fields, ids, columnName) {
    var oThis = this
      , selectFields = ((!fields || fields.length==0) ? '*' : fields.join(','))
      , q = "SELECT "+selectFields+" FROM "+tableName+" WHERE "+columnName+" IN ('"+ ids.join("','")+"')";

    return new Promise(
      function (onResolve, onReject) {
        // get a timestamp before running the query
        var pre_query = Date.now();
        var qry = oThis.onReadConnection().query(q, function (err, result, fields) {
          logger.info("(%s ms) %s", (Date.now() - pre_query), qry.sql);
          if (err) {
            onReject(err);
          } else {
            onResolve(result);
          }
        });

      }
    );
  },

  insert: function(tableName, fields, queryArgs) {

    var oThis = this
      , currentDateTime = util.formatDbDate(new Date())
      , fields = fields.concat(['created_at', 'updated_at'])
      , queryArgs = queryArgs.concat([currentDateTime, currentDateTime])
      , q = 'INSERT INTO '+tableName+' ('+fields+') VALUES (?)'
    ;
    logger.info("=======Insert queryArgs=======");
    logger.info(queryArgs);
    logger.info("=======Insert Query=======");
    logger.info(q);
    return new Promise(
      function (onResolve, onReject) {
        // get a timestamp before running the query
        var pre_query = Date.now();
        var qry = oThis.onWriteConnection().query(q, [queryArgs], function (err, result, fields) {
          logger.info("(%s ms) %s", (Date.now() - pre_query), qry.sql);
          if (err) {
            onReject(err);
          } else {
            onResolve({
              fieldCount: result.fieldCount,
              affectedRows: result.affectedRows,
              insertId: result.insertId
            });
          }
        });

      }
    );
  },

  edit: function (tableName, fields, fieldValues, whereClause, whereClauseValues) {
    var oThis = this
      , currentDateTime = util.formatDbDate(new Date())
      , fieldValues = (!fieldValues) ? [] : fieldValues
      , whereClauseValues = (!whereClauseValues) ? [] : whereClauseValues
      , queryArgs = fieldValues.concat(whereClauseValues)
    ;

    return new Promise(
      function (onResolve, onReject) {
        if((!fields || fields.length==0) || (!whereClause || whereClause.length==0)){
          return onReject('Both update fields and where condition is mendatory.');
        }

        fields = fields + ', updated_at="'+currentDateTime+'"';

        // get a timestamp before running the query
        var pre_query = Date.now()
          , q = 'UPDATE '+tableName+' set '+fields+' where '+whereClause;

        var qry = oThis.onWriteConnection().query(q, queryArgs, function (err, result, fields) {
          logger.info("(%s ms) %s", (Date.now() - pre_query), qry.sql);
          if (err) {
            onReject(err);
          } else {
            onResolve(result);
          }
        });

      }
    );
  },

  migrate: function(query){
    var oThis = this;
    return new Promise(
      function (onResolve, onReject) {
        if(!query){
          return onReject('Invalid query');
        }
        // Only Whitelisted Migration Queries Allowed
        var allowed_queries = ['CREATE', 'ALTER', 'create', 'alter'];
        var querySubstring = query.substring(0, 6);
        if (allowed_queries.indexOf(querySubstring) < 0){
          return onReject('Wrong Migration. Allowed Queries: '+allowed_queries);
        }

        var pre_query = Date.now();
        var qry = oThis.onWriteConnection().query(query, [], function (err, result, fields) {
          logger.info("(%s ms) %s", (Date.now() - pre_query), qry.sql);
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

module.exports = QueryDB;