"use strict";

/**
 *
 * This class would be used for deploying worker contract.<br><br>
 *
 * @module services/deploy/worker
 *
 */

const rootPrefix = '../..'
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , DeployerKlass = require(rootPrefix + '/services/deploy/deployer')
;

/**
 * Constructor to create object of worker
 *
 * @param {object} params -
 * @param {string} params.gas_price - gas price
 * @param {number} params.chain_id - chain id
 * @param {object} params.options - deployment options e.g. {returnType: 'txReceipt'}
 *
 * @constructor
 *
 */
const DeployWorkerKlass = function (params) {
  const oThis = this;
  params = params || {};
  logger.debug("=======DeployWorkerKlass.params=======");
  // Don't log passphrase
  logger.debug(params);

  oThis.contractName = 'workers';
  oThis.gasPrice = params.gas_price;
  oThis.options = params.options;

  oThis.constructorArgs = [];
};

DeployWorkerKlass.prototype = {

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
      logger.debug("=======DeployWorkerKlass.validateParams.result=======");
      logger.debug(r);
      if (r.isFailure()) return r;

      r = await oThis.deploy();
      logger.debug("=======DeployWorkerKlass.setOps.result=======");
      logger.debug(r);

      return r;

    } catch (err) {
      return responseHelper.error('s_d_w_perform_1', 'Something went wrong. ' + err.message);
    }

  },

  /**
   * Validation of params
   *
   * @return {result}
   *
   */
  validateParams: function () {
    const oThis = this
    ;

    if (!oThis.gasPrice) {
      return responseHelper.error('s_d_w_validateParams_1', 'gas is mandatory');
    }

    if (!oThis.options) {
      return responseHelper.error('s_d_w_validateParams_2', 'options for txHash/txReceipt is mandatory');
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
    const DeployerObject = new DeployerKlass({
      contract_name: oThis.contractName,
      constructor_args: oThis.constructorArgs,
      gas_price: oThis.gasPrice,
      options: oThis.options
    });
    return DeployerObject.perform();
  }

};

module.exports = DeployWorkerKlass;