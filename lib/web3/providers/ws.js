"use strict";

const OstCore = require("@openstfoundation/openst-core");
const rootPrefix = '../../..'
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , OstWeb3       = OstCore.OstWeb3
;

const web3WSProvider = new OstWeb3(coreConstants.OST_UTILITY_GETH_WS_PROVIDER, null, {
  providerOptions: {
    maxReconnectTries: 20,
    killOnReconnectFailuer: false
  }
});

module.exports = web3WSProvider;
