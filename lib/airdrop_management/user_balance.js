/**
 *
 * This class would be used for calculating user airdrop balance.<br><br>
 *
 * @module lib/airdrop_management/user_balance
 *
 */

const rootPrefix = '../..'
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , userAirdropDetailCacheKlass = require(rootPrefix + '/lib/cache_multi_management/user_airdrop_detail')
  , AirdropModelCacheKlass = require(rootPrefix + '/lib/cache_management/airdrop_model')
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
const AirdropUserBalanceKlass = function(params) {
  logger.debug("=======user_balance.params=======");
  logger.debug(params);
  const oThis = this;
  oThis.airdropContractAddress = params.airdropContractAddress;
  oThis.chainId = params.chainId;
  oThis.userAddresses = params.userAddresses;

  oThis.airdropRecord = null;

};

AirdropUserBalanceKlass.prototype = {

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
    logger.debug("=======userBalance.validateParams.result=======");
    logger.debug(r);
    if(r.isFailure()) return r;

    r = await oThis.getUserAirdropBalance();
    logger.debug("=======userBalance.getUserAirdropBalance.result=======");
    logger.debug(r);
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
      const airdropModelCacheObject = new AirdropModelCacheKlass({useObject: true, contractAddress: oThis.airdropContractAddress})
        , airdropModelCacheResponse = await airdropModelCacheObject.fetch()
      ;
      oThis.airdropRecord = airdropModelCacheResponse.data[oThis.airdropContractAddress];
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

module.exports = AirdropUserBalanceKlass;

