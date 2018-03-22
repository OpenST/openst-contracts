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
  , airdropContractInteract = require(rootPrefix + '/lib/contract_interact/airdrop')
  , brandedTokenContractInteract = require(rootPrefix + '/lib/contract_interact/branded_token')
  , BigNumber = require('bignumber.js')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , AirdropModelCacheKlass = require(rootPrefix + '/lib/cache_management/airdrop_model')
  , BrandedTokenKlass = require(rootPrefix + '/lib/contract_interact/branded_token')
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
  logger.debug("\n=========Transfer params=========");
  logger.debug(params);
  const oThis = this;
  oThis.senderAddress = params.senderAddress;
  oThis.senderPassphrase = params.senderPassphrase;
  oThis.airdropContractAddress = params.airdropContractAddress;
  oThis.amount = params.amount;
  oThis.gasPrice = params.gasPrice;
  oThis.chainId = params.chainId;
  oThis.options = params.options;

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
    logger.debug("\n=========Transfer.validateParams.result=========");
    logger.debug(r);
    if(r.isFailure()) return r;

    r = oThis.doTransfer();
    logger.debug("\n=========Transfer.doTransfer.result=========");
    logger.debug(r);
    return r;

  },

  /**
   * validation of params
   *
   * @return {Promise}
   *
   */
  validateParams: function() {
    const oThis = this;
    return new Promise(async function (onResolve, onReject) {

      if (!basicHelper.isAddressValid(oThis.senderAddress)) {
        return onResolve(responseHelper.error('l_am_t_vp_1', 'sender address is invalid'));
      }

      if (!basicHelper.isAddressValid(oThis.airdropContractAddress)) {
        return onResolve(responseHelper.error('l_am_v_vp_2', 'airdrop contract address is invalid'));
      }

      // Check if airdropContractAddress is registered or not

      const airdropModelCacheObject = new AirdropModelCacheKlass({useObject: true, contractAddress: oThis.airdropContractAddress})
        , airdropModelCacheResponse = await airdropModelCacheObject.fetch()
      ;
      oThis.airdropRecord = airdropModelCacheResponse.data[oThis.airdropContractAddress];
      if (!oThis.airdropRecord){
        return onResolve(responseHelper.error('l_am_ub_vp_3', 'Given airdrop contract is not registered'));
      }

      const airdropContractInteractObject = new airdropContractInteract(oThis.airdropContractAddress, oThis.chainId);
      var result = await airdropContractInteractObject.brandedToken();
      oThis.brandedTokenContractAddress = result.data.brandedToken;
      logger.debug("\n==========transfer.validateParams.brandedToken===========");
      logger.debug("\nairdropContractInteractObject.brandedToken():", result,"\noThis.brandedTokenContractAddress:", oThis.brandedTokenContractAddress);
      if (!basicHelper.isAddressValid(oThis.brandedTokenContractAddress)) {
        return onResolve(responseHelper.error('l_am_v_vp_4', 'brandedTokenContractAddress set in airdrop contract is invalid'));
      }

      result = await airdropContractInteractObject.airdropBudgetHolder();
      oThis.airdropBudgetHolderAddress = result.data.airdropBudgetHolder;
      if (!basicHelper.isAddressValid(oThis.brandedTokenContractAddress)) {
        return onResolve(responseHelper.error('l_am_v_vp_5', 'airdropBudgetHolderAddress set in airdrop contract is invalid'));
      }

      const amountInBigNumber = new BigNumber(oThis.amount);
      if (amountInBigNumber.isNaN() || !amountInBigNumber.isInteger()){
        return onResolve(responseHelper.error('l_am_v_vp_6', 'amount is invalid value'));
      }

      if (!basicHelper.isValidChainId(oThis.chainId)) {
        return onResolve(responseHelper.error('l_am_v_vp_7', 'ChainId is invalid'));
      }

      const brandedTokenObject = new BrandedTokenKlass(oThis.brandedTokenContractAddress, oThis.chainId);
      const senderBalanceResponse = await brandedTokenObject.getBalanceOf(oThis.senderAddress);

      if (senderBalanceResponse.isFailure()) {
        return onResolve(responseHelper.error('l_am_v_vp_8', 'Error while getting sender balance'));
      }

      const senderBalance = new BigNumber(senderBalanceResponse.data.balance);
      //logger.debug("senderBalance: "+senderBalance.toString(10), "amount to transfer: "+amountInBigNumber);
      if (senderBalance.lt(amountInBigNumber)){
        return onResolve(responseHelper.error('l_am_v_vp_9', 'Sender balance: '+ senderBalance.toString(10) +' is not enough to transfer amount: '+amountInBigNumber.toString(10)));
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
      logger.debug("\n==========doTransfer.oThis.brandedTokenContractAddress===========");
      logger.debug(oThis.brandedTokenContractAddress);
      var brandedTokenObject = new brandedTokenContractInteract(oThis.brandedTokenContractAddress, oThis.chainId);
      const transactionResponse = await brandedTokenObject.transferToAirdropBudgetHolder(oThis.senderAddress,
        oThis.senderPassphrase,
        oThis.airdropBudgetHolderAddress,
        oThis.amount,
        oThis.gasPrice,
        oThis.options);
      if (transactionResponse.isSuccess()){
        var airdropAllocationProofDetailModel = new airdropAllocationProofDetailKlass();
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

