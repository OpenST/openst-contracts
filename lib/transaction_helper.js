//"use strict";

/**
 *
 * This is transaction helper that manages the cache updation<br><br>
 *
 * @module lib/transaction_helper
 *
 */
const BigNumber = require('bignumber.js')
  , openSTStorage = require('@openstfoundation/openst-storage')
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
  , paramErrorConfig = require(rootPrefix + '/config/param_error_config')
  , apiErrorConfig = require(rootPrefix + '/config/api_error_config')
  , ddbServiceObj = require(rootPrefix + '/lib/dynamoDB_service')
  , autoScalingServiceObj = require(rootPrefix + '/lib/auto_scaling_service')
;

const errorConfig = {
  param_error_config: paramErrorConfig,
  api_error_config: apiErrorConfig
};

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
    const oThis = this
    ;

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
   * @param {string} spenderAddress - spender address
   * @param {BigNumber} estimatedPayAmount - estimated pay amount in weis
   *
   * @return {promise<result>}
   *
   */
  beforePay: async function(brandedTokenAddress, spenderAddress, estimatedPayAmount) {
    const oThis = this
    ;

    logger.debug('lib/transaction_helper.js:beforePay called with params:', JSON.stringify(
      {brandedTokenAddress: brandedTokenAddress, spender: spenderAddress, estimatedPayAmount: estimatedPayAmount}));

    const balanceUpdateResponse = await new openSTStorage.TokenBalanceModel({
      ddb_service: ddbServiceObj,
      auto_scaling: autoScalingServiceObj,
      erc20_contract_address: brandedTokenAddress
    }).update({
      ethereum_address: spenderAddress,
      un_settled_debit_amount: estimatedPayAmount.toString(10)
    }).catch(function (error) {
      if (responseHelper.isCustomResult(error)) {
        return error;
      } else {
        logger.error(`${__filename}::beforeAirdropPay::catch`);
        logger.error(error);
        return responseHelper.error({
          internal_error_identifier: 'l_th_beforePay_1',
          api_error_identifier: 'unhandled_api_error',
          error_config: errorConfig,
          debug_options: {}
        });
      }
    });

    if (balanceUpdateResponse.isFailure()) {
      return balanceUpdateResponse;
    }
    return responseHelper.successWithData({});
  },

  /**
   * After pay function, this is called after the pay is successfull
   *
   * @param {string} brandedTokenAddress - branded token address
   * @param {string} spenderAddress - spender address
   * @param {BigNumber} estimatedPayAmount - estimated pay amount in weis
   * @param {string} beneficiaryAddress - beneficiary address
   * @param {BigNumber} actualBeneficiaryAmount - actual beneficiary amount in weis
   * @param {string} commissionBeneficiaryAddress - commission beneficiary address
   * @param {BigNumber} actualCommissionBeneficiaryAmount - actual commission beneficiary amount
   *
   * @return {promise<result>}
   *
   */
  afterPaySuccess: async function(brandedTokenAddress, spenderAddress, estimatedPayAmount, beneficiaryAddress,
                                  actualBeneficiaryAmount, commissionBeneficiaryAddress, actualCommissionBeneficiaryAmount) {
    const oThis = this
      , promiseArray = []
      , actualTotalAmount = actualBeneficiaryAmount.plus(actualCommissionBeneficiaryAmount)
    ;

    promiseArray.push(new openSTStorage.TokenBalanceModel({
      ddb_service: ddbServiceObj,
      auto_scaling: autoScalingServiceObj,
      erc20_contract_address: brandedTokenAddress
    }).update({
      ethereum_address: beneficiaryAddress,
      settle_amount: actualBeneficiaryAmount.toString(10)
    }).catch(function (error) {
      if (responseHelper.isCustomResult(error)) {
        return error;
      } else {
        logger.error(`${__filename}::afterPaySuccess::catch`);
        logger.error(error);
        return responseHelper.error({
          internal_error_identifier: 'l_th_afterPaySuccess_1',
          api_error_identifier: 'unhandled_api_error',
          error_config: errorConfig,
          debug_options: {}
        });
      }
    }));

    // credit commissionBeneficiaryAddress with actualCommissionBeneficiaryAmount - add it to the settled_amount
    promiseArray.push(new openSTStorage.TokenBalanceModel({
      ddb_service: ddbServiceObj,
      auto_scaling: autoScalingServiceObj,
      erc20_contract_address: brandedTokenAddress
    }).update({
      ethereum_address: commissionBeneficiaryAddress,
      settle_amount: actualCommissionBeneficiaryAmount.toString(10)
    }).catch(function (error) {
      if (responseHelper.isCustomResult(error)) {
        return error;
      } else {
        logger.error(`${__filename}::afterPaySuccess::catch`);
        logger.error(error);
        return responseHelper.error({
          internal_error_identifier: 'l_th_afterPaySuccess_2',
          api_error_identifier: 'unhandled_api_error',
          error_config: errorConfig,
          debug_options: {}
        });
      }
    }));

    // we had pessimistically debitted estimatedDebitAmount from spenderAddress.
    // now adjusting the debit to actualDebitAmount.
    // subtract estimatedDebitAmount from un_settled_debit_amount AND subtract actualDebitAmount from settle_amount.
    promiseArray.push(new openSTStorage.TokenBalanceModel({
      ddb_service: ddbServiceObj,
      auto_scaling: autoScalingServiceObj,
      erc20_contract_address: brandedTokenAddress
    }).update({
      ethereum_address: spenderAddress,
      settle_amount: (actualTotalAmount.mul(basicHelper.convertToBigNumber(-1))).toString(10),
      un_settled_debit_amount: (estimatedPayAmount.mul(basicHelper.convertToBigNumber(-1))).toString(10)
    }).catch(function (error) {
      if (responseHelper.isCustomResult(error)) {
        return error;
      } else {
        logger.error(`${__filename}::afterPaySuccess::catch`);
        logger.error(error);
        return responseHelper.error({
          internal_error_identifier: 'l_th_afterPaySuccess_3',
          api_error_identifier: 'unhandled_api_error',
          error_config: errorConfig,
          debug_options: {}
        });
      }
    }));

    return Promise.all(promiseArray);
  },

  /**
   * After pay function, this is called after the pay is failed
   *
   * @param {string} brandedTokenAddress - branded token address
   * @param {string} spenderAddress - spender address
   * @param {BigNumber} estimatedPayAmount - estimated pay amount in weis
   *
   * @return {promise<result>}
   */
  afterPayFailure: async function (brandedTokenAddress, spenderAddress, estimatedPayAmount) {
    const oThis = this
    ;

    logger.debug('lib/transaction_helper.js:afterPayFailure called with params:', JSON.stringify(
      {brandedTokenAddress: brandedTokenAddress, spender: spenderAddress, estimatedPayAmount: estimatedPayAmount}));

    const balanceUpdateResponse = await new openSTStorage.TokenBalanceModel({
      ddb_service: ddbServiceObj,
      auto_scaling: autoScalingServiceObj,
      erc20_contract_address: brandedTokenAddress
    }).update({
      ethereum_address: spenderAddress,
      un_settled_debit_amount: (estimatedPayAmount.mul(basicHelper.convertToBigNumber(-1))).toString(10)
    }).catch(function (error) {
      if (responseHelper.isCustomResult(error)) {
        return error;
      } else {
        logger.error(`${__filename}::afterPayFailure::catch`);
        logger.error(error);
        return responseHelper.error({
          internal_error_identifier: 'l_th_afterPayFailure_1',
          api_error_identifier: 'unhandled_api_error',
          error_config: errorConfig,
          debug_options: {}
        });
      }
    });

    if (balanceUpdateResponse.isFailure()) {
      return balanceUpdateResponse;
    }
    return responseHelper.successWithData({});
  },

  /**
   * Before airdrop pay function, this is called before the pay is called
   * @param {string} brandedTokenAddress - branded token address
   * @param {string} airdropAddress - airdrop contract address
   * @param {string} spenderAddress - spender address
   * @param {BigNumber} totalTransferAmount - estimated pay amount in weis
   * @param {BigNumber} airdropBalanceToUse - estimated airdrop amount
   * @param {string} airdropBugdetAddress - airdrop budget holder address
   *
   * @return {promise<array<result>>}
   *
   */
  beforeAirdropPay: async function(brandedTokenAddress, airdropAddress, spenderAddress, totalTransferAmount, airdropBalanceToUse,
                                   airdropBugdetAddress) {

    logger.debug('lib/transaction_helper.js:beforeAirdropPay called with params:', JSON.stringify(
      {brandedTokenAddress: brandedTokenAddress, airdropAddress: airdropAddress, spender: spenderAddress,
        estimatedAirdropAmount: airdropBalanceToUse, airdropBugdetAddress: airdropBugdetAddress}));

    const oThis = this
      , amountToDebitFromChain = totalTransferAmount.minus(airdropBalanceToUse)
      , promiseArray = []
    ;

    // Pessimistic debit of spender.
    if (amountToDebitFromChain.gt(0)) {
      promiseArray.push(new openSTStorage.TokenBalanceModel({
        ddb_service: ddbServiceObj,
        auto_scaling: autoScalingServiceObj,
        erc20_contract_address: brandedTokenAddress
      }).update({
        ethereum_address: spenderAddress,
        un_settled_debit_amount: amountToDebitFromChain.toString(10)
      }).catch(function (error) {
        if (responseHelper.isCustomResult(error)) {
          return error;
        } else {
          logger.error(`${__filename}::beforeAirdropPay::catch`);
          logger.error(error);
          return responseHelper.error({
            internal_error_identifier: 'l_th_beforeAirdropPay_1',
            api_error_identifier: 'unhandled_api_error',
            error_config: errorConfig,
            debug_options: {}
          });
        }
      }));
    }

    //Debit airdrop balance of spender from DB.
    promiseArray.push(oThis.updateAirdropBalance(airdropAddress, spenderAddress, airdropBalanceToUse.mul(basicHelper.convertToBigNumber(-1))));

    // pessimistic debit of airdrop budget holder.
    promiseArray.push(new openSTStorage.TokenBalanceModel({
      ddb_service: ddbServiceObj,
      auto_scaling: autoScalingServiceObj,
      erc20_contract_address: brandedTokenAddress
    }).update({
      ethereum_address: airdropBugdetAddress,
      un_settled_debit_amount: airdropBalanceToUse.toString(10)
    }).catch(function (error) {
      if (responseHelper.isCustomResult(error)) {
        return error;
      } else {
        logger.error(`${__filename}::beforeAirdropPay::catch`);
        logger.error(error);
        return responseHelper.error({
          internal_error_identifier: 'l_th_beforeAirdropPay_2',
          api_error_identifier: 'unhandled_api_error',
          error_config: errorConfig,
          debug_options: {}
        });
      }
    }));

    return Promise.all(promiseArray);
  },

  /**
   * After airdrop pay function, this is called after the pay is successfull
   *
   * @param {string} brandedTokenAddress - branded token address
   * @param {string} airdropAddress - airdrop contract address
   * @param {string} spenderAddress - spender address
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
  afterAirdropPaySuccess: async function(brandedTokenAddress, airdropAddress, spenderAddress, estimatedPayAmount,
                                         estimatedAirdropAmount, beneficiaryAddress, actualBeneficiaryAmount,
                                         commissionBeneficiaryAddress, actualCommissionBeneficiaryAmount,
                                         actualAirdropAmount, airdropBugdetAddress) {

    console.log("-PPP--------------------------------------------------------------6--", Date.now(), 'ms');
    logger.debug('lib/transaction_helper.js:afterAirdropPaySuccess called with params:', JSON.stringify(
      {brandedTokenAddress: brandedTokenAddress, airdropAddress: airdropAddress, spender: spenderAddress,
        estimatedPayAmount: estimatedPayAmount, beneficiaryAddress: beneficiaryAddress,
        actualBeneficiaryAmount: actualBeneficiaryAmount, commissionBeneficiaryAddress: commissionBeneficiaryAddress,
        actualCommissionBeneficiaryAmount: actualCommissionBeneficiaryAmount,
        estimatedAirdropAmount: estimatedAirdropAmount, airdropBugdetAddress: airdropBugdetAddress,
        actualAirdropAmount: actualAirdropAmount}));

    const oThis = this
      , estimatedDebitAmount = estimatedPayAmount.minus(estimatedAirdropAmount)
      , actualTotalAmount = actualBeneficiaryAmount.plus(actualCommissionBeneficiaryAmount)
      , actualDebitAmount = actualTotalAmount.minus(actualAirdropAmount)
      , promiseArray = []
    ;

    // credit beneficiaryAddress with actualBeneficiaryAmount - add it to the settled_amount
    promiseArray.push(new openSTStorage.TokenBalanceModel({
      ddb_service: ddbServiceObj,
      auto_scaling: autoScalingServiceObj,
      erc20_contract_address: brandedTokenAddress
    }).update({
      ethereum_address: beneficiaryAddress,
      settle_amount: actualBeneficiaryAmount.toString(10)
    }).catch(function (error) {
      if (responseHelper.isCustomResult(error)) {
        return error;
      } else {
        logger.error(`${__filename}::afterAirdropPaySuccess::catch`);
        logger.error(error);
        return responseHelper.error({
          internal_error_identifier: 'l_th_afterAirdropPaySuccess_1',
          api_error_identifier: 'unhandled_api_error',
          error_config: errorConfig,
          debug_options: {}
        });
      }
    }));
    console.log("-PPP--------------------------------------------------------------6.1--", Date.now(), 'ms');
    // credit commissionBeneficiaryAddress with actualCommissionBeneficiaryAmount - add it to the settled_amount
    promiseArray.push(new openSTStorage.TokenBalanceModel({
      ddb_service: ddbServiceObj,
      auto_scaling: autoScalingServiceObj,
      erc20_contract_address: brandedTokenAddress
    }).update({
      ethereum_address: commissionBeneficiaryAddress,
      settle_amount: actualCommissionBeneficiaryAmount.toString(10)
    }).catch(function (error) {
      if (responseHelper.isCustomResult(error)) {
        return error;
      } else {
        logger.error(`${__filename}::afterAirdropPaySuccess::catch`);
        logger.error(error);
        return responseHelper.error({
          internal_error_identifier: 'l_th_afterAirdropPaySuccess_2',
          api_error_identifier: 'unhandled_api_error',
          error_config: errorConfig,
          debug_options: {}
        });
      }
    }));
    console.log("-PPP--------------------------------------------------------------6.2--", Date.now(), 'ms');
    // we had pessimistically debitted estimatedDebitAmount from spenderAddress.
    // now adjusting the debit to actualDebitAmount.
    // subtract estimatedDebitAmount from un_settled_debit_amount AND subtract actualDebitAmount from settle_amount.
    promiseArray.push(new openSTStorage.TokenBalanceModel({
      ddb_service: ddbServiceObj,
      auto_scaling: autoScalingServiceObj,
      erc20_contract_address: brandedTokenAddress
    }).update({
      ethereum_address: spenderAddress,
      settle_amount: (actualDebitAmount.mul(basicHelper.convertToBigNumber(-1))).toString(10),
      un_settled_debit_amount: (estimatedDebitAmount.mul(basicHelper.convertToBigNumber(-1))).toString(10)
    }).catch(function (error) {
      if (responseHelper.isCustomResult(error)) {
        return error;
      } else {
        logger.error(`${__filename}::afterAirdropPaySuccess::catch`);
        logger.error(error);
        return responseHelper.error({
          internal_error_identifier: 'l_th_afterAirdropPaySuccess_3',
          api_error_identifier: 'unhandled_api_error',
          error_config: errorConfig,
          debug_options: {}
        });
      }
    }));
    console.log("-PPP--------------------------------------------------------------6.3--", Date.now(), 'ms');
    // we had debited estimatedAirdropAmount previously from spender balance, now adjusting the delta.
    promiseArray.push(oThis.updateAirdropBalance(airdropAddress, spenderAddress, estimatedAirdropAmount.minus(actualAirdropAmount)));
    console.log("-PPP--------------------------------------------------------------6.4--", Date.now(), 'ms');
    // changes for spender address.
    // we had added estimatedAirdropAmount previously to airdropBugdetAddress un_settled_debit_amount, now subtracting the same.
    // AND subtracting actualAirdropAmount from settle_amount
    promiseArray.push(new openSTStorage.TokenBalanceModel({
      ddb_service: ddbServiceObj,
      auto_scaling: autoScalingServiceObj,
      erc20_contract_address: brandedTokenAddress
    }).update({
      ethereum_address: airdropBugdetAddress,
      settle_amount: (actualAirdropAmount.mul(basicHelper.convertToBigNumber(-1))).toString(10),
      un_settled_debit_amount: (estimatedAirdropAmount.mul(basicHelper.convertToBigNumber(-1))).toString(10)
    }).catch(function (error) {
      if (responseHelper.isCustomResult(error)) {
        return error;
      } else {
        logger.error(`${__filename}::afterAirdropPaySuccess::catch`);
        logger.error(error);
        return responseHelper.error({
          internal_error_identifier: 'l_th_afterAirdropPaySuccess_4',
          api_error_identifier: 'unhandled_api_error',
          error_config: errorConfig,
          debug_options: {}
        });
      }
    }));
    console.log("-PPP--------------------------------------------------------------6.5--", Date.now(), 'ms');
    let resp = await Promise.all(promiseArray)
    console.log("-PPP--------------------------------------------------------------6.6--", Date.now(), 'ms');
    return resp;
  },

  /**
   * After airdrop pay function, this is called after the pay is failed
   *
   * @param {string} brandedTokenAddress - branded token address
   * @param {string} airdropAddress - airdrop contract address
   * @param {string} spenderAddress - spender address
   * @param {BigNumber} estimatedPayAmount - estimated pay amount in weis
   * @param {BigNumber} estimatedAirdropAmount - estimated airdrop amount
   * @param {string} airdropBugdetAddress - airdrop budget holder address
   *
   * @return {promise<result>}
   *
   */
  afterAirdropPayFailure: function (brandedTokenAddress, airdropAddress, spenderAddress,
                                    estimatedPayAmount, estimatedAirdropAmount, airdropBugdetAddress) {

    logger.debug('lib/transaction_helper.js:afterAirdropPayFailure called with params:', JSON.stringify(
      {brandedTokenAddress: brandedTokenAddress, airdropAddress: airdropAddress, spender: spenderAddress,
        estimatedAirdropAmount: estimatedAirdropAmount, airdropBugdetAddress: airdropBugdetAddress}));

    const oThis = this
      , amountToCreditToChain = estimatedPayAmount.minus(estimatedAirdropAmount)
      , zero = basicHelper.convertToBigNumber(0)
      , addressToBalanceChangeMap = {}
      , addressToAirdropBalanceChangeMap = {}
    ;

    addressToBalanceChangeMap[spenderAddress] = zero;
    addressToBalanceChangeMap[airdropBugdetAddress] = zero;
    addressToAirdropBalanceChangeMap[spenderAddress] = zero;

    const promiseArray = [];

    if (amountToCreditToChain.gt(0)) {
      // rollback the pessimistic debit made from the spender address
      promiseArray.push(new openSTStorage.TokenBalanceModel({
        ddb_service: ddbServiceObj,
        auto_scaling: autoScalingServiceObj,
        erc20_contract_address: brandedTokenAddress
      }).update({
        ethereum_address: spenderAddress,
        un_settled_debit_amount: (amountToCreditToChain.mul(basicHelper.convertToBigNumber(-1))).toString(10)
      }).catch(function (error) {
        if (responseHelper.isCustomResult(error)) {
          return error;
        } else {
          logger.error(`${__filename}::afterAirdropPayFailure::catch`);
          logger.error(error);
          return responseHelper.error({
            internal_error_identifier: 'l_th_afterAirdropPayFailure_1',
            api_error_identifier: 'unhandled_api_error',
            error_config: errorConfig,
            debug_options: {}
          });
        }
      }));
    }

    promiseArray.push(oThis.updateAirdropBalance(airdropAddress, spenderAddress, estimatedAirdropAmount));

    // rollback the pessimistic debit made from airdrop budget holder address.
    promiseArray.push(new openSTStorage.TokenBalanceModel({
      ddb_service: ddbServiceObj,
      auto_scaling: autoScalingServiceObj,
      erc20_contract_address: brandedTokenAddress
    }).update({
      ethereum_address: airdropBugdetAddress,
      un_settled_debit_amount: (estimatedAirdropAmount.mul(basicHelper.convertToBigNumber(-1))).toString(10)
    }).catch(function (error) {
      if (responseHelper.isCustomResult(error)) {
        return error;
      } else {
        logger.error(`${__filename}::afterAirdropPayFailure::catch`);
        logger.error(error);
        return responseHelper.error({
          internal_error_identifier: 'l_th_afterAirdropPayFailure_2',
          api_error_identifier: 'unhandled_api_error',
          error_config: errorConfig,
          debug_options: {}
        });
      }
    }));

    return Promise.all(promiseArray);
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
    return oThis.getActualAmountsFromDecodedEvents(decodedEvent.formattedTransactionReceipt.eventsData, eventName);

  },

  /**
   * Get actual beneficiary amount, actual commission amount and actual airdrop amount from decoded events
   *
   * @param {Object} decodedEvent - Decoded event from receipt
   * @param {string} eventName - Event name
   *
   * @return {result}
   */
  getActualAmountsFromDecodedEvents: function(events, eventName) {

    var actualBeneficiaryAmount = new BigNumber(0)
      , actualCommissionAmount = new BigNumber(0)
      , actualAirdropAmount = new BigNumber(0)
      , isEventDecoded = false
    ;

    // get event data
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
    if (isEventDecoded) {
      return responseHelper.successWithData(
        {actualBeneficiaryAmount: actualBeneficiaryAmount, actualCommissionAmount: actualCommissionAmount,
          actualAirdropAmount: actualAirdropAmount});
    } else {
      let errorParams = {
        internal_error_identifier: 'l_th_getActualAmountsFromDecodedEvents_1',
        api_error_identifier: 'no_events_in_receipt',
        error_config: errorConfig,
        debug_options: {}
      };
      return responseHelper.error(errorParams);
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
