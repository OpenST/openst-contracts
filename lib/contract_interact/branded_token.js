//"use strict";

/**
 *
 * This is a utility file which would be used for executing all methods on EIP20Token contract.<br><br>
 *
 * @module lib/contract_interact/branded_token
 *
 */
const rootPrefix = '../..'
  , BigNumber = require('bignumber.js')
  , helper = require(rootPrefix + '/lib/contract_interact/helper')
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , web3RpcProvider = require(rootPrefix + '/lib/web3/providers/rpc')
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , contractName = 'brandedtoken'
  , contractAbi = coreAddresses.getAbiForContract(contractName)
  , currContract = new web3RpcProvider.eth.Contract(contractAbi)
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , cacheModule = require('@openstfoundation/openst-cache')
  , cacheImplementer = cacheModule.cache
  , cacheKeys = cacheModule.OpenSTCacheKeys
  ;

const logger = require(rootPrefix + '/helpers/custom_console_logger');


/**
 * Constructor to create object of BrandedToken
 *
 * @constructor
 *
 * @param {string} brandedTokenAddress - Branded token address
 * @param {number} chainId - chainId
 *
 */
const BrandedToken = function(brandedTokenAddress, chainId) {
  const oThis = this;
  oThis.brandedTokenAddress = brandedTokenAddress;
  oThis.chainId = chainId;
  currContract.setProvider(web3RpcProvider.currentProvider);
};

BrandedToken.prototype = {

  brandedTokenAddress: null,
  chainId: null,

  /**
   * Fetch Balance For a given address
   *
   * @param {string} owner - address for which balance is to be fetched
   *
   * @return {promise<result>}
   *
   */
  getBalanceOf: async function(owner) {
    const oThis = this
    ;
    // Validate addresses
    if (!helper.isAddressValid(owner)) {
      return Promise.resolve(responseHelper.error('l_ci_bt_gbo_1', 'address is invalid'));
    }

    const callback = async function (response) {
      //To-Do: Ensure cache is empty.
      //Someone else might have already fetched it and may be performing operations.
      //Aquire lock ?
      var cacheResult = await oThis.getBalanceFromCache(owner);
      if (cacheResult.isSuccess() && cacheResult.data.response != null) {
        //Ignore the balance we already have.
        return responseHelper.successWithData({balance: cacheResult.data.response});
      }
      //We can't help. throw again.
      if (response.isFailure()) {
        throw response;
      }
      //Cache it
      await oThis.setBalanceToCache(owner, new BigNumber(response.data.balance));
      return responseHelper.successWithData({balance: response.data.balance});
    };

    return oThis.getBalanceFromCache(owner)
      .then(function (cacheResult) {
        if (cacheResult.isSuccess() && cacheResult.data.response != null) {
          return responseHelper.successWithData({balance: cacheResult.data.response});
        } else {
          return oThis.getBalanceOfFromContract(owner).then(callback);          
        }

      })
      .catch(function (err) {
        //Format the error
        return responseHelper.error('l_ci_bt_getBalanceOf_2', 'Something went wrong');
      });
  },


  getBalanceOfFromContract: async function (owner) {
    const oThis = this;
    const transactionObject = currContract.methods.balanceOf(owner);
    const encodedABI = transactionObject.encodeABI();
    const transactionOutputs = helper.getTransactionOutputs(transactionObject);
    const response = await helper.call(web3RpcProvider, oThis.brandedTokenAddress, encodedABI, {}, transactionOutputs);
    return Promise.resolve(responseHelper.successWithData({balance: response[0]}));

  },

  /**
   * Get balance from cache
   *
   * @param {string} owner - address of user whose balance is to be found
   *
   * @return {promise<result>}
   *
   */
  getBalanceFromCache: function (owner) {

    const oThis = this;
    const cache_key = cacheKeys.btBalance(oThis.chainId, oThis.brandedTokenAddress, owner);
    return cacheImplementer.get(cache_key);
  },

  /**
   * Set balance to cache
   *
   * @param {string} owner - address of user whose balance is to be set
   * @param {BigNumber} balance - balance of the user
   *
   * @return {promise<result>}
   *
   */
  setBalanceToCache: function (owner, balance) {

    const oThis = this;
    const  cache_key = cacheKeys.btBalance(oThis.chainId, oThis.brandedTokenAddress, owner);    
    return cacheImplementer.set(cache_key, balance.toString(10));
  },


  /**
   * Credit balance in cache for pessimistic caching
   *
   * @param {string} owner - Account address
   * @param {BigNumber} bigAmount - amount to be credited
   *
   * @return {promise<result>}
   *
   * @ignore
   */
  creditBalanceInCache: function (owner, bigAmount) {

    // Internal Method. Credits Balance in Owner's Cache

    const oThis = this;

    //logger.step("_creditBalanceInCache called for :: " + owner + " :: bigAmount" + bigAmount.toString(10));  //DEBUG

    return oThis.getBalanceOf(owner)
      .then(function (response) {
        if (response.isSuccess()) {
          var balance = response.data.balance;
          var bigBalance = new BigNumber(balance);
          bigBalance = bigBalance.plus(bigAmount);

          //logger.info("_creditBalanceInCache :: balance :: " + balance); //DEBUG
          //console.log("_creditBalanceInCache :: balance :: " + balance);

          return oThis.setBalanceToCache(owner, bigBalance)
            .then(function (setResponse) {
              if (setResponse.isSuccess() && setResponse.data.response != null) {
                //logger.win("_creditBalanceInCache :: cache set :: "); //DEBUG
                return responseHelper.successWithData({});
              }
              logger.error("creditBalanceInCache :: cache could not be set");
              return responseHelper.error('l_ci_bt_creditBalanceInCache_1', 'Something went wrong');
            });
        }
        return response;
      });
  },

  /**
   * Debit balance in cache for pessimistic caching
   *
   * @param {string} owner - Account address
   * @param {BigNumber} bigAmount - amount to be debited
   *
   * @return {promise<result>}
   *
   * @ignore
   */
  debitBalanceInCache: function (owner, bigAmount) {

    const oThis = this;

    //logger.step("_debitBalanceInCache called for :: " + owner + " :: bigAmount :: " + bigAmount.toString(10)); //DEBUG

    return oThis.getBalanceOf(owner)
      .then(function (response) {
        if (response.isSuccess()) {

          var balance = response.data.balance
            , bigBalance = new BigNumber(balance);

          bigBalance = bigBalance.minus(bigAmount);

          //console.log("_debitBalanceInCache :: balance :: " + balance);
          //logger.info("_debitBalanceInCache :: balance :: " + balance);  //DEBUG

          return oThis.setBalanceToCache(owner, bigBalance)
            .then(function (setResponse) {
              if (setResponse.isSuccess() && setResponse.data.response != null) {
                //logger.win("_debitBalanceInCache :: cache set :: ");  //DEBUG
                return responseHelper.successWithData({});
              }
              logger.error("debitBalanceInCache :: cache could not be set");
              return responseHelper.error('l_ci_bt_debitBalanceInCache_1', 'Something went wrong');
            });
        }
        return response;
      });
  },

};

module.exports = BrandedToken;

