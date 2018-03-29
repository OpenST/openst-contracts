"use strict";

const OstCore = require("@openstfoundation/openst-core");

const rootPrefix = '../../..'
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , OstWeb3       = OstCore.OstWeb3
;

const web3RpcProvider = new OstWeb3(coreConstants.OST_UTILITY_GETH_RPC_PROVIDER, null, {
  providerOptions: {
    maxReconnectTries: 20,
    killOnReconnectFailure: false
  }
});

module.exports = web3RpcProvider;
