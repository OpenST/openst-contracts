"use strict";

/**
 *
 * This class would be used for executing worker is_worker.<br><br>
 *
 * @module services/workers/is_worker
 *
 */

const rootPrefix = '../..'
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , WorkersContractInteractKlass = require(rootPrefix + '/lib/contract_interact/workers')
;

/**
 * Constructor to create object of register
 *
 * @constructor
 *
 * @param {string} workers_contract_address - contract address of workers
 * @param {string} worker_address - worker address
 * @param {object} chain_id - chain id
 *
 * @return {Object}
 *
 */
const IsWorkerKlass = function (params) {
  logger.debug("=======IsWorkerKlass.params=======");
  logger.debug(params);

  const oThis = this
  ;

  oThis.workersContractAddress = params.workers_contract_address;
  oThis.workerAddress = params.worker_address;
  oThis.chainId = params.chain_id;

};

IsWorkerKlass.prototype = {

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
      logger.debug("=======IsWorkerKlass.validateParams.result=======");
      logger.debug(r);
      if (r.isFailure()) return r;

      r = await oThis.isWorker();
      logger.debug("=======IsWorkerKlass.setWorker.result=======");
      logger.debug(r);

      return r;

    } catch (err) {
      return responseHelper.error('s_w_iw_perform_1', 'Something went wrong. ' + err.message);
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
    if (!basicHelper.isAddressValid(oThis.workerAddress)) {
      return responseHelper.error('s_w_iw_validateParams_1', 'worker address is invalid');
    }

    if (!basicHelper.isValidChainId(oThis.chainId)) {
      return responseHelper.error('s_w_iw_validateParams_2', 'ChainId is invalid');
    }

    return responseHelper.successWithData({});
  },

  /**
   * is Worker
   *
   * @return {promise<result>}
   *
   */
  isWorker: function () {
    const oThis = this
    ;
    const workersContractInteractObject = new WorkersContractInteractKlass(
      oThis.workersContractAddress,
      oThis.chainId
    );
    return workersContractInteractObject.isWorker(oThis.workerAddress);
  }

};

module.exports = IsWorkerKlass;