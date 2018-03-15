/**
 *
 * This class would be used for executing airdrop register.<br><br>
 *
 * @module lib/airdrop_management/register
 *
 */

const rootPrefix = '../..'
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , airdropKlass = require(rootPrefix + '/app/models/airdrop')
  , airdropContractInteract = require(rootPrefix + '/lib/contract_interact/airdrop')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
;

/**
 * Constructor to create object of register
 *
 * @constructor
 *
 * @param {Hex} airdropContractAddress - airdrop contract address
 * @param {Number} chainId - chain Id
 *
 * @return {Object}
 *
 */
const register = module.exports = function (params) {
  logger.debug("=======register.params=======");
  logger.debug(params);
  this.airdropContractAddress = params.airdropContractAddress;
  this.chainId = params.chainId;

};

register.prototype = {

  /**
   * Perform method
   *
   * @return {responseHelper}
   *
   */
  perform: async function () {

    const oThis = this
    ;

    var r = null;

    r = await oThis.validateParams();
    logger.debug("=======register.validateParams.result=======");
    logger.debug(r);
    if (r.isFailure()) return r;

    r = await oThis.runRegister();
    logger.debug("=======register.runRegister.result=======");
    logger.debug(r);
    return r;

  },

  /**
   * Validation of params
   *
   * @return {promise<result>}
   *
   */
  validateParams: function () {
    const oThis = this;
    return new Promise(async function (onResolve, onReject) {

      if (!basicHelper.isAddressValid(oThis.airdropContractAddress)) {
        return onResolve(responseHelper.error('l_am_r_validateParams_1', 'airdrop contract address is invalid'));
      }

      if (!basicHelper.isValidChainId(oThis.chainId)) {
        return onResolve(responseHelper.error('l_am_r_validateParams_2', 'ChainId is invalid'));
      }

      const airdropContractInteractObject = new airdropContractInteract(oThis.airdropContractAddress, oThis.chainId);
      var result = await airdropContractInteractObject.airdropBudgetHolder();
      const airdropBudgetHolderAddress = result.data.airdropBudgetHolder;
      if (!basicHelper.isAddressValid(airdropBudgetHolderAddress)) {
        return onResolve(responseHelper.error('l_am_r_validateParams_3', 'airdrop contract is invalid'));
      }

      // if address already present
      var airdropModel = new airdropKlass();
      result = await airdropModel.getByContractAddress(oThis.airdropContractAddress);
      const airdropRecord = result[0];
      if (airdropRecord) {
        return onResolve(responseHelper.error('l_am_r_validateParams_4', 'airdrop contract address is already registered'));
      }

      return onResolve(responseHelper.successWithData({}));
    });
  },

  /**
   * Run the register
   *
   * @return {promise<result>}
   *
   */
  runRegister: function () {
    const oThis = this
    ;

    return new Promise(async function (onResolve, onReject) {
      try {
        const airdropModelObject = {
          contract_address: oThis.airdropContractAddress
        };
        logger.debug("========register.runRegister.airdropModelObject=======");
        logger.debug(airdropModelObject);
        var airdropModel = new airdropKlass();
        const insertedRecord = await airdropModel.create(airdropModelObject);
        logger.debug("========register.runRegister.insertedRecord=======");
        logger.debug(insertedRecord);
        return onResolve(responseHelper.successWithData({insertId: insertedRecord.insertId}));
      } catch (err) {
        return onResolve(responseHelper.error('l_am_s_rs_1', 'Error creating airdrop record. ' + err));
      }
    });

  }

};

module.exports = register;

