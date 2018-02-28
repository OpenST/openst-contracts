/**
 *
 * This is a utility file which would be used for executing all methods related to airdrop.<br><br>
 *
 * @module lib/airdrop_management/base
 *
 */
const rootPrefix = '../..'
  , Register = require(rootPrefix + '/lib/airdrop_management/register')
  , Transfer = require(rootPrefix + '/lib/airdrop_management/transfer')
  , Approve = require(rootPrefix + '/lib/airdrop_management/approve')
  , BatchAllocator = require(rootPrefix + '/lib/airdrop_management/batch_allocator')
  , UserBalance = require(rootPrefix + '/lib/airdrop_management/user_balance')
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
   * Register Airdrop
   *
   * @param {Hex} airdropContractAddress - airdrop contract address
   * @param {Number} chainId - chain Id
   *
   * @return {Promise}
   *
   */
  registerAirdrop: function(airdropContractAddress, chainId) {
    return new Promise(async function (onResolve, onReject) {

      const registerAirdropObject = new Register({
        airdropContractAddress: airdropContractAddress,
        chainId: chainId
      });
      onResolve(registerAirdropObject.perform());

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
   * @param {Number} chainId - chainId
   *
   * @return {response}
   *
   */
  batchAllocate: function (airdropContractAddress, transactionHash, airdropUsers, chainId) {
    var batchAllocatorObject = new BatchAllocator({
      airdropContractAddress: airdropContractAddress,
      transactionHash: transactionHash,
      airdropUsers: airdropUsers,
      chainId: chainId
    });
    return batchAllocatorObject.perform();
  },

  /**
   * Get user airdrop balance
   *
   * @param {Integer} chainId - chain Id
   * @param {Hex} airdropContractAddress - airdrop contract address
   * @param {Array} userAddresses - array of user addresses
   *
   * @return {response} - {
   *   '0x934ebd34b2a4f16d4de16256df36a6013785557d': {totalAirdropAmount: '10000000000000000', totalAirdropUsedAmount: '10000000000000000', balanceAirdropAmount: '10000000000000000'},
   *   '0x934ebd34b2a4f16d4de16256df36a6013785557e': {totalAirdropAmount: '20000000000000000', totalAirdropUsedAmount: '20000000000000000', balanceAirdropAmount: '10000000000000000'}
   * }
   *
   */
  getAirdropBalance: function (chainId, airdropContractAddress, userAddresses) {
    var userBalance = new UserBalance({
      chainId: chainId,
      airdropContractAddress: airdropContractAddress,
      userAddresses: userAddresses
    });
    return userBalance.perform();
  },


};

module.exports = new base();

