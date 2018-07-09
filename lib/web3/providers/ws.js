"use strict";

const OstBase = require("@openstfoundation/openst-base");

const rootPrefix = '../../..'
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , OstWeb3       = OstBase.OstWeb3Pool.Factory
;

Object.defineProperty(module, 'exports', {
  get: function () {
    let web3WSProvider = OstWeb3.getWeb3(coreConstants.OST_UTILITY_GETH_WS_PROVIDER);
    return web3WSProvider;
  }
});