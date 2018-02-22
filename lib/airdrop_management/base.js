/**
 *
 * This is a utility file which would be used for executing all methods related to airdrop.<br><br>
 *
 * @module lib/airdrop_management/base
 *
 */

const rootPrefix = '../..'
  , Setup = require(rootPrefix + '/lib/airdrop_management/setup')
  , Transfer = require(rootPrefix + '/lib/airdrop_management/transfer')
  , Approve = require(rootPrefix + '/lib/airdrop_management/approve')
  , BatchAllocator = require(rootPrefix + '/lib/airdrop_management/batch_allocator')
;

/**
 * Constructor to create object of base
 *
 * @constructor
 *
 */
const base = module.exports = function() {

};

base.prototype = {

  setupAirdrop: function(airdropContractAddress, chainId) {
    return new Promise(async function (onResolve, onReject) {

      const setupAirdropObject = new Setup({
        airdropContractAddress: airdropContractAddress,
        chainId: chainId
      });
      onResolve(setupAirdropObject.perform());

    });

  },

  transfer: function (senderAddress, senderPassphrase, airdropContractAddress, amount, gasPrice, chainId, options) {

    var transferObject = new Transfer({
      senderAddress: senderAddress,
      senderPassphrase: senderPassphrase,
      airdropContractAddress: airdropContractAddress,
      amount: amount,
      gasPrice: gasPrice,
      chainId: chainId,
      options: options});
    return transferObject.perform();

  },

  approve: function (airdropContractAddress, airdropBudgetHolderPassphrase, gasPrice, chainId, options) {

    var approveObject = new Approve({
      airdropContractAddress: airdropContractAddress,
      airdropBudgetHolderPassphrase: airdropBudgetHolderPassphrase,
      gasPrice: gasPrice,
      chainId: chainId,
      options: options});
    return approveObject.perform();

  },

  // airdropUsers => {address: {airdropAmount:2}}
  batchAllocate: function (airdropContractAddress, transactionHash, airdropUsers) {
    var batchAllocatorObject = new BatchAllocator({
      airdropContractAddress: airdropContractAddress,
      transactionHash: transactionHash,
      airdropUsers: airdropUsers
    });
    return batchAllocatorObject.perform();
  },

};

module.exports = new base();

