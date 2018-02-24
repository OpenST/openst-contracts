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
const base = module.exports = function() {};

base.prototype = {

  /**
   * Setup Airdrop
   *
   * @param {Hex} airdropContractAddress - airdrop contract address
   * @param {Number} chainId - chain Id
   *
   * @return {Promise}
   *
   */
  setupAirdrop: function(airdropContractAddress, chainId) {
    return new Promise(async function (onResolve, onReject) {

      const setupAirdropObject = new Setup({
        airdropContractAddress: airdropContractAddress,
        chainId: chainId
      });
      onResolve(setupAirdropObject.perform());

    });

  },

  /**
   * Transfer airdrop amount to airdrop budget holder
   *
   * @param {Hex} senderAddress - Sender Address
   * @param {string} senderPassphrase - passphrase
   * @param {Hex} airdropContractAddress - airdrop contract address
   * @param {BigNumber} amount - amount to transfer
   * @param {Hex} gasPrice - gasPrice
   * @param {Number} chainId - chainId
   * @param {Object} options - options e.g. {returnType: '', tag: ''}
   *
   * @return {Promise}
   *
   */
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

  /**
   * approve airdrop amount to airdrop contract address
   *
   * @param {Hex} airdropContractAddress - airdrop contract address
   * @param {string} airdropBudgetHolderPassphrase - passphrase
   * @param {Hex} gasPrice - gasPrice
   * @param {Number} chainId - chainId
   * @param {Object} options - options e.g. {returnType: '', tag: ''}
   *
   * @return {Promise}
   *
   */
  approve: function (airdropContractAddress, airdropBudgetHolderPassphrase, gasPrice, chainId, options) {

    var approveObject = new Approve({
      airdropContractAddress: airdropContractAddress,
      airdropBudgetHolderPassphrase: airdropBudgetHolderPassphrase,
      gasPrice: gasPrice,
      chainId: chainId,
      options: options});
    return approveObject.perform();

  },

  /**
   * batch allocate to users
   *
   * @param {Hex} airdropContractAddress - airdrop contract address
   * @param {Hex} transactionHash - transfer transaction hash
   * @param {Object} airdropUsers - airdropUsers => {address: {airdropAmount:2, expiryTimestamp: timestamp}}
   *
   * @return {response}
   *
   */
  batchAllocate: function (airdropContractAddress, transactionHash, airdropUsers) {
    var batchAllocatorObject = new BatchAllocator({
      airdropContractAddress: airdropContractAddress,
      transactionHash: transactionHash,
      airdropUsers: airdropUsers
    });
    return batchAllocatorObject.perform();
  },

  /**
   * Get user airdrop balance
   *
   * @param {Array} userAddresses - array of user addresses
   *
   * @return {response}
   *
   */
  getUserAirdropBalance: function (userAddresses) {
    return {userAddress1: {airdropAmount: 'amountInWei', airdropAmountUsed: 'amountinWei'}};
  },


};

module.exports = new base();

