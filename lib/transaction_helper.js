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
  , UserAirdropDetailCacheKlass = require(rootPrefix + '/lib/cache_management/user_airdrop_detail')
  , UserAirdropDetailModelKlass = require(rootPrefix + '/app/models/user_airdrop_detail')
  , web3EventsDecoder = require(rootPrefix + '/lib/web3/events/decoder')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , eventGlobalConstants = require(rootPrefix+'/lib/global_constant/events')
  , airdropKlass = require(rootPrefix + '/app/models/airdrop')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
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
      const userAirdropDetailModel = new UserAirdropDetailModelKlass();
      const creditAirdropUsedAmountResponse = await userAirdropDetailModel.creditAirdropUsedAmount(airdropContractAddress,
        owner, bigAmount.toString(10));

      logger.info('creditAirdropBalance.result', JSON.stringify(creditAirdropUsedAmountResponse));

      if (creditAirdropUsedAmountResponse.isSuccess()) {
        oThis.clearUserDetailCache(airdropContractAddress, owner);
      }
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
      const userAirdropDetailModel = new UserAirdropDetailModelKlass();
      const debitAirdropUsedAmountResponse = await userAirdropDetailModel.debitAirdropUsedAmount(
        airdropContractAddress, owner, bigAmount.toString(10));

      logger.info('debitAirdropBalance.result', JSON.stringify(debitAirdropUsedAmountResponse));

      if (debitAirdropUsedAmountResponse.isSuccess()) {
        oThis.clearUserDetailCache(airdropContractAddress, owner);
      }
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
      , airdropModel = new airdropKlass()
      , airdropModelResult = await airdropModel.getByContractAddress(airdropContractAddress)
      , airdropRecord = airdropModelResult[0]
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

    logger.info('lib/transaction_helper.js:beforePay called with params:', JSON.stringify(
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
      , promiseArray = []
        // adjustment cache for spender
      , actualTotalAmount = actualBeneficiaryAmount.plus(actualCommissionBeneficiaryAmount)
    ;

    promiseArray.push(oThis.creditBalance(brandedTokenAddress, beneficiaryAddress, actualBeneficiaryAmount));
    promiseArray.push(oThis.creditBalance(brandedTokenAddress, commissionBeneficiaryAddress,
      actualCommissionBeneficiaryAmount));

    if (actualTotalAmount.gt(estimatedPayAmount)) {
      const adjustedAmount = actualTotalAmount.minus(estimatedPayAmount);
      promiseArray.push(oThis.debitBalance(brandedTokenAddress, spender, adjustedAmount));
    } else if (actualTotalAmount.lt(estimatedPayAmount)) {
      const adjustedAmount = estimatedPayAmount.minus(actualTotalAmount);
      promiseArray.push(oThis.creditBalance(brandedTokenAddress, spender, adjustedAmount));
    }

    return Promise.all(promiseArray);
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

    logger.info('lib/transaction_helper.js:afterPayFailure called with params:', JSON.stringify(
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

    logger.info('lib/transaction_helper.js:beforeAirdropPay called with params:', JSON.stringify(
      {brandedTokenAddress: brandedTokenAddress, airdropAddress: airdropAddress, spender: spender,
        estimatedAirdropAmount: estimatedAirdropAmount, airdropBugdetAddress: airdropBugdetAddress}));

    const oThis = this
      , promiseArray = []
      , amountToDebit = estimatedPayAmount.minus(estimatedAirdropAmount)
    ;

    if (amountToDebit.gt(0)) {
      promiseArray.push(oThis.debitBalance(brandedTokenAddress, spender, amountToDebit));
    }

    promiseArray.push(oThis.debitAirdropBalance(airdropAddress, spender, estimatedAirdropAmount));
    promiseArray.push(oThis.debitBalance(brandedTokenAddress, airdropBugdetAddress, estimatedAirdropAmount));
    return Promise.all(promiseArray);
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

    logger.info('lib/transaction_helper.js:afterAirdropPaySuccess called with params:', JSON.stringify(
      {brandedTokenAddress: brandedTokenAddress, airdropAddress: airdropAddress, spender: spender,
        estimatedPayAmount: estimatedPayAmount, beneficiaryAddress: beneficiaryAddress,
        actualBeneficiaryAmount: actualBeneficiaryAmount, commissionBeneficiaryAddress: commissionBeneficiaryAddress,
        actualCommissionBeneficiaryAmount: actualCommissionBeneficiaryAmount,
        estimatedAirdropAmount: estimatedAirdropAmount, airdropBugdetAddress: airdropBugdetAddress,
        actualAirdropAmount: actualAirdropAmount}));

    const oThis = this
      , promiseArray = []
      , estimatedDebitAmount = estimatedPayAmount.minus(estimatedAirdropAmount)
      , actualTotalAmount = actualBeneficiaryAmount.plus(actualCommissionBeneficiaryAmount)
      , actualDebitAmount = actualTotalAmount.minus(actualAirdropAmount)
    ;

    // credit beneficiaryAddress with actualBeneficiaryAmount
    promiseArray.push(oThis.creditBalance(brandedTokenAddress, beneficiaryAddress, actualBeneficiaryAmount));
    // credit commissionBeneficiaryAddress with actualCommissionBeneficiaryAmount
    promiseArray.push(oThis.creditBalance(brandedTokenAddress, commissionBeneficiaryAddress, actualCommissionBeneficiaryAmount));

    // we had debited estimatedDebitAmount previously from spender balance, now adjusting the delta.
    if(actualDebitAmount.gt(estimatedDebitAmount)) {
      // debiting the delta, since lesser amount than required was debited earlier
      promiseArray.push(oThis.debitBalance(brandedTokenAddress, spender, actualDebitAmount.minus(estimatedDebitAmount)));
    } else if (actualDebitAmount.lt(estimatedDebitAmount)) {
      // crediting the delta, since more amount than required was debited earlier
      promiseArray.push(oThis.creditBalance(brandedTokenAddress, spender, estimatedDebitAmount.minus(actualDebitAmount)));
    }

    // we had debited estimatedAirdropAmount previously from spender balance, now adjusting the delta.
    if (actualAirdropAmount.gt(estimatedAirdropAmount)) {
      // debiting the delta, since lesser amount than required was debited earlier
      promiseArray.push(oThis.debitAirdropBalance(airdropAddress, spender, actualAirdropAmount.minus(estimatedAirdropAmount)));
    } else if (actualAirdropAmount.lt(estimatedAirdropAmount)) {
      // crediting the delta, since more amount than required was debited earlier
      promiseArray.push(oThis.creditAirdropBalance(airdropAddress, spender, estimatedAirdropAmount.minus(actualAirdropAmount)));
    }

    // we had debited estimatedAirdropAmount previously from airdropBugdetAddress balance, now adjusting the delta.
    if (actualAirdropAmount.gt(estimatedAirdropAmount)) {
      // debiting the delta, since lesser amount than required was debited earlier
      promiseArray.push(oThis.debitBalance(brandedTokenAddress, airdropBugdetAddress,
        actualAirdropAmount.minus(estimatedAirdropAmount)));
    } else if (actualAirdropAmount.lt(estimatedAirdropAmount)) {
      // crediting the delta, since more amount than required was debited earlier
      promiseArray.push(oThis.creditBalance(brandedTokenAddress, airdropBugdetAddress,
        estimatedAirdropAmount.minus(actualAirdropAmount)));
    }

    return Promise.all(promiseArray);
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

    logger.info('lib/transaction_helper.js:afterAirdropPayFailure called with params:', JSON.stringify(
      {brandedTokenAddress: brandedTokenAddress, airdropAddress: airdropAddress, spender: spender,
        estimatedAirdropAmount: estimatedAirdropAmount, airdropBugdetAddress: airdropBugdetAddress}));

    const oThis = this
      , promiseArray = []
      , amountToCredit = estimatedPayAmount.minus(estimatedAirdropAmount)
    ;

    if (amountToCredit.gt(0)) {
      promiseArray.push(oThis.creditBalance(brandedTokenAddress, spender, amountToCredit));
    }

    promiseArray.push(oThis.creditAirdropBalance(airdropAddress, spender, estimatedAirdropAmount));
    promiseArray.push(oThis.creditBalance(brandedTokenAddress, airdropBugdetAddress, estimatedAirdropAmount));
    return Promise.all(promiseArray);
  },

  /**
  * Get actual beneficiary amount, actual commission amount and actual airdrop amount from transaction receipt
  *
  * @param {Object} transactionReceipt - transaction receipt
  * @param {Object} addressToNameMap - address to name map object
  *
  * @return {result}
  */
  getActualAmountsFromReceipt: function(transactionReceipt, addressToNameMap, eventName) {

    const oThis = this;
    // decode events
    const decodedEvent = web3EventsDecoder.perform(transactionReceipt, addressToNameMap);

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
      return responseHelper.error('l_th_getActualAmountsFromReceipt_1', "No events found in the transaction receipt");
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
