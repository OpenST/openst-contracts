"use strict";
/**
 *
 * This is a model file which would be used for executing all methods related to airdrop model.<br><br>
 *
 * @module app/models/airdrop
 *
 */
const rootPrefix = '../..'
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , QueryDBKlass = require(rootPrefix + '/app/models/queryDb')
  , ModelBaseKlass = require(rootPrefix + '/app/models/base')
;

const dbName = coreConstants.MYSQL_DATABASE
  , QueryDBObj = new QueryDBKlass(dbName)
;

/**
 * Constructor for class airdrop
 *
 * @constructor
 * @augments ModelBaseKlass
 *
 */
const AirdropKlass = function () {
  ModelBaseKlass.call(this, {dbName: dbName});
};

AirdropKlass.prototype = Object.create(ModelBaseKlass.prototype);

const AirdropKlassPrototype = {

  /**
   * Query DB Object
   *
   * @return {object}
   *
   */
  QueryDB: QueryDBObj,

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

module.exports = AirdropKlass;