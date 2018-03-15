/**
 *
 * This is a utility file which would be used for executing approve by airdrop budget holder.<br><br>
 *
 * @module lib/airdrop_management/approve
 *
 */

const rootPrefix = '../..'
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , airdropContractInteract = require(rootPrefix + '/lib/contract_interact/airdrop')
  , brandedTokenContractInteract = require(rootPrefix + '/lib/contract_interact/branded_token')
  , BigNumber = require('bignumber.js')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , AirdropModelCacheKlass = require(rootPrefix + '/lib/cache_management/airdrop_model')
;

/**
 * Constructor to create object of approve
 *
 * @constructor
 *
 * @param {Hex} airdropContractAddress - airdrop contract address
 * @param {String} airdropBudgetHolderPassphrase - airdropBudgetHolder Passphrase
 * @param {String} gasPrice - gas price
 * @param {Number} chainId - chain Id
 * @param {Object} options - chain Id
 *
 * @return {Object}
 *
 */
const approve = module.exports = function(params) {
  logger.debug("=========Approve.params=========");
  logger.debug(params.airdropContractAddress, params.gasPrice, params.chainId, params.options);
  const oThis = this;
  oThis.airdropContractAddress = params.airdropContractAddress;
  oThis.airdropBudgetHolderPassphrase = params.airdropBudgetHolderPassphrase;
  oThis.gasPrice = params.gasPrice;
  oThis.chainId = params.chainId;
  oThis.options = params.options;

  oThis.airdropBudgetHolder = null;
  oThis.brandedTokenContractAddress = null;
  oThis.amount = null;
  oThis.brandedTokenObject = null;
};

approve.prototype = {

  /**
   * Perform approve by airdrop budget holder to contract
   *
   * @return {Promise}
   *
   */
  perform: async function () {

    const oThis = this;

    var r = null;

    r = await oThis.validateParams();
    logger.debug("\n=========Approve.validateParams.result=========");
    logger.debug(r);
    if(r.isFailure()) return r;

    r = oThis.doApprove();
    logger.debug("\n=========Approve.doApprove.result=========");
    logger.debug(r);
    return r;

  },

  /**
   * Validate params
   *
   * @return {Promise}
   *
   */
  validateParams: function(){
    const oThis = this;
    return new Promise(async function (onResolve, onReject) {

      if (!basicHelper.isAddressValid(oThis.airdropContractAddress)) {
        return onResolve(responseHelper.error('l_am_a_vp_1', 'airdrop contract address is invalid'));
      }

      // Check if airdropContractAddress is registered or not
      const airdropModelCacheObject = new AirdropModelCacheKlass({useObject: true, contractAddress: oThis.airdropContractAddress})
        , airdropModelCacheResponse = await airdropModelCacheObject.fetch()
       ;
      oThis.airdropRecord = airdropModelCacheResponse.data[oThis.airdropContractAddress.toLowerCase()];
      if (!oThis.airdropRecord){
        return onResolve(responseHelper.error('l_am_ub_vp_2', 'Given airdrop contract is not registered'));
      }

      var airdropContractInteractObject = new airdropContractInteract(oThis.airdropContractAddress, oThis.chainId);
      var result = await airdropContractInteractObject.brandedToken();
      oThis.brandedTokenContractAddress = result.data.brandedToken;
      if (!basicHelper.isAddressValid(oThis.brandedTokenContractAddress)) {
        return onResolve(responseHelper.error('l_am_a_vp_2', 'brandedTokenContractAddress set in airdrop contract is invalid'));
      }

      result = await airdropContractInteractObject.airdropBudgetHolder();
      oThis.airdropBudgetHolderAddress = result.data.airdropBudgetHolder;
      if (!basicHelper.isAddressValid(oThis.airdropBudgetHolderAddress)) {
        return onResolve(responseHelper.error('l_am_a_vp_3', 'airdropBudgetHolderAddress set in airdrop contract is invalid'));
      }

      oThis.brandedTokenObject = new brandedTokenContractInteract(oThis.brandedTokenContractAddress, oThis.chainId);
      result = await oThis.brandedTokenObject.getBalanceOf(oThis.airdropBudgetHolderAddress);
      oThis.amount = result.data.balance;
      const amountInBigNumber = new BigNumber(oThis.amount);
      if (amountInBigNumber.isNaN() || !amountInBigNumber.isInteger()){
        return onResolve(responseHelper.error('l_am_v_vp_4', 'amount is invalid value'));
      }

      if (!basicHelper.isValidChainId(oThis.chainId)) {
        return onResolve(responseHelper.error('l_am_v_vp_5', 'ChainId is invalid'));
      }

      return onResolve(responseHelper.successWithData({}));

    });

  },

  /**
   * Perform Approve to airdrop budget holder
   *
   * @return {Promise}
   *
   */
  doApprove: async function(){
    const oThis = this;
    return new Promise(async function (onResolve, onReject) {
      // Approve to budget holder
      const approveByBudgetHolderResponse = await oThis.brandedTokenObject.approveByBudgetHolder(oThis.airdropBudgetHolderAddress,
        oThis.airdropBudgetHolderPassphrase,
        oThis.airdropContractAddress,
        oThis.amount,
        oThis.gasPrice,
        oThis.options);
      logger.debug("\n=========Transfer.doApprove.response=========");
      logger.debug(approveByBudgetHolderResponse);
      return onResolve(approveByBudgetHolderResponse);
    });

  }

};

module.exports = approve;