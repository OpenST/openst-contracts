"use strict";

/**
 * Load all the Mysql related constants from from config strategy OR define them as literals here and export them.
 *
 * @module config/mysql
 *
 */

const rootPrefix = '..'
  , InstanceComposer = require(rootPrefix + "/instance_composer")
;

require(rootPrefix + '/config/core_constants');

const MysqlConfig = function (configStrategy, instanceComposer) {

  const oThis = this
    , coreConstants = instanceComposer.getCoreConstants()
  ;

  oThis.commonNodeConfig = {
    "connectionLimit": coreConstants.MYSQL_CONNECTION_POOL_SIZE,
    "charset": "UTF8_UNICODE_CI",
    "bigNumberStrings": true,
    "supportBigNumbers": true,
    "dateStrings": true,
    "debug": false
  };

  oThis.commonClusterConfig = {
    "canRetry": true,
    "removeNodeErrorCount": 5,
    "restoreNodeTimeout": 10000,
    "defaultSelector": "RR"
  };

  oThis.clusters = {
    "cluster1": {
      "master": {
        "host": coreConstants.MYSQL_HOST,
        "user": coreConstants.MYSQL_USER,
        "password": coreConstants.MYSQL_PASSWORD
      }
    }
  };

  oThis.databases = {};

  oThis.databases[coreConstants.MYSQL_DATABASE] = ["cluster1"];

};

InstanceComposer.register(MysqlConfig, "getMySqlConfig", true);

module.exports = MysqlConfig;
