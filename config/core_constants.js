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

// ST' UUID
define('OST_PRICER_ST_PRIME_UUID', process.env.OST_PRICER_ST_PRIME_UUID);

// Geth
define('OST_PRICER_GETH_RPC_PROVIDER', process.env.OST_PRICER_GETH_RPC_PROVIDER);

// Chain ID
define('OST_PRICER_CHAIN_ID', process.env.OST_PRICER_CHAIN_ID);

// Gas limit
define('OST_GAS_LIMIT', 9100000);
