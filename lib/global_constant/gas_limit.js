"use strict";

const gasLimit = {

  buffer: function() {
    return 200000;
  },

  default: function() {
    return 9000000;
  },

  setOps: function() {
    return 45822+this.buffer();
  },

  deployWorker: function() {
    return 569731+this.buffer();
  },

  // deployment gas 1645052
  deployAirdrop: function() {
    return 1803725+this.buffer();
  },

  deployPriceOracle: function() {
    return 579067+this.buffer();
  },

  deployOpsManaged: function() {
    return 45690+this.buffer();
  },

  setPriceOracle: function() {
    return 64585+this.buffer();
  },

  setAcceptedMargin: function() {
    return 44726+this.buffer();
  },

  setWorker: function() {
    return 46402+this.buffer();
  },

  transferToAirdropBudgetHolder: function() {
    return 51705+this.buffer();
  },

  approveByBudgetHolder: function() {
    return 45675+this.buffer();
  },

  approveToUser: function() {
    return 45611+this.buffer();
  },

  airdropPay: function(){
    return 174842+this.buffer();
  },


};

module.exports = gasLimit;