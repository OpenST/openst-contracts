"use strict";

const OSTBase = require("@openstfoundation/openst-base");
const rootPrefix = '../../..'
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , OstWeb3       = OSTBase.OstWeb3
;

const web3WSProvider = new OstWeb3(coreConstants.OST_UTILITY_GETH_WS_PROVIDER);

module.exports = web3WSProvider;
