"use strict";

/**
 *
 * This class would be used for executing airdrop register.<br><br>
 *
 * @module services/workers/set_worker
 *
 */

const rootPrefix = '../..'
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , BigNumber = require('bignumber.js')
  , WorkersContractInteractKlass = require(rootPrefix + '/lib/contract_interact/workers')
;

/**
 * Constructor to create object of register
 *
 * @constructor
 *
 * @param {object} params -
 * @param {string} params.workers_contract_address - contract address of workers
 * @param {string} params.sender_address - address of sender
 * @param {string} params.sender_passphrase - passphrase of sender
 * @param {string} params.worker_address - worker address
 * @param {number} params.deactivation_height - block number till which the worker is valid
 * @param {bignumber} params.gas_price - gas price
 * @param {number} params.chain_id - chain id
 * @param {object} params.options - for params like returnType, tag.
 *
 * @return {object}
 *
 */
const SetWorkerKlass = function (params) {
  const oThis = this;
  params = params || {};
  logger.debug("=======SetWorkerKlass.params=======");
  // Don't log passphrase
  logger.debug(params.workers_contract_address, params.sender_address, params.worker_address, params.deactivation_height, params.gas_price, params.chain_id, params.options);

  oThis.workersContractAddress = params.workers_contract_address;
  oThis.senderAddress = params.sender_address;
  oThis.senderPassphrase = params.sender_passphrase;
  oThis.workerAddress = params.worker_address;
  oThis.deactivationHeight = params.deactivation_height;
  oThis.gasPrice = params.gas_price;
  oThis.chainId = params.chain_id;
  oThis.options = params.options

};

SetWorkerKlass.prototype = {

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
      logger.debug("=======SetWorkerKlass.validateParams.result=======");
      logger.debug(r);
      if (r.isFailure()) return r;

      r = await oThis.setWorker();
      logger.debug("=======SetWorkerKlass.setWorker.result=======");
      logger.debug(r);

      return r;

    } catch (err) {
      return responseHelper.error('s_w_sw_perform_1', 'Something went wrong. ' + err.message);
    }

  },

  /**
   * Validation of params
   *
   * @return {result}
   *
   */
  validateParams: function () {
    const oThis = this;
    if (!basicHelper.isAddressValid(oThis.workersContractAddress)) {
      return responseHelper.error('s_w_sw_validateParams_1', 'workers contract address is invalid');
    }
    if (!oThis.gasPrice) {
      return responseHelper.error('s_w_sw_validateParams_2', 'gas is mandatory');
    }
    if (!basicHelper.isAddressValid(oThis.senderAddress)) {
      return responseHelper.error('s_w_sw_validateParams_3', 'sender address is invalid');
    }
    if (!basicHelper.isAddressValid(oThis.workerAddress)) {
      return responseHelper.error('s_w_sw_validateParams_4', 'worker address is invalid');
    }
    if (!oThis.deactivationHeight) {
      return responseHelper.error('s_w_sw_validateParams_5', 'deactivation height is mandatory');
    }
    const deactivationHeight = new BigNumber(oThis.deactivationHeight);
    if (deactivationHeight.isNaN() || deactivationHeight.lt(0) || !deactivationHeight.isInteger()) {
      return responseHelper.error('s_w_sw_validateParams_6', 'deactivation height value is invalid');
    }

    if (!oThis.gasPrice) {
      return responseHelper.error('s_w_sw_validateParams_7', 'gas is mandatory');
    }

    if (!basicHelper.isValidChainId(oThis.chainId)) {
      return responseHelper.error('s_w_sw_validateParams_8', 'ChainId is invalid');
    }

    return responseHelper.successWithData({});
  },

  /**
   * Set Worker
   *
   * @return {promise<result>}
   *
   */
  setWorker: function () {
    const oThis = this
    ;

    const workersContractInteractObject = new WorkersContractInteractKlass(
      oThis.workersContractAddress,
      oThis.chainId
    );
    return workersContractInteractObject.setWorker(
      oThis.senderAddress,
      oThis.senderPassphrase,
      oThis.workerAddress,
      oThis.deactivationHeight.toString(10),
      oThis.gasPrice,
      oThis.options
    );
  }

};

module.exports = SetWorkerKlass;