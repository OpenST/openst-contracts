"use strict";

/**
 *
 * This class would be used for executing setOps.<br><br>
 *
 * @module services/ops_managed/set_ops
 *
 */

const rootPrefix = '../..'
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , OpsManagedContractInteractKlass = require(rootPrefix + '/lib/contract_interact/ops_managed_contract')
;

/**
 * Constructor to create object of set_ops
 *
 * @constructor
 *
 * @param {string} contract_address - contract address
 * @param {Hex} gas_price - gas price
 * @param {Number} chain_id - chain id
 * @param {string} deployer_address - deployer address
 * @param {string} deployer_passphrase - deployer passphrase
 * @param {string} ops_address - ops addresses
 * @param {object} options - options
 *
 * @return {Object}
 *
 */
const SetOpsKlass = function (params) {
  logger.debug("=======GetOpsKlass.params=======");
  // Don't log passphrase
  logger.debug(params.contract_address, params.gas_price, params.chain_id, params.deployer_address, params.ops_address, params.options);

  const oThis = this
  ;
  oThis.contractAddress = params.contract_address;
  oThis.gasPrice = params.gas_price;
  oThis.chainId = params.chain_id;
  oThis.deployerAddress = params.deployer_address;
  oThis.deployerPassphrase = params.deployer_passphrase;
  oThis.opsAddress = params.ops_address;
  oThis.options = params.options;

};

SetOpsKlass.prototype = {

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
      logger.debug("=======SetOpsKlass.validateParams.result=======");
      logger.debug(r);
      if (r.isFailure()) return r;

      r = await oThis.setOps();
      logger.debug("=======SetOpsKlass.setOps.result=======");
      logger.debug(r);

      return r;

    } catch (err) {
      return responseHelper.error('s_om_go_perform_1', 'Something went wrong. ' + err.message);
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
    if (!basicHelper.isAddressValid(oThis.contractAddress)) {
      return responseHelper.error('s_om_go_validateParams_1', 'contract address is invalid');
    }

    return responseHelper.successWithData({});
  },

  /**
   * set Ops
   *
   * @return {promise<result>}
   *
   */
  setOps: function () {
    const oThis = this
    ;

    const OpsManagedContractInteractObject = new OpsManagedContractInteractKlass(
      oThis.contractAddress,
      oThis.gasPrice,
      oThis.chainId
    );
    return OpsManagedContractInteractObject.setOpsAddress(
      oThis.deployerAddress,
      oThis.deployerPassphrase,
      oThis.opsAddress,
      oThis.options
    );
  }

};

module.exports = SetOpsKlass;