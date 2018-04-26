"use strict";

const OSTBase = require("@openstfoundation/openst-base");

const rootPrefix = '../../..'
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , OstWeb3       = OSTBase.OstWeb3
;

const web3RpcProvider = new OstWeb3(coreConstants.OST_UTILITY_GETH_RPC_PROVIDER);

module.exports = web3RpcProvider;
