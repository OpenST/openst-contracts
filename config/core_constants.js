"use strict";

const path = require('path')
  , rootPrefix = ".."
;

/*
 * Constants file: Load constants from environment variables
 *
 */

function define(name, value) {
  Object.defineProperty(exports, name, {
    value: value,
    enumerable: true
  });
}
//Cache engine
define('CACHING_ENGINE', process.env.OST_CACHING_ENGINE);

// Geth
define('OST_UTILITY_GETH_RPC_PROVIDER', process.env.OST_UTILITY_GETH_RPC_PROVIDER);
define('OST_UTILITY_GETH_WS_PROVIDER', process.env.OST_UTILITY_GETH_WS_PROVIDER);

// MySQL details
define("MYSQL_HOST", process.env.OP_MYSQL_HOST);
define("MYSQL_USER", process.env.OP_MYSQL_USER);
define("MYSQL_PASSWORD", process.env.OP_MYSQL_PASSWORD);
define("MYSQL_DATABASE", process.env.OP_MYSQL_DATABASE);
define("MYSQL_CONNECTION_POOL_SIZE", process.env.OP_MYSQL_CONNECTION_POOL_SIZE);
define("STANDALONE_MODE", process.env.OST_STANDALONE_MODE);


//Debug level
define('DEBUG_ENABLED', process.env.OST_DEBUG_ENABLED || false);

//Environment
define("RUNNING_TESTS_IN", process.env.RUNNING_TESTS_IN);
