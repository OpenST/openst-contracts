/**
 *
 * This class would be used for calculating user airdrop balance.<br><br>
 *
 * @module lib/airdrop_management/user_balance
 *
 */

const rootPrefix = '../..'
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , airdropKlass = require(rootPrefix + '/app/models/airdrop')
  , helper = require(rootPrefix + '/lib/contract_interact/helper')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , userAirdropDetailCacheKlass = require(rootPrefix + '/lib/cache_management/user_airdrop_detail')
;

/**
 * Constructor to create object of userBalance
 *
 * @constructor
 *
 * @param {Number} chainId - chain Id
 * @param {Hex} airdropContractAddress - airdrop contract address
 * @param {Array} userAddresses - Array of user addressed
 *
 * @return {Object}
 *
 */
const userBalance = module.exports = function(params) {
  logger.info("=======user_balance.params=======");
  logger.info(params);
  const oThis = this;
  oThis.airdropContractAddress = params.airdropContractAddress;
  oThis.chainId = params.chainId;
  oThis.userAddresses = params.userAddresses;

  oThis.airdropRecord = null;

};

userBalance.prototype = {

  /**
   * Perform method
   *
   * @return {responseHelper}
   *
   */
  perform: async function () {

    const oThis = this;

    var r = null;

    r = await oThis.validateParams();
    logger.info("=======userBalance.validateParams.result=======");
    logger.info(r);
    if(r.isFailure()) return r;

    r = await oThis.getUserAirdropBalance();
    logger.info("=======userBalance.getUserAirdropBalance.result=======");
    logger.info(r);
    return r;

  },

  /**
   * Validation of params
   *
   * @return {Promise}
   *
   */
  validateParams: function(){
    const oThis = this;
    return new Promise(async function (onResolve, onReject) {

      if (!basicHelper.isAddressValid(oThis.airdropContractAddress)) {
        return onResolve(responseHelper.error('l_am_ub_vp_1', 'airdrop contract address is invalid'));
      }

      if (!basicHelper.isValidChainId(oThis.chainId)) {
        return onResolve(responseHelper.error('l_am_ub_vp_2', 'ChainId is invalid'));
      }

      // if address already present
      var airdropModel = new airdropKlass();
      var result = await airdropModel.getByContractAddress(oThis.airdropContractAddress);
      oThis.airdropRecord = result[0];
      if (!oThis.airdropRecord){
        return onResolve(responseHelper.error('l_am_ub_vp_3', 'Given airdrop contract is not registered'));
      }

      return onResolve(responseHelper.successWithData({}));
    });

  },

  /**
   * Run the register
   *
   * @return {Promise}
   *
   */
  getUserAirdropBalance: function() {
    const oThis = this;
    return new Promise(async function (onResolve, onReject) {
      try {
        const userAirdropDetailCacheKlassObject =  new userAirdropDetailCacheKlass({
          chainId: oThis.chainId,
          airdropId: oThis.airdropRecord.id,
          userAddresses: oThis.userAddresses
          });
        return onResolve(await userAirdropDetailCacheKlassObject.fetch());
      } catch(err){
        return onResolve(responseHelper.error('l_am_ub_vp_4', 'getUserAirdropBalance error: '+err));
      }
    });

  }

};

module.exports = userBalance;

