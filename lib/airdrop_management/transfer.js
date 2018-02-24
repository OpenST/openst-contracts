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
  , logger = require(rootPrefix + '/helpers/custom_console_logger');
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
  logger.info("\n=========Transfer params=========");
  logger.info(params);
  const oThis = this;
  oThis.senderAddress = params.senderAddress;
  oThis.senderPassphrase = params.senderPassphrase;
  oThis.airdropContractAddress = params.airdropContractAddress;
  oThis.amount = params.amount;
  oThis.gasPrice = params.gasPrice;
  oThis.chainId = params.chainId;
  oThis.options = Object.assign(params.options, {tag: 'Transfer.perform'});

  oThis.airdropBudgetHolder = null;
  oThis.brandedTokenContractAddress = null;

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
    logger.info("\n=========Transfer.validateParams.result=========");
    logger.info(r);
    if(r.isFailure()) return r;

    r = oThis.doTransfer();
    logger.info("\n=========Transfer.doTransfer.result=========");
    logger.info(r);
    return r;

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
      logger.info("\n==========transfer.validateParams.brandedToken===========");
      logger.info("\nairdropContractInteractObject.brandedToken():", result,"\noThis.brandedTokenContractAddress:", oThis.brandedTokenContractAddress);
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
      logger.info("\n==========doTransfer.oThis.brandedTokenContractAddress===========");
      logger.info(oThis.brandedTokenContractAddress);
      var brandedTokenObject = new brandedTokenContractInteract(oThis.brandedTokenContractAddress, oThis.chainId);
      const transactionResponse = await brandedTokenObject.transferToAirdropBudgetHolder(oThis.senderAddress,
        oThis.senderPassphrase,
        oThis.airdropBudgetHolderAddress,
        oThis.amount,
        oThis.gasPrice,
        oThis.options);
      if (transactionResponse.isSuccess){
        const airdropAllocationProofDetailCreateResult = await airdropAllocationProofDetailModel.createRecord(transactionResponse.data.transaction_hash, oThis.amount, 0);
        if (airdropAllocationProofDetailCreateResult.isFailure()) {
          return onResolve(airdropAllocationProofDetailCreateResult);
        }
      }
      return onResolve(transactionResponse);
    });
  }

};

module.exports = transfer;

