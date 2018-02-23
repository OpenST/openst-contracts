/**
 *
 * This is a utility file which would be used for executing transfer amount to airdrop budget holder.<br><br>
 *
 * @module lib/airdrop_management/transfer
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
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
;

/**
 * Constructor to create object of transfer
 *
 * @constructor
 *
 * @param {Hex} senderAddress - sender address
 * @param {String} senderPassphrase - sender Passphrase
 * @param {Hex} airdropContractAddress - airdrop contract address
 * @param {String} amount - amount in wei
 * @param {String} gasPrice - gas price
 * @param {Number} chainId - chain Id
 * @param {Object} options - chain Id
 *
 * @return {Object}
 *
 */
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

  /**
   * Perform method
   *
   * @return {Promise}
   *
   */
  perform: async function () {

    const oThis = this;

    var r = null;

    r = await oThis.validateParams();
    if(r.isFailure()) return r;

    return oThis.doTransfer();

  },

  /**
   * validation of params
   *
   * @return {Promise}
   *
   */
  validateParams: function(){
    const oThis = this;
    return new Promise(async function (onResolve, onReject) {

      if (!basicHelper.isAddressValid(oThis.senderAddress)) {
        return onResolve(responseHelper.error('l_am_t_vp_1', 'sender address is invalid'));
      }

      if (!basicHelper.isAddressValid(oThis.airdropContractAddress)) {
        return onResolve(responseHelper.error('l_am_v_vp_2', 'airdrop contract address is invalid'));
      }

      const airdropContractInteractObject = new airdropContractInteract(oThis.airdropContractAddress, oThis.chainId);
      var result = await airdropContractInteractObject.brandedToken();
      oThis.brandedTokenContractAddress = result.data.brandedToken;
      if (!basicHelper.isAddressValid(oThis.brandedTokenContractAddress)) {
        return onResolve(responseHelper.error('l_am_v_vp_3', 'brandedTokenContractAddress set in airdrop contract is invalid'));
      }

      result = await airdropContractInteractObject.airdropBudgetHolder();
      oThis.airdropBudgetHolderAddress = result.data.airdropBudgetHolder;
      if (!basicHelper.isAddressValid(oThis.brandedTokenContractAddress)) {
        return onResolve(responseHelper.error('l_am_v_vp_4', 'airdropBudgetHolderAddress set in airdrop contract is invalid'));
      }

      const amountInBigNumber = new BigNumber(oThis.amount);
      if (amountInBigNumber.isNaN() || !amountInBigNumber.isInteger()){
        return onResolve(responseHelper.error('l_am_v_vp_5', 'amount is invalid value'));
      }

      if (!basicHelper.isValidChainId(oThis.chainId)) {
        return onResolve(responseHelper.error('l_am_v_vp_6', 'ChainId is invalid'));
      }

      return onResolve(responseHelper.successWithData({}));

    });

  },

  /**
   * Transfer amount to airdrop budget holder
   *
   * @return {Promise}
   *
   */
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

