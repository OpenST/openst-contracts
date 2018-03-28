"use strict";

/**
 *
 * This class would be used for deploying airdrop contract.<br><br>
 *
 * @module services/deploy/airdrop
 *
 */

const rootPrefix = '../..'
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , DeployerKlass = require(rootPrefix + '/services/deploy/deployer')
  , web3Provider = require(rootPrefix + '/lib/web3/providers/rpc')
;

/**
 * Constructor to create object of airdrop
 *
 * @constructor
 *
 * @return {Object}
 *
 */
const DeployAirdropKlass = function (params) {
  logger.debug("=======DeployAirdropKlass.params=======");
  logger.debug(params);

  const oThis = this;
  oThis.contractName = 'airdrop';
  oThis.brandedTokenContractAddress = params.branded_token_contract_address;
  oThis.baseCurrency = params.baseCurrency;
  oThis.workerContractAddress = params.worker_contract_address;
  oThis.airdropBudgetHolder = params.airdrop_budget_holder;
  oThis.gasPrice = params.gas_price;
  oThis.options = params.options;

  oThis.constructorArgs = [];
};

DeployAirdropKlass.prototype = {

  /**
   * Perform method
   *
   * @return {promise<result>}
   *
   */
  perform: async function () {
    const oThis = this
    ;
    try {
      var r = null;

      r = await oThis.validateParams();
      logger.debug("=======DeployAirdropKlass.validateParams.result=======");
      logger.debug(r);
      if (r.isFailure()) return r;

      r = await oThis.deploy();
      logger.debug("=======DeployAirdropKlass.setOps.result=======");
      logger.debug(r);

      return r;

    } catch (err) {
      return responseHelper.error('s_d_a_perform_1', 'Something went wrong. ' + err.message);
    }

  },

  /**
   * Validation of params
   *
   * @return {promise<result>}
   *
   */
  validateParams: function () {
    const oThis = this
    ;

    if (!oThis.gasPrice) {
      return responseHelper.error('s_d_a_validateParams_1', 'gas is mandatory');
    }

    if (!oThis.options) {
      return responseHelper.error('s_d_a_validateParams_2', 'options for txHash/txReceipt is mandatory');
    }

    if (!basicHelper.isAddressValid(oThis.brandedTokenContractAddress)) {
      return responseHelper.error('s_d_a_validateParams_3', 'branded contract address is invalid');
    }

    if (!basicHelper.isAddressValid(oThis.workerContractAddress)) {
      return responseHelper.error('s_d_a_validateParams_4', 'worker contract address is invalid');
    }

    if (!oThis.baseCurrency) {
      return responseHelper.error('s_d_a_validateParams_5', 'base currency is mandatory');
    }

    if (!basicHelper.isAddressValid(oThis.airdropBudgetHolder)) {
      return responseHelper.error('s_d_a_validateParams_6', 'airdropBudgetHolder address is invalid');
    }

    return responseHelper.successWithData({});
  },

  /**
   * deploy
   *
   * @return {promise<result>}
   *
   */
  deploy: function () {
    const oThis = this
    ;
    oThis.constructorArgs = [
      oThis.brandedTokenContractAddress,
      web3Provider.utils.asciiToHex(oThis.baseCurrency),
      oThis.workerContractAddress,
      oThis.airdropBudgetHolder
    ];
    const DeployerObject = new DeployerKlass({
      contract_name: oThis.contractName,
      constructor_args: oThis.constructorArgs,
      gas_price: oThis.gasPrice,
      options: oThis.options
    });
    return DeployerObject.perform();
  }

};

module.exports = DeployAirdropKlass;