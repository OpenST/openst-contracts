"use strict";

const coreConstants = require('../../../config/core_constants');

const Web3 = require('web3')
  //, provider = new Web3.providers.HttpProvider(coreConstants.OST_UTILITY_GETH_RPC_PROVIDER)
  //, web3RpcProvider = new Web3(provider);
  , web3RpcProvider = new Web3(coreConstants.OST_UTILITY_GETH_RPC_PROVIDER);

module.exports = web3RpcProvider;
