/**
 *
 * This is a utility file which would be used for validating all methods related to airdrop.<br><br>
 *
 * @module lib/airdrop_management/validator
 *
 */

const rootPrefix = '../..'
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
;


/**
 * Constructor for validations
 *
 * @constructor
 *
 */
const validator = module.exports = function() {

};

validator.prototype = {

  // Validation if valid airdrop contract address
  validateCreateAirdropParams: function(airdropContractAddress) {
    return responseHelper.successWithData({});
  },

  validateTransferAirdropParams: function(senderAddress, airdropContractAddress, amount) {
    return responseHelper.successWithData({});
  }

};

module.exports = new validator();

