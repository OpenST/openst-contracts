"use strict";

const coreConstants = require('../../../config/core_constants');

const Web3 = require('web3')
  , web3WsProvider = new Web3(coreConstants.OST_PRICER_GETH_WS_PROVIDER);

module.exports = web3WsProvider;
