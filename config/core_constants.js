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

// Geth
define('OST_UTILITY_GETH_RPC_PROVIDER', process.env.OST_UTILITY_GETH_RPC_PROVIDER);

// Gas limit
define('OST_GAS_LIMIT', 9100000);
