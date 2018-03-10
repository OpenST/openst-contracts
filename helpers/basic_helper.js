"use strict";

/**
 * Perform basic validations
 *
 * @module helpers/basic_helper
 */

const BigNumber = require('bignumber.js')
;


/**
 * Basic helper methods constructor
 *
 * @constructor
 *
 */
const BasicHelperKlass = function() {};

BasicHelperKlass.prototype = {

  /**
   * Check if address is valid or not
   *
   * @param {string} address - Address
   *
   * @return {boolean}
   */
  isAddressValid: function (address) {
    if (typeof address !== "string") {
      return false;
    }
    return /^0x[0-9a-fA-F]{40}$/.test(address);
  },

  /**
   * Check if uuid is valid or not
   *
   * @param {string} uuid - Branded Token UUID
   *
   * @return {boolean}
   */
  isUuidValid: function (uuid) {
    if (typeof uuid !== "string") {
      return false;
    }
    return /^0x[0-9a-fA-F]{64}$/.test(uuid);
  },

  /**
   * Check if transaction hash is valid or not
   *
   * @param {string} transactionHash - Transaction hash
   *
   * @return {boolean}
   */
  isTxHashValid: function (transactionHash) {
    if (typeof transactionHash !== "string") {
      return false;
    }
    return /^0x[0-9a-fA-F]{64}$/.test(transactionHash);
  },

  /**
   * Check if amount is valid wei number and not zero
   *
   * @param {number} amountInWei - amount in wei
   *
   * @return {boolean}
   */
  isNonZeroWeiValid: function (amountInWei) {
    const oneForMod = new BigNumber('1');

    // Convert amount in BigNumber
    var bigNumAmount = null;
    if (amountInWei instanceof BigNumber) {
      bigNumAmount = amountInWei;
    } else {
      var numAmount = Number(amountInWei);
      if (!isNaN(numAmount)) {
        bigNumAmount = new BigNumber(numAmount);
      }
    }

    return (!bigNumAmount || bigNumAmount.lessThan(1) || bigNumAmount.isNaN() ||
      !bigNumAmount.isFinite() || bigNumAmount.mod(oneForMod) != 0) ? false : true;
  },

  /**
   * get return type for transaction
   *
   * @param {string} returnType - return from geth transactions when following event is received
   *
   * @return {string}
   */
  getReturnType: function (returnType) {
    return ['uuid', 'txHash', 'txReceipt'].includes(returnType) ? returnType : 'txHash';
  },

  /**
   * check if return type is uuid or not
   *
   * @param {string} returnType - return type
   *
   * @return {boolean}
   */
  isReturnTypeUUID: function(returnType) {
    return returnType === 'uuid';
  },

  /**
   * check if return type is txHash or not
   *
   * @param {string} returnType - return type
   *
   * @return {boolean}
   */
  isReturnTypeTxHash: function(returnType) {
    return returnType === 'txHash';
  },

  /**
   * check if return type is txReceipt or not
   *
   * @param {string} returnType - return type
   *
   * @return {boolean}
   */
  isReturnTypeTxReceipt: function(returnType) {
    return returnType === 'txReceipt';
  },

  /**
   * Check if branded token name is valid or not
   *
   * @param {string} name - Branded token name
   *
   * @return {boolean}
   */
  isBTNameValid: function (name) {
    if (typeof name !== "string") {
      return false;
    }
    return (/^[a-z0-9\s]{1,}$/i).test(name);
  },

  /**
   * Check if branded token symbol is valid or not
   *
   * @param {string} symbol - Branded token symbol
   *
   * @return {boolean}
   */
  isBTSymbolValid: function (symbol) {
    if (typeof symbol !== "string") {
      return false;
    }
    return (/^[a-z0-9]{1,}$/i).test(symbol);
  },

  /**
   * Check if branded token conversion rate is valid or not
   *
   * @param {number} conversionRate - Branded token conversion rate
   *
   * @return {boolean}
   */
  isBTConversionRateValid: function (conversionRate) {
    if (isNaN(conversionRate) || (conversionRate % 1) != 0 || parseInt(conversionRate) < 1) {
      return false;
    }
    return true;
  },

  /**
   * Convert wei to proper string. Make sure it's a valid number
   *
   * @param {number} amountInWei - amount in wei to be formatted
   *
   * @return {string}
   */
  formatWeiToString: function (amountInWei) {
    const oThis = this;
    return oThis.convertToBigNumber(amountInWei).toString(10);
  },

  /**
   * Convert number to big number. Make sure it's a valid number
   *
   * @param {number} amountInWei - amount in wei to be formatted
   *
   * @return {BigNumber}
   */
  convertToBigNumber: function (number) {
    return (number instanceof BigNumber) ? number : new BigNumber(number);
  },

  /**
   * Check if chainId is valid
   *
   * @param {Number} chainId - chainId
   *
   * @return {Bool}
   */
  isValidChainId: function (chainId) {
   const chainIdBigNumberObject = new BigNumber(chainId);
   return chainIdBigNumberObject.isNaN() || !chainIdBigNumberObject.isInteger() ? false : true
  }

};

module.exports = new BasicHelperKlass();