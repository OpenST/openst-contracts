"use strict";
/**
 *
 * This is a model file which would be used for executing all methods related to airdrop model.<br><br>
 *
 * @module app/models/airdrop
 *
 */
const rootPrefix = '../..'
  , InstanceComposer = require(rootPrefix + "/instance_composer")
  , ModelBaseKlass = require(rootPrefix + '/app/models/base')
;

require(rootPrefix + '/config/core_constants');

/**
 * Constructor for class airdrop
 *
 * @constructor
 * @augments ModelBaseKlass
 *
 */
const AirdropKlass = function () {

  const oThis = this
    , coreConstants = oThis.ic().getCoreConstants()
  ;

  ModelBaseKlass.call(this, {dbName: coreConstants.MYSQL_DATABASE});

};

AirdropKlass.prototype = Object.create(ModelBaseKlass.prototype);

const AirdropKlassPrototype = {

  /**
   * Table name
   *
   * @constant {string}
   *
   */
  tableName: 'airdrops',

  /**
   * Select all airdrop contracts
   *
   * @return {Promise}
   *
   */
  getAll: function() {
    const oThis = this
    ;

    return oThis.select().fire();
  },

  /**
   * get airdrop AR by contract Address
   *
   * @param {Hex} airdropContractAddress - airdrop contract address
   *
   * @return {Promise}
   *
   */
  getByContractAddress: function (airdropContractAddress) {
    const oThis = this
    ;
    
    return oThis.select().where(["contract_address=?", airdropContractAddress]).
      limit(1).fire();
  }

};

Object.assign(AirdropKlass.prototype, AirdropKlassPrototype);

InstanceComposer.registerShadowableClass(AirdropKlass, "getAirdropModelKlass");

module.exports = AirdropKlass;