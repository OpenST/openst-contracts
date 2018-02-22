/**
 *
 * This is a utility file which would be used for executing all methods related to airdrop.<br><br>
 *
 * @module lib/airdrop_management/base
 *
 */

const rootPrefix = '../..'
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , airdropContractInteract = require(rootPrefix + '/lib/contract_interact/airdrop')
  , brandedTokenContractInteract = require(rootPrefix + '/lib/contract_interact/branded_token')
  , BigNumber = require('bignumber.js')
  , helper = require(rootPrefix + '/lib/contract_interact/helper')
;

const approve = module.exports = function(params) {
  this.airdropContractAddress = params.airdropContractAddress;
  this.airdropBudgetHolderPassphrase = params.airdropBudgetHolderPassphrase;
  this.gasPrice = params.gasPrice;
  this.chainId = params.chainId;
  this.options = params.options;

  this.airdropBudgetHolder = null;
  this.brandedTokenContractAddress = null;
  this.amount = null;
  this.brandedTokenObject = null;
};

approve.prototype = {

  perform: async function () {

    const oThis = this;

    var r = null;

    r = await oThis.validateParams();
    if(r.isFailure()) return r;

    return oThis.doApprove();

  },

  validateParams: function(){
    const oThis = this;
    return new Promise(async function (onResolve, onReject) {

      if (!helper.isAddressValid(oThis.airdropContractAddress)) {
        return responseHelper.error('l_am_a_vp_1', 'airdrop contract address is invalid');
      }

      var airdropContractInteractObject = new airdropContractInteract(oThis.airdropContractAddress, oThis.chainId);
      var result = await airdropContractInteractObject.brandedToken();
      oThis.brandedTokenContractAddress = result.data.brandedToken;
      if (!helper.isAddressValid(oThis.brandedTokenContractAddress)) {
        return onResolve(responseHelper.error('l_am_a_vp_2', 'brandedTokenContractAddress set in airdrop contract is invalid'));
      }

      result = await airdropContractInteractObject.airdropBudgetHolder();
      oThis.airdropBudgetHolderAddress = result.data.airdropBudgetHolder;
      if (!helper.isAddressValid(oThis.airdropBudgetHolderAddress)) {
        return onResolve(responseHelper.error('l_am_a_vp_3', 'airdropBudgetHolderAddress set in airdrop contract is invalid'));
      }

      oThis.brandedTokenObject = new brandedTokenContractInteract(oThis.brandedTokenContractAddress, oThis.chainId);
      result = await oThis.brandedTokenObject.getBalanceOf(oThis.airdropBudgetHolderAddress);
      oThis.amount = result.data.balance;
      const amountInBigNumber = new BigNumber(oThis.amount);
      if (amountInBigNumber.isNaN() || !amountInBigNumber.isInteger()){
        return onResolve(responseHelper.error('l_am_v_vp_4', 'amount is invalid value'));
      }

      return onResolve(responseHelper.successWithData({}));

    });

  },

  doApprove: async function(){
    const oThis = this;

    return new Promise(function (onResolve, onReject) {

      // Approve to budget holder
      oThis.brandedTokenObject.approveByBudgetHolder(airdropBudgetHolderAddress,
        oThis.airdropBudgetHolderPassphrase,
        oThis.airdropContractAddress,
        oThis.amount,
        oThis.gasPrice,
        oThis.options)
        .then( function(response){
          return onResolve(response);
        });

    });

  }

};

module.exports = approve;