/**
 *
 * This class would be used for executing airdrop setup.<br><br>
 *
 * @module lib/airdrop_management/setup
 *
 */

const rootPrefix = '../..'
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , airdropKlass = require(rootPrefix + '/app/models/airdrop')
  , airdropModel = new airdropKlass()
  , helper = require(rootPrefix + '/lib/contract_interact/helper')
  , airdropContractInteract = require(rootPrefix + '/lib/contract_interact/airdrop')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
  , logger = require(rootPrefix + '/helpers/custom_console_logger');
;

/**
 * Constructor to create object of setup
 *
 * @constructor
 *
 * @param {Hex} airdropContractAddress - airdrop contract address
 * @param {Number} chainId - chain Id
 *
 * @return {Object}
 *
 */
const setup = module.exports = function(params) {
  logger.info("=======Setup.params=======");
  logger.info(params);
  this.airdropContractAddress = params.airdropContractAddress;
  this.chainId = params.chainId;

};

setup.prototype = {

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
      logger.info("=======Setup.validateParams result=======");
      logger.info(r);
      if(r.isFailure()) return r;

      r = await oThis.runSetup();
      logger.info("=======Setup.runSetup result=======");
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
          return onResolve(responseHelper.error('l_am_s_vp_1', 'airdrop contract address is invalid'));
        }

        if (!basicHelper.isValidChainId(oThis.chainId)) {
          return onResolve(responseHelper.error('l_am_s_vp_2', 'ChainId is invalid'));
        }

        const airdropContractInteractObject = new airdropContractInteract(oThis.airdropContractAddress, oThis.chainId);
        var result = await airdropContractInteractObject.airdropBudgetHolder();
        const airdropBudgetHolderAddress = result.data.airdropBudgetHolder;
        if (!basicHelper.isAddressValid(airdropBudgetHolderAddress)) {
          return onResolve(responseHelper.error('l_am_s_vp_3', 'airdrop contract is invalid'));
        }

        // if address already present
        result = await airdropModel.getByContractAddress(oThis.airdropContractAddress);
        const airdropRecord = result[0];
        if (airdropRecord){
          return onResolve(responseHelper.error('l_am_s_vp_4', 'airdrop record is already setup'));
        }

        return onResolve(responseHelper.successWithData({}));
      });

    },

    /**
     * Run the setup
     *
     * @return {Promise}
     *
     */
    runSetup: async function(){
      const oThis = this;
      return new Promise(async function (onResolve, onReject) {

        try {
          const insertedRecord = await airdropModel.create({
            contract_address: oThis.airdropContractAddress
          });
          return onResolve(responseHelper.successWithData({response: insertedRecord}));
        } catch(err){
          return onResolve(responseHelper.error('l_am_s_rs_1', 'Error creating airdrop record. '+err));
        }
      });

    }

};

module.exports = setup;

