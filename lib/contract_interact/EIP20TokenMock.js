//"use strict";

/**
 *
 * This is a utility file which would be used for executing all methods on Pricer contract.<br><br>
 *
 * @module lib/contract_interact/pricer
 *
 */

const rootPrefix = '../..',
  InstanceComposer = require(rootPrefix + '/instance_composer'),
  gasLimitGlobalConstant = require(rootPrefix + '/lib/global_constant/gas_limit'),
  basicHelper = require(rootPrefix + '/helpers/basic_helper'),
  logger = require(rootPrefix + '/helpers/custom_console_logger');

const contractName = 'eip20tokenmock';

require(rootPrefix + '/lib/providers/storage');
require(rootPrefix + '/lib/contract_interact/helper');
require(rootPrefix + '/config/core_addresses');
require(rootPrefix + '/lib/providers/web3_factory');

/**
 * @constructor
 *
 */
const MockToken = function(mockTokenAddress) {
  this.contractAddress = mockTokenAddress;
};

MockToken.prototype = {
  /**
   * Get balance of address
   *
   * @param {String} ownerAddress - address for which balance is to be fetched
   *
   * @return {Promise}
   *
   */
  balanceOf: async function(ownerAddress) {
    const oThis = this,
      helper = oThis.ic().getContractInteractHelper(),
      coreAddresses = oThis.ic().getCoreAddresses(),
      web3ProviderFactory = oThis.ic().getWeb3ProviderFactory(),
      web3Provider = web3ProviderFactory.getProvider(web3ProviderFactory.typeWS),
      contractAbi = coreAddresses.getAbiForContract(contractName),
      currContract = new web3Provider.eth.Contract(contractAbi);

    const transactionObject = currContract.methods.balanceOf(ownerAddress);
    const encodedABI = transactionObject.encodeABI();
    const transactionOutputs = helper.getTransactionOutputs(transactionObject);
    const response = await helper.call(web3Provider, this.contractAddress, encodedABI, {}, transactionOutputs);
    return Promise.resolve(response[0]);
  },

  /**
   * Set balance
   *
   * @param {string} senderAddr - address of user who is sending amount
   * @param {string} senderPassphrase - sender address passphrase
   * @param {string} ownerAddress - address for which balance is to be set
   * @param {BigNumber} value - amount which is being transferred (in wei)
   * @param {BigNumber} gasPrice - gas price
   *
   * @return {Promise}
   *
   */
  setBalance: function(senderAddress, senderPassphrase, ownerAddress, value, gasPrice) {
    const oThis = this,
      storageProvider = oThis.ic().getStorageProvider(),
      helper = oThis.ic().getContractInteractHelper(),
      coreAddresses = oThis.ic().getCoreAddresses(),
      web3ProviderFactory = oThis.ic().getWeb3ProviderFactory(),
      web3Provider = web3ProviderFactory.getProvider(web3ProviderFactory.typeWS),
      contractAbi = coreAddresses.getAbiForContract(contractName),
      currContract = new web3Provider.eth.Contract(contractAbi),
      openSTStorage = storageProvider.getInstance(),
      TokenBalanceModel = openSTStorage.model.TokenBalance;

    if (!gasPrice) {
      return Promise.reject('GasPrice is mandatory');
    }
    helper.assertAddress(ownerAddress);
    helper.assertAddress(senderAddress);

    currContract.options.address = oThis.contractAddress;
    //currContract.setProvider( web3Provider.currentProvider );
    const transactionObject = currContract.methods.setBalance(ownerAddress, value);
    const encodedABI = transactionObject.encodeABI();
    return helper
      .safeSendFromAddr(web3Provider, oThis.contractAddress, encodedABI, senderAddress, senderPassphrase, {
        gasPrice: gasPrice,
        gas: gasLimitGlobalConstant.default()
      })
      .then(async function(transactionReceipt) {
        // set balance in dynamo and cache.
        const balanceUpdateResponse = await new TokenBalanceModel({
          erc20_contract_address: oThis.contractAddress
        })
          .set({
            ethereum_address: ownerAddress,
            settle_amount: basicHelper.convertToBigNumber(value).toString(10),
            pessimistic_settled_balance: basicHelper.convertToBigNumber(value).toString(10),
            un_settled_debit_amount: basicHelper.convertToBigNumber(0).toString(10)
          })
          .catch(function(error) {
            logger.error('lib/contract_interact/EIP20TokenMock.js:set Balance inside catch:', error);
          });
        return Promise.resolve(transactionReceipt);
      });
  },

  /**
   * Set conversion rate
   *
   * @param {string} senderAddr - address of sender
   * @param {string} senderPassphrase - passphrase of sender
   * @param {number} conversionRate - conversion rate of branded token
   * @param {BigNumber} gasPrice - gas price
   *
   * @return {Promise}
   *
   */
  setConversionRate: function(senderAddress, senderPassphrase, conversionRate, gasPrice) {
    const oThis = this,
      helper = oThis.ic().getContractInteractHelper(),
      coreAddresses = oThis.ic().getCoreAddresses(),
      web3ProviderFactory = oThis.ic().getWeb3ProviderFactory(),
      web3Provider = web3ProviderFactory.getProvider(web3ProviderFactory.typeWS),
      contractAbi = coreAddresses.getAbiForContract(contractName),
      currContract = new web3Provider.eth.Contract(contractAbi);

    if (!gasPrice) {
      return Promise.reject('GasPrice is mandatory');
    }
    helper.assertAddress(senderAddress);

    currContract.options.address = this.contractAddress;
    //currContract.setProvider( web3Provider.currentProvider );
    const transactionObject = currContract.methods.setConverionRate(conversionRate);
    const encodedABI = transactionObject.encodeABI();
    return helper
      .safeSendFromAddr(web3Provider, this.contractAddress, encodedABI, senderAddress, senderPassphrase, {
        gasPrice: gasPrice,
        gas: gasLimitGlobalConstant.default()
      })
      .then(function(transactionReceipt) {
        return Promise.resolve(transactionReceipt);
      });
  },

  /**
   * Approve
   *
   * @param {string} senderAddr - address of sender
   * @param {string} senderPassphrase - passphrase of sender
   * @param {string} spenderAddress - address which will be approved for spending
   * @param {BigNumber} value - amount which is being approved (in wei)
   * @param {BigNumber} gasPrice - gas price
   *
   * @return {Promise}
   *
   */
  approve: function(senderAddress, senderPassphrase, spenderAddress, value, gasPrice) {
    const oThis = this,
      helper = oThis.ic().getContractInteractHelper(),
      coreAddresses = oThis.ic().getCoreAddresses(),
      web3ProviderFactory = oThis.ic().getWeb3ProviderFactory(),
      web3Provider = web3ProviderFactory.getProvider(web3ProviderFactory.typeWS),
      contractAbi = coreAddresses.getAbiForContract(contractName),
      currContract = new web3Provider.eth.Contract(contractAbi);

    if (!gasPrice) {
      return Promise.reject('GasPrice is mandatory');
    }
    helper.assertAddress(senderAddress);
    helper.assertAddress(spenderAddress);

    currContract.options.address = this.contractAddress;
    //currContract.setProvider( web3Provider.currentProvider );
    const transactionObject = currContract.methods.approve(spenderAddress, value);
    const encodedABI = transactionObject.encodeABI();
    return helper
      .safeSendFromAddr(web3Provider, this.contractAddress, encodedABI, senderAddress, senderPassphrase, {
        gasPrice: gasPrice,
        gas: gasLimitGlobalConstant.default()
      })
      .then(function(transactionReceipt) {
        return Promise.resolve(transactionReceipt);
      });
  }
};

InstanceComposer.registerShadowableClass(MockToken, 'getMockTokenInteractClass');

module.exports = MockToken;
