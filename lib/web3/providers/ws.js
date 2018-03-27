"use strict";

const coreConstants = require('../../../config/core_constants');

const Web3 = require('web3')
  , web3WSProvider = new Web3(coreConstants.OST_UTILITY_GETH_WS_PROVIDER);

module.exports = web3WSProvider;
