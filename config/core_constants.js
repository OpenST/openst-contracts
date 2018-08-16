'use strict';

/**
 * Load all the core constants from config strategy OR define them as literals here and export them.
 *
 * @module config/core_constants
 *
 */

const rootPrefix = '..',
  InstanceComposer = require(rootPrefix + '/instance_composer');

/**
 * Constructor for core constants
 *
 * @constructor
 */
const CoreConstants = function(configStrategy, instanceComposer) {
  const oThis = this;

  // Geth
  oThis.OST_UTILITY_GETH_RPC_PROVIDER = configStrategy.OST_UTILITY_GETH_RPC_PROVIDER;
  oThis.OST_UTILITY_GETH_WS_PROVIDER = configStrategy.OST_UTILITY_GETH_WS_PROVIDER;

  // MySQL details
  oThis.MYSQL_HOST = process.env.OP_MYSQL_HOST;
  oThis.MYSQL_USER = process.env.OP_MYSQL_USER;
  oThis.MYSQL_PASSWORD = process.env.OP_MYSQL_PASSWORD;
  oThis.MYSQL_DATABASE = process.env.OP_MYSQL_DATABASE;
  oThis.MYSQL_CONNECTION_POOL_SIZE = process.env.OP_MYSQL_CONNECTION_POOL_SIZE;

  oThis.OST_STANDALONE_MODE = configStrategy.OST_STANDALONE_MODE;

  //Debug level
  oThis.DEBUG_ENABLED = configStrategy.DEBUG_ENABLED || false;

  //Environment
  oThis.AUTO_SCALE_DYNAMO = configStrategy.AUTO_SCALE_DYNAMO;

  //For Multi Chain
  oThis.UTILITY_CHAIN_ID = process.env.OST_UTILITY_CHAIN_ID;
};

CoreConstants.prototype = {
  /**
   * utility geth rpc endpoint.<br><br>
   *
   * @constant {string}
   *
   */
  OST_UTILITY_GETH_RPC_PROVIDER: null,

  /**
   * Mysql DB endpoint.<br><br>
   *
   * @constant {string}
   *
   */
  MYSQL_HOST: null,

  /**
   * user name for Mysql. <br><br>
   *
   * @constant {string}
   *
   */
  MYSQL_USER: null,

  /**
   * Mysql database name. <br><br>
   *
   * @constant {string}
   *
   */
  MYSQL_DATABASE: null,

  /**
   * Mysql connection pool size.<br><br>
   *
   * @constant {string}
   *
   */
  MYSQL_CONNECTION_POOL_SIZE: null,

  /**
   * is payments running in standalone mode. <br><br>
   *
   * @constant {string}
   *
   */
  OST_STANDALONE_MODE: null,

  /**
   * is debug enabled.<br><br>
   *
   * @constant {string}
   *
   */
  DEBUG_ENABLED: null,

  /**
   * is autoscaling enabled for DynamoDb. <br><br>
   *
   * @constant {string}
   *
   */
  AUTO_SCALE_DYNAMO: null
};

InstanceComposer.register(CoreConstants, 'getCoreConstants', true);

module.exports = CoreConstants;
