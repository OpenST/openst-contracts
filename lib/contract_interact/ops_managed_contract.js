"use strict";

/**
 *
 * This is a utility file which would be used for executing all methods on OpsManaged Contract.<br><br>
 *
 * @module lib/contract_interact/ops_managed_contract
 *
 */

const rootPrefix = '../..'
  , helper = require('./helper')
  , OwnedContract = require('./owned_contract')
  , contractName = 'opsManaged'
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , contractAbi = coreAddresses.getAbiForContract(contractName)
  , web3RpcProvider = require(rootPrefix + '/lib/web3/providers/rpc')
  , currContract = new web3RpcProvider.eth.Contract(contractAbi)
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , gasLimit = coreConstants.OST_GAS_LIMIT
;

const notificationGlobalConstant = require(rootPrefix + '/lib/global_constant/notification')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
;

/**
 * @constructor
 * @augments OwnedContract
 *
 * @param {String} contractAddress - address where Contract has been deployed
 * @param {String} web3RpcProvider - webRpc provider of network where currContract has been deployed
 * @param {String} currContract - Contract Instance
 * @param {String} defaultGasPrice - default Gas Price
 *
 */
const OpsManagedContract = module.exports = function (contractAddress, defaultGasPrice, chainId) {
  this.contractAddress = contractAddress;
  this.web3RpcProvider = web3RpcProvider;
  this.currContract = currContract;
  this.defaultGasPrice = defaultGasPrice;
  this.currContract.options.address = contractAddress;
  this.currContract.setProvider( web3RpcProvider.currentProvider );
  this.chainId = chainId;
  OwnedContract.call(this, contractAddress, web3RpcProvider, currContract, defaultGasPrice);
};

OpsManagedContract.prototype = Object.create(OwnedContract.prototype);

OpsManagedContract.prototype.constructor = OpsManagedContract;

/**
 * Get currContract's Ops Address
 *
 * @return {Result}
 *
 */
OpsManagedContract.prototype.getOpsAddress = async function() {
  const transactionObject = this.currContract.methods.opsAddress();
  const encodedABI = transactionObject.encodeABI();
  const transactionOutputs = helper.getTransactionOutputs( transactionObject );
  const response = await helper.call(this.web3RpcProvider, this.contractAddress, encodedABI, {}, transactionOutputs);
  return Promise.resolve(response[0]);
};

/**
 * Set currContract's Ops Address
 *
 * @param {Hex} senderAddress - Sender Address
 * @param {String} senderPassphrase - Sender Passphrase
 * @param {String} opsAddress - address which is to be made Ops Address of currContract
 * @param {Object} options - options for this transaction
 *
 * @return {Promise}
 *
 */
OpsManagedContract.prototype.setOpsAddress = async function(senderAddress, senderPassphrase, opsAddress, options) {

  const oThis = this;
  return new Promise(function (onResolve, onReject) {
    const returnType = basicHelper.getReturnType(options.returnType);

    const transactionObject = oThis.currContract.methods.setOpsAddress(opsAddress);

    const notificationData = helper.getNotificationData(
      ['payments.opsManaged.setOpsAddress'],
      notificationGlobalConstant.publisher(),
      'setOpsAddress',
      contractName,
      oThis.contractAddress,
      web3RpcProvider,
      oThis.chainId,
      options);
    logger.info("========setOpsAddress.notificationData========");
    logger.info(notificationData);

    const params = {
      transactionObject: transactionObject,
      notificationData: notificationData,
      senderAddress: senderAddress,
      senderPassphrase: senderPassphrase,
      contractAddress: oThis.contractAddress,
      gasPrice: oThis.gasPrice,
      gasLimit: gasLimit,
      web3RpcProvider: web3RpcProvider,
      successCallback: null,
      failCallback: null,
      errorCode: "l_ci_omc_soo_1"
    };

    return onResolve(helper.performSend(params, returnType));

  });
};

