/**
 *
 * This is a utility file which would be used for executing all methods related to airdrop.<br><br>
 *
 * @module lib/airdrop_management/base
 *
 */

const rootPrefix = '../..'
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , validator = require(rootPrefix + '/lib/airdrop_management/validator')
  , airdropKlass = require(rootPrefix + '/app/models/airdrop')
  , airdropModel = new airdropKlass()
  , airdropContractInteract = require(rootPrefix + '/lib/contract_interact/airdrop')
  , brandedTokenContractInteract = require(rootPrefix + '/lib/contract_interact/branded_token')
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

  setupAirdrop: function(airdropContractAddress) {

    return new Promise(async function (onResolve, onReject) {

      var validationResponse = validator.validateCreateAirdropParams(airdropContractAddress);
      if (validationResponse.isFailure()) {
        return onResolve(validationResponse);
      }
      try {
          const insertedRecord = await airdropModel.create({
            contract_address: airdropContractAddress
        });
        return onResolve(responseHelper.successWithData({response: insertedRecord}));

      } catch(err){

        return onResolve(responseHelper.error('l_am_b_1', 'Error creating airdrop record:'+err));

      }
    });

  },

  transfer: function (senderAddress, senderPassphrase, airdropContractAddress, amount, gasPrice, chainId, options) {

    return new Promise(async function (onResolve, onReject) {
      var airdropContractObject = new airdropContractInteract(airdropContractAddress, chainId);
      const result = await airdropContractObject.brandedToken();
      const brandedTokenContractAddress = result.data.brandedToken;
      const airdropBudgetHolderAddress = await airdropContractObject.airdropBudgetHolder();
      var validationResponse = validator.validateTransferAirdropParams(senderAddress,
        brandedTokenContractAddress,
        airdropContractAddress,
        airdropBudgetHolderAddress,
        amount);
      if (validationResponse.isFailure()) {
        return onResolve(validationResponse);
      }
      // BrandedToken transfer
      var brandedTokenObject =  new brandedTokenContractInteract(brandedTokenContractAddress, chainId);
      brandedTokenObject.transferToAirdropBudgetHolder(senderAddress,
        senderPassphrase,
        airdropBudgetHolderAddress,
        amount,
        gasPrice,
        options).then( function(response){
        // Create entry in airdrop_allocation_proof_details
        return onResolve(response);
      });

    });
  },

  approve: function (airdropContractAddress, gasPrice, chainId, options) {

    return new Promise(function (onResolve, onReject) {
      var validationResponse = validator.validateApproveAirdropParams(airdropContractAddress);
      if (validationResponse.isFailure()) {
        return onResolve(validationResponse);
      }
      // Approve to budget holder
      var brandedTokenObject =  new brandedTokenContractInteract(brandedTokenContractAddress, chainId);
      brandedTokenObject.approveByBudgetHolder(airdropBudgetHolderAddress,
        airdropBudgetHolderPassphrase,
        airdropContractAddress,
        amount,
        gasPrice,
        options).then( function(response){
        return onResolve(response);
      });

    });

  },

  batchAllocate: function (airdropContractAddress, transactionHash, airdropUsers) {
    return new Promise(async function (onResolve, onReject) {
      airdropId = '';


      return onResolve();

    });
  },

};

module.exports = new base();

