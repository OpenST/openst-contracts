//"use strict";

/**
 *
 * This is transaction helper that manages the cache updation<br><br>
 *
 * @module lib/transaction_helper
 *
 */
const BigNumber = require('bignumber.js')
;

const rootPrefix = '..'
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , Token = require(rootPrefix + '/lib/contract_interact/branded_token')
  , UserAirdropDetailCacheKlass = require(rootPrefix + '/lib/cache_multi_management/user_airdrop_detail')
  , AdjustAirdropAmountKlass = require(rootPrefix + '/lib/airdrop_management/adjust_airdrop_amount')
  , web3EventsDecoder = require(rootPrefix + '/lib/web3/events/decoder')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , eventGlobalConstants = require(rootPrefix+'/lib/global_constant/events')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
  , AirdropModelCacheKlass = require(rootPrefix + '/lib/cache_management/airdrop_model')
;

/**
 * constructor
 *
 * @param {string} chainId - chain id
 *
 * @constructor
 */
const TransactionHelper = module.exports= function(chainId) {
  const oThis = this
  ;

  oThis.chainId = chainId;
};

TransactionHelper.prototype = {
  /**
   * Credit balance in cache
   *
   * @param {string} brandedTokenAddress - branded token address
   * @param {string} owner - Account address
   * @param {BigNumber} bigAmount - amount to be credited
   *
   * @return {promise<result>}
   */
  creditBalance: function (brandedTokenAddress, owner, bigAmount) {
    const oThis = this
      , brandedToken = new Token(brandedTokenAddress, oThis.chainId)
    ;

    return brandedToken.creditBalance(owner, bigAmount);
  },

  /**
   * Debit balance in cache
   *
   * @param {string} brandedTokenAddress - branded token address
   * @param {string} owner - Account address
   * @param {BigNumber} bigAmount - amount to be debited
   *
   * @return {promise<result>}
   */
  debitBalance: function (brandedTokenAddress, owner, bigAmount) {
    const oThis = this
      , brandedToken = new Token(brandedTokenAddress, oThis.chainId)
    ;

    return brandedToken.debitBalance(owner, bigAmount);
  },

  /**
   * Update balance to cache
   *
   * @param {string} brandedTokenAddress - branded token address
   * @param {string} owner - Account address
   * @param {BigNumber} toCreditBigAmount - to credit amount - this can be negative also
   *
   * @return {promise<result>}
   */
  updateBalance: function (brandedTokenAddress, owner, toCreditBigAmount) {
    const oThis = this
    ;

    if(basicHelper.convertToBigNumber(toCreditBigAmount).gt(0)) {
      return oThis.creditBalance(brandedTokenAddress, owner, toCreditBigAmount);
    } else if(basicHelper.convertToBigNumber(toCreditBigAmount).lt(0)) {
      return oThis.debitBalance(brandedTokenAddress, owner, basicHelper.convertToBigNumber(toCreditBigAmount).mul(-1));
    } else {
      return Promise.resolve(responseHelper.successWithData({}));
    }
  },

  /**
   * Set balance in cache
   *
   * @param {string} brandedTokenAddress - branded token address
   * @param {string} owner - Account address
   * @param {BigNumber} bigAmount - amount to be set
   *
   * @return {promise<result>}
   */
  setBalanceInCache: function (brandedTokenAddress, owner, bigAmount) {
    const oThis = this
      , brandedToken = new Token(brandedTokenAddress, oThis.chainId)
    ;

    return brandedToken.setBalanceInCache(owner, bigAmount);
  },

  /**
   * Update airdrop balance
   *
   * @param {string} airdropContractAddress - airdrop contract address
   * @param {string} owner - Account address
   * @param {BigNumber} toCreditBigAmount - to credit amount - this can be negative also
   *
   * @return {promise<result>}
   */
  updateAirdropBalance: function (airdropContractAddress, owner, toCreditBigAmount) {
    const oThis = this
    ;

    if(basicHelper.convertToBigNumber(toCreditBigAmount).gt(0)) {
      return oThis.creditAirdropBalance(airdropContractAddress, owner, toCreditBigAmount);
    } else if(basicHelper.convertToBigNumber(toCreditBigAmount).lt(0)) {
      return oThis.debitAirdropBalance(airdropContractAddress, owner,
        basicHelper.convertToBigNumber(toCreditBigAmount).mul(-1));
    } else {
      return Promise.resolve(responseHelper.successWithData({}));
    }
  },

  /**
   * Credit airdrop balance in db and clear cache
   * It decreases airdrop_used_amount for user in user_airdrop_details table
   * Clears the cache
   *
   * @param {string} airdropContractAddress - airdrop contract address
   * @param {string} owner - Account address
   * @param {BigNumber} bigAmount - amount to be credited
   *
   * @return {promise<result>}
   */
  creditAirdropBalance: async function (airdropContractAddress, owner, bigAmount) {
    const oThis = this;
    bigAmount = basicHelper.convertToBigNumber(bigAmount);
    if (bigAmount.gt(0)) {
      const AdjustAirdropAmountObject = new AdjustAirdropAmountKlass({
        airdropContractAddress: airdropContractAddress,
        userAddress: owner,
        airdropAmountUsed: bigAmount.toString(10)
      });
      const creditAirdropUsedAmountResponse = await AdjustAirdropAmountObject.creditAirdropUsedAmount();

      logger.debug('creditAirdropBalance.result', JSON.stringify(creditAirdropUsedAmountResponse));
      oThis.clearUserDetailCache(airdropContractAddress, owner);
      return Promise.resolve(creditAirdropUsedAmountResponse);
    }
    return Promise.resolve(responseHelper.successWithData({}));
  },

  /**
   * Debit airdrop balance in db and clear cache
   * It increases airdrop_used_amount for user in user_airdrop_details table
   * Clears the cache
   *
   * @param {string} airdropContractAddress - airdrop contract address
   * @param {string} owner - Account address
   * @param {BigNumber} bigAmount - amount to be debited
   *
   * @return {promise<result>}
   */
  debitAirdropBalance: async function (airdropContractAddress, owner, bigAmount) {
    const oThis = this;
    bigAmount = basicHelper.convertToBigNumber(bigAmount);
    if (bigAmount.gt(0)) {
      const AdjustAirdropAmountObject = new AdjustAirdropAmountKlass({
        airdropContractAddress: airdropContractAddress,
        userAddress: owner,
        airdropAmountUsed: bigAmount.toString(10)
      });
      const debitAirdropUsedAmountResponse = await AdjustAirdropAmountObject.debitAirdropUsedAmount();

      logger.debug('debitAirdropBalance.result', JSON.stringify(debitAirdropUsedAmountResponse));
      oThis.clearUserDetailCache(airdropContractAddress, owner);
      return Promise.resolve(debitAirdropUsedAmountResponse);
    }
    return Promise.resolve(responseHelper.successWithData({}));
  },

  /**
   * Clear user detail cache for the user addressess
   *
   * @param {string} airdropContractAddress - airdrop contract address
   * @param {string} owner - Account address
   *
   * @return {promise<result>}
   */
  clearUserDetailCache: async function(airdropContractAddress, owner) {
    const oThis = this
      , airdropModelCacheObject = new AirdropModelCacheKlass({useObject: true, contractAddress: airdropContractAddress})
      , airdropModelCacheResponse = await airdropModelCacheObject.fetch()
      , airdropRecord = airdropModelCacheResponse.data[airdropContractAddress]
    ;

    const userAirdropDetailCache = new UserAirdropDetailCacheKlass({
      chainId: oThis.chainId,
      airdropId: airdropRecord.id,
      userAddresses: [owner]
    });

    return Promise.resolve(await userAirdropDetailCache.clear());
  },

  /**
   * Before pay function, this is called before the pay is called
   *
   * @param {string} brandedTokenAddress - branded token address
   * @param {string} spender - spender address
   * @param {BigNumber} estimatedPayAmount - estimated pay amount in weis
   *
   * @return {promise<result>}
   *
   */
  beforePay: function(brandedTokenAddress, spender, estimatedPayAmount) {
    const oThis = this
    ;

    logger.debug('lib/transaction_helper.js:beforePay called with params:', JSON.stringify(
      {brandedTokenAddress: brandedTokenAddress, spender: spender, estimatedPayAmount: estimatedPayAmount}));

    return oThis.debitBalance(brandedTokenAddress, spender, estimatedPayAmount);
  },

  /**
   * After pay function, this is called after the pay is successfull
   *
   * @param {string} brandedTokenAddress - branded token address
   * @param {string} spender - spender address
   * @param {BigNumber} estimatedPayAmount - estimated pay amount in weis
   * @param {string} beneficiaryAddress - beneficiary address
   * @param {BigNumber} actualBeneficiaryAmount - actual beneficiary amount in weis
   * @param {string} commissionBeneficiaryAddress - commission beneficiary address
   * @param {BigNumber} actualCommissionBeneficiaryAmount - actual commission beneficiary amount
   *
   * @return {promise<result>}
   *
   */
  afterPaySuccess: async function(brandedTokenAddress, spender, estimatedPayAmount, beneficiaryAddress,
                            actualBeneficiaryAmount, commissionBeneficiaryAddress, actualCommissionBeneficiaryAmount) {
    const oThis = this
        // adjustment cache for spender
      , actualTotalAmount = actualBeneficiaryAmount.plus(actualCommissionBeneficiaryAmount)
      , initNumber = basicHelper.convertToBigNumber(0)
      , addressToBalanceChangeMap = {}
    ;

    addressToBalanceChangeMap[beneficiaryAddress] = initNumber;
    addressToBalanceChangeMap[commissionBeneficiaryAddress] = initNumber;
    addressToBalanceChangeMap[spender] = initNumber;

    addressToBalanceChangeMap[beneficiaryAddress] = addressToBalanceChangeMap[beneficiaryAddress].plus(
      actualBeneficiaryAmount);

    addressToBalanceChangeMap[commissionBeneficiaryAddress] = addressToBalanceChangeMap[commissionBeneficiaryAddress].plus(
      actualCommissionBeneficiaryAmount);

    addressToBalanceChangeMap[spender].plus(estimatedPayAmount.minus(actualTotalAmount));

    return Promise.all(oThis._getPromiseArrayForBalanceChange(brandedTokenAddress, '',
      addressToBalanceChangeMap, {}));
  },

  /**
   * After pay function, this is called after the pay is failed
   *
   * @param {string} brandedTokenAddress - branded token address
   * @param {string} spender - spender address
   * @param {BigNumber} estimatedPayAmount - estimated pay amount in weis
   *
   * @return {promise<result>}
   */
  afterPayFailure: function (brandedTokenAddress, spender, estimatedPayAmount) {
    const oThis = this
    ;

    logger.debug('lib/transaction_helper.js:afterPayFailure called with params:', JSON.stringify(
      {brandedTokenAddress: brandedTokenAddress, spender: spender, estimatedPayAmount: estimatedPayAmount}));

    return oThis.creditBalance(brandedTokenAddress, spender, estimatedPayAmount);
  },

  /**
   * Before airdrop pay function, this is called before the pay is called
   * @param {string} brandedTokenAddress - branded token address
   * @param {string} airdropAddress - airdrop contract address
   * @param {string} spender - spender address
   * @param {BigNumber} estimatedPayAmount - estimated pay amount in weis
   * @param {BigNumber} estimatedAirdropAmount - estimated airdrop amount
   * @param {string} airdropBugdetAddress - airdrop budget holder address
   *
   * @return {promise<result>}
   *
   */
  beforeAirdropPay: function(brandedTokenAddress, airdropAddress, spender, estimatedPayAmount, estimatedAirdropAmount,
    airdropBugdetAddress) {

    logger.debug('lib/transaction_helper.js:beforeAirdropPay called with params:', JSON.stringify(
      {brandedTokenAddress: brandedTokenAddress, airdropAddress: airdropAddress, spender: spender,
        estimatedAirdropAmount: estimatedAirdropAmount, airdropBugdetAddress: airdropBugdetAddress}));

    const oThis = this
      , amountToDebit = estimatedPayAmount.minus(estimatedAirdropAmount)
      , initNumber = basicHelper.convertToBigNumber(0)
      , addressToBalanceChangeMap = {}
      , addressToAirdropBalanceChangeMap = {}
    ;

    addressToBalanceChangeMap[spender] = initNumber;
    addressToAirdropBalanceChangeMap[spender] = initNumber;
    addressToBalanceChangeMap[airdropBugdetAddress] = initNumber;

    if (amountToDebit.gt(0)) {
      addressToBalanceChangeMap[spender] = addressToBalanceChangeMap[spender].minus(amountToDebit);
    }

    addressToAirdropBalanceChangeMap[spender] = addressToAirdropBalanceChangeMap[spender].minus(estimatedAirdropAmount);
    addressToBalanceChangeMap[airdropBugdetAddress] = addressToBalanceChangeMap[airdropBugdetAddress].minus(
      estimatedAirdropAmount);

    return Promise.all(oThis._getPromiseArrayForBalanceChange(brandedTokenAddress, airdropAddress,
      addressToBalanceChangeMap, addressToAirdropBalanceChangeMap));
  },

  /**
   * After airdrop pay function, this is called after the pay is successfull
   *
   * @param {string} brandedTokenAddress - branded token address
   * @param {string} airdropAddress - airdrop contract address
   * @param {string} spender - spender address
   * @param {BigNumber} estimatedPayAmount - estimated pay amount in weis
   * @param {BigNumber} estimatedAirdropAmount - estimated airdrop amount
   * @param {string} beneficiaryAddress - beneficiary address
   * @param {BigNumber} actualBeneficiaryAmount - actual beneficiary amount in weis
   * @param {string} commissionBeneficiaryAddress - commission beneficiary address
   * @param {BigNumber} actualCommissionBeneficiaryAmount - actual commission beneficiary amount
   * @param {BigNumber} actualAirdropAmount - actual airdrop amount
   * @param {string} airdropBugdetAddress - airdrop budget holder address
   *
   * @return {promise<result>}
   */
  afterAirdropPaySuccess: function(brandedTokenAddress, airdropAddress, spender, estimatedPayAmount,
                                   estimatedAirdropAmount, beneficiaryAddress, actualBeneficiaryAmount,
                                   commissionBeneficiaryAddress, actualCommissionBeneficiaryAmount,
                                   actualAirdropAmount, airdropBugdetAddress) {

    logger.debug('lib/transaction_helper.js:afterAirdropPaySuccess called with params:', JSON.stringify(
      {brandedTokenAddress: brandedTokenAddress, airdropAddress: airdropAddress, spender: spender,
        estimatedPayAmount: estimatedPayAmount, beneficiaryAddress: beneficiaryAddress,
        actualBeneficiaryAmount: actualBeneficiaryAmount, commissionBeneficiaryAddress: commissionBeneficiaryAddress,
        actualCommissionBeneficiaryAmount: actualCommissionBeneficiaryAmount,
        estimatedAirdropAmount: estimatedAirdropAmount, airdropBugdetAddress: airdropBugdetAddress,
        actualAirdropAmount: actualAirdropAmount}));

    const oThis = this
      , estimatedDebitAmount = estimatedPayAmount.minus(estimatedAirdropAmount)
      , actualTotalAmount = actualBeneficiaryAmount.plus(actualCommissionBeneficiaryAmount)
      , actualDebitAmount = actualTotalAmount.minus(actualAirdropAmount)
      , initNumber = basicHelper.convertToBigNumber(0)
      , addressToBalanceChangeMap = {}
      , addressToAirdropBalanceChangeMap = {}
    ;

    addressToBalanceChangeMap[beneficiaryAddress] = initNumber;
    addressToBalanceChangeMap[commissionBeneficiaryAddress] = initNumber;
    addressToBalanceChangeMap[spender] = initNumber;
    addressToBalanceChangeMap[airdropBugdetAddress] = initNumber;

    addressToAirdropBalanceChangeMap[spender] = initNumber;

    // credit beneficiaryAddress with actualBeneficiaryAmount
    addressToBalanceChangeMap[beneficiaryAddress] =
      addressToBalanceChangeMap[beneficiaryAddress].plus(actualBeneficiaryAmount);

    // credit commissionBeneficiaryAddress with actualCommissionBeneficiaryAmount
    addressToBalanceChangeMap[commissionBeneficiaryAddress] =
      addressToBalanceChangeMap[commissionBeneficiaryAddress].plus(actualCommissionBeneficiaryAmount);

    // we had debited estimatedDebitAmount previously from spender balance, now adjusting the delta.
    addressToBalanceChangeMap[spender] = addressToBalanceChangeMap[spender].plus(
      estimatedDebitAmount.minus(actualDebitAmount));

    // we had debited estimatedAirdropAmount previously from spender balance, now adjusting the delta.
    addressToAirdropBalanceChangeMap[spender] = addressToAirdropBalanceChangeMap[spender].plus(
      estimatedAirdropAmount.minus(actualAirdropAmount));

    // we had debited estimatedAirdropAmount previously from airdropBugdetAddress balance, now adjusting the delta.
    addressToBalanceChangeMap[airdropBugdetAddress] = addressToBalanceChangeMap[airdropBugdetAddress].plus(
      estimatedAirdropAmount.minus(actualAirdropAmount));

    return Promise.all(oThis._getPromiseArrayForBalanceChange(brandedTokenAddress, airdropAddress,
      addressToBalanceChangeMap, addressToAirdropBalanceChangeMap));
  },

  /**
   * Get promise array for balance change
   *
   * @param {string} brandedTokenAddress - branded token address
   * @param {string} airdropAddress - airdrop contract address
   * @param {string} addressToBalanceChangeMap - address to balance change map
   * @param {BigNumber} addressToAirdropBalanceChangeMap - address to airdrop balance change map
   *
   * @return {array<promise>}
   */
  _getPromiseArrayForBalanceChange: function(brandedTokenAddress, airdropAddress, addressToBalanceChangeMap,
                                             addressToAirdropBalanceChangeMap) {
    const oThis = this
      , promiseArray = []
    ;

    for(var address in addressToBalanceChangeMap) {
      promiseArray.push(oThis.updateBalance(brandedTokenAddress, address, addressToBalanceChangeMap[address]));
    }

    for(var address in addressToAirdropBalanceChangeMap) {
      promiseArray.push(oThis.updateAirdropBalance(airdropAddress, address, addressToAirdropBalanceChangeMap[address]));
    }

    return promiseArray;
  },

  /**
   * After airdrop pay function, this is called after the pay is failed
   *
   * @param {string} brandedTokenAddress - branded token address
   * @param {string} airdropAddress - airdrop contract address
   * @param {string} spender - spender address
   * @param {BigNumber} estimatedPayAmount - estimated pay amount in weis
   * @param {BigNumber} estimatedAirdropAmount - estimated airdrop amount
   * @param {string} airdropBugdetAddress - airdrop budget holder address
   *
   * @return {promise<result>}
   *
   */
  afterAirdropPayFailure: function (brandedTokenAddress, airdropAddress, spender,
    estimatedPayAmount, estimatedAirdropAmount, airdropBugdetAddress) {

    logger.debug('lib/transaction_helper.js:afterAirdropPayFailure called with params:', JSON.stringify(
      {brandedTokenAddress: brandedTokenAddress, airdropAddress: airdropAddress, spender: spender,
        estimatedAirdropAmount: estimatedAirdropAmount, airdropBugdetAddress: airdropBugdetAddress}));

    const oThis = this
      , amountToCredit = estimatedPayAmount.minus(estimatedAirdropAmount)
      , initNumber = basicHelper.convertToBigNumber(0)
      , addressToBalanceChangeMap = {}
      , addressToAirdropBalanceChangeMap = {}
    ;

    addressToBalanceChangeMap[spender] = initNumber;
    addressToBalanceChangeMap[airdropBugdetAddress] = initNumber;
    addressToAirdropBalanceChangeMap[spender] = initNumber;

    if (amountToCredit.gt(0)) {
      addressToBalanceChangeMap[spender] = addressToBalanceChangeMap[spender].plus(amountToCredit);
    }

    addressToAirdropBalanceChangeMap[spender] = addressToAirdropBalanceChangeMap[spender].plus(estimatedAirdropAmount);
    addressToBalanceChangeMap[airdropBugdetAddress] = addressToBalanceChangeMap[airdropBugdetAddress].plus(
      estimatedAirdropAmount);

    return Promise.all(oThis._getPromiseArrayForBalanceChange(brandedTokenAddress, airdropAddress,
      addressToBalanceChangeMap, addressToAirdropBalanceChangeMap));  
  },

  /**
  * Get actual beneficiary amount, actual commission amount and actual airdrop amount from transaction receipt
  *
  * @param {Object} transactionReceipt - transaction receipt
  * @param {Object} addressToNameMap - address to name map object
  * @param {string} eventName - Event name
  *
  * @return {result}
  */
  getActualAmountsFromReceipt: function(transactionReceipt, addressToNameMap, eventName) {

    const oThis = this;
    // decode events
    const decodedEvent = web3EventsDecoder.perform(transactionReceipt, addressToNameMap);
    return oThis.getActualAmountsFromDecodedEvents(decodedEvent, eventName);

  },

  /**
   * Get actual beneficiary amount, actual commission amount and actual airdrop amount from decoded events
   *
   * @param {Object} decodedEvent - Decoded event from receipt
   * @param {string} eventName - Event name
   *
   * @return {result}
   */
  getActualAmountsFromDecodedEvents: function(decodedEvent, eventName) {

    var actualBeneficiaryAmount = new BigNumber(0)
      , actualCommissionAmount = new BigNumber(0)
      , actualAirdropAmount = new BigNumber(0)
      , isEventDecoded = false
    ;

    if (decodedEvent != undefined && decodedEvent != null) {
      // get event data
      const events =decodedEvent.formattedTransactionReceipt.eventsData;
      if (events != undefined && events != null) {
        // get whats the actual transfer amounts
        for (var i = 0; i < events.length; i++) {
          const eventData = events[i];
          if (eventData.name === eventName) {
            const paymentEvents = eventData.events;
            for (var eventCount = 0; eventCount < paymentEvents.length; eventCount++) {
              const paymentEventsData = paymentEvents[eventCount];
              if (paymentEventsData.name === eventGlobalConstants.eventAttribute.tokenAmount()) {
                isEventDecoded = true;
                actualBeneficiaryAmount = new BigNumber(paymentEventsData.value);
              } else if (paymentEventsData.name === eventGlobalConstants.eventAttribute.commissionTokenAmount()) {
                isEventDecoded = true;
                actualCommissionAmount = new BigNumber(paymentEventsData.value);
              } else if (paymentEventsData.name === eventGlobalConstants.eventAttribute.airdropAmount()) {
                isEventDecoded = true;
                actualAirdropAmount = new BigNumber(paymentEventsData.value);
              }
            }
          }

        }
      }
    }
    if (isEventDecoded) {
      return responseHelper.successWithData(
        {actualBeneficiaryAmount: actualBeneficiaryAmount, actualCommissionAmount: actualCommissionAmount,
          actualAirdropAmount: actualAirdropAmount});
    } else {
      return responseHelper.error('l_th_getActualAmountsFromDecodedEvents_1', "No events found in the transaction receipt");
    }
  },

  /**
  * Check if all response is success
  *
  * @param {array} results - response array
  *
  * @return {boolean}
  *
  */
  isAllResponseSuccessful: function (results) {
    var isSuccess = true;
    for (var i = results.length - 1; i >= 0; i--) {
      const resultObject = results[i];
      if (resultObject.isFailure()) {
        isSuccess = false;
        break;
      }
    }
    return isSuccess;
  }
};
