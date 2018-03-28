"use strict";

/**
 *
 * This class would be used for executing airdrop register.<br><br>
 *
 * @module services/airdrop_management/register
 *
 */

const rootPrefix = '../..'
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , airdropKlass = require(rootPrefix + '/app/models/airdrop')
  , airdropContractInteract = require(rootPrefix + '/lib/contract_interact/airdrop')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , AirdropModelCacheKlass = require(rootPrefix + '/lib/cache_management/airdrop_model')
;

/**
 * Constructor to create object of register
 *
 * @constructor
 *
 * @param {Hex} airdrop_contract_address - airdrop contract address
 * @param {Number} chain_id - chain Id
 *
 * @return {Object}
 *
 */
const RegisterKlass = function (params) {
  logger.debug("=======register.params=======");
  logger.debug(params);
  this.airdropContractAddress = params.airdrop_contract_address;
  this.chainId = params.chain_id;

};

RegisterKlass.prototype = {

  /**
   * Perform method
   *
   * @return {responseHelper}
   *
   */
  perform: async function () {

    const oThis = this
    ;
    try {
      var r = null;

      r = await oThis.validateParams();
      logger.debug("=======register.validateParams.result=======");
      logger.debug(r);
      if (r.isFailure()) return r;

      r = await oThis.runRegister();
      logger.debug("=======register.runRegister.result=======");
      logger.debug(r);
      return r;
    } catch(err) {
      return responseHelper.error('s_am_r_perform_1', 'Something went wrong. ' + err.message);
    }

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
        return onResolve(responseHelper.error('s_am_r_validateParams_1', 'airdrop contract address is invalid'));
      }

      if (!basicHelper.isValidChainId(oThis.chainId)) {
        return onResolve(responseHelper.error('s_am_r_validateParams_2', 'ChainId is invalid'));
      }

      const airdropContractInteractObject = new airdropContractInteract(oThis.airdropContractAddress, oThis.chainId);
      var result = await airdropContractInteractObject.airdropBudgetHolder();
      const airdropBudgetHolderAddress = result.data.airdropBudgetHolder;
      if (!basicHelper.isAddressValid(airdropBudgetHolderAddress)) {
        return onResolve(responseHelper.error('s_am_r_validateParams_3', 'airdrop contract is invalid'));
      }

      // Check if airdropContractAddress is registered or not
      const airdropModelCacheObject = new AirdropModelCacheKlass({useObject: true, contractAddress: oThis.airdropContractAddress})
        , airdropModelCacheResponse = await airdropModelCacheObject.fetch()
        , airdropRecord = airdropModelCacheResponse.data[oThis.airdropContractAddress];
      ;
      if (airdropRecord) {
        return onResolve(responseHelper.error('s_am_r_validateParams_4', 'airdrop contract address is already registered'));
      }

      if (!basicHelper.isValidChainId(oThis.chainId)) {
        return onResolve(responseHelper.error('s_am_r_validateParams_5', 'ChainId is invalid'));
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
        const airdropModelCacheObject = new AirdropModelCacheKlass({useObject: true, contractAddress: oThis.airdropContractAddress});
        await airdropModelCacheObject.clear();
        return onResolve(responseHelper.successWithData({insertId: insertedRecord.insertId}));
      } catch (err) {
        return onResolve(responseHelper.error('s_am_r_runRegister_1', 'Error creating airdrop record. ' + err));
      }
    });

  }

};

module.exports = RegisterKlass;

