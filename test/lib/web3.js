"use strict";


const Web3 = require('web3'),
  web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

module.exports = web3;
