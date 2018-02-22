/**
 *
 * This is a utility file which would be used for executing all methods related to airdrop.<br><br>
 *
 * @module lib/airdrop_management/base
 *
 */

const rootPrefix = '../..'
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , airdropAllocationProofDetailKlass = require(rootPrefix + '/app/models/airdrop_allocation_proof_detail')
  , airdropAllocationProofDetailModel = new airdropAllocationProofDetailKlass()
  , airdropContractInteract = require(rootPrefix + '/lib/contract_interact/airdrop')
  , brandedTokenContractInteract = require(rootPrefix + '/lib/contract_interact/branded_token')
  , BigNumber = require('bignumber.js')
  , helper = require(rootPrefix + '/lib/contract_interact/helper')
;

const transfer = module.exports = function(params) {
  this.senderAddress = params.senderAddress;
  this.senderPassphrase = params.senderPassphrase;
  this.airdropContractAddress = params.airdropContractAddress;
  this.amount = params.amount;
  this.gasPrice = params.gasPrice;
  this.chainId = params.chainId;
  this.options = params.options;

  this.airdropBudgetHolder = null;
  this.brandedTokenContractAddress = null;

};

transfer.prototype = {

  perform: async function () {

    const oThis = this;

    var r = null;

    r = await oThis.validateParams();
    if(r.isFailure()) return r;

    return oThis.doTransfer();

  },

  validateParams: function(){
    const oThis = this;
    return new Promise(async function (onResolve, onReject) {

      if (!helper.isAddressValid(oThis.senderAddress)) {
        return onResolve(responseHelper.error('l_am_t_vp_1', 'sender address is invalid'));
      }

      if (!helper.isAddressValid(oThis.airdropContractAddress)) {
        return onResolve(responseHelper.error('l_am_v_vp_2', 'airdrop contract address is invalid'));
      }

      const airdropContractInteractObject = new airdropContractInteract(oThis.airdropContractAddress, oThis.chainId);
      var result = await airdropContractInteractObject.brandedToken();
      oThis.brandedTokenContractAddress = result.data.brandedToken;
      if (!helper.isAddressValid(oThis.brandedTokenContractAddress)) {
        return onResolve(responseHelper.error('l_am_v_vp_3', 'brandedTokenContractAddress set in airdrop contract is invalid'));
      }

      result = await airdropContractInteractObject.airdropBudgetHolder();
      oThis.airdropBudgetHolderAddress = result.data.airdropBudgetHolder;
      if (!helper.isAddressValid(oThis.brandedTokenContractAddress)) {
        return onResolve(responseHelper.error('l_am_v_vp_4', 'airdropBudgetHolderAddress set in airdrop contract is invalid'));
      }

      const amountInBigNumber = new BigNumber(oThis.amount);
      if (amountInBigNumber.isNaN() || !amountInBigNumber.isInteger()){
        return onResolve(responseHelper.error('l_am_v_vp_5', 'amount is invalid value'));
      }

      return onResolve(responseHelper.successWithData({}));

    });

  },

  doTransfer: async function() {
    const oThis = this;

    return new Promise(async function (onResolve, onReject) {

      // BrandedToken transfer
      var brandedTokenObject =  new brandedTokenContractInteract(brandedTokenContractAddress, oThis.chainId);
      brandedTokenObject.transferToAirdropBudgetHolder(oThis.senderAddress,
        oThis.senderPassphrase,
        airdropBudgetHolderAddress,
        oThis.amount,
        oThis.gasPrice,
        oThis.options)
        .then( async function(response){
          // Create entry in airdrop_allocation_proof_details
          var response  = await airdropAllocationProofDetailModel.createRecord(response.data.transaction_hash, oThis.amount, 0);
          return onResolve(response);
        });

    });

  }

};

module.exports = transfer;

