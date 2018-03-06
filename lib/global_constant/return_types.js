"use strict";

const returnTypes = {

  transactionHash: function(){
    return 'txHash';
  },

  transactionReceipt: function(){
    return 'txReceipt'
  },

  transactionUuid: function(){
    return 'uuid';
  }

};

module.exports = returnTypes;