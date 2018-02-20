/**
 * This is script for deploying any contract.<br><br>
 *
 *   Prerequisite:
 *    <ol>
 *       <li>Deployer Address</li>
 *     </ol>
 *
 *
 *
 *
 * @module tools/deploy/pricer
 */

const rootPrefix = '..';
const web3Provider = require(rootPrefix + '/lib/web3/providers/rpc');
const coreConstants = require(rootPrefix + '/config/core_constants');
const coreAddresses = require(rootPrefix + '/config/core_addresses');
const logger = require(rootPrefix + '/helpers/custom_console_logger');
const responseHelper = require(rootPrefix + '/lib/formatter/response');
const basicHelper = require(rootPrefix + '/helpers/basic_helper');
const uuid = require('uuid');


/**
 * @constructor
 *
 * @param {Hex} pricerAddress - pricer contract address
 * @param {string} chainId - chain ID
 *
 */
const Deploy = module.exports = function () {};

Deploy.prototype = {


  /**
  * Validate deploy parameters
  *
  * @param {string} deployerName - Deployer name
  * @param {string} contractName - Contract name
  * @param {BigNumber} gasPrice - Gas price
  * @param {string} fileForContractAddress - path for file where the address will be witten
  *
  * @return {response}
  *
  */
  validateDeployParams: function(
    deployerName,
    contractName,
    gasPrice,
    fileForContractAddress) {

    if (deployerName === undefined || deployerName === '') {
      logger.error("Error: Deployer name is mandatory");
      return responseHelper.error('l_d_1', 'Deployer name is mandatory');
    }

    if (contractName === undefined || contractName === '') {
      logger.error("Error: Contract name is mandatory");
      return responseHelper.error('l_d_2', 'Contract name is mandatory');
    }

    if (gasPrice === undefined || gasPrice === '') {
      logger.error("Error: Gas price is mandatory");
      return responseHelper.error('l_d_3', 'Gas price is mandatory');
    }

    const deployerAddress = coreAddresses.getAddressForUser(deployerName);
    if (deployerAddress === undefined || deployerAddress === '') {
      logger.error("Error: Deployer address is invalid");
      return responseHelper.error('l_d_4', 'Deployer address is invalid');
    }

    const deployerAddrPassphrase = coreAddresses.getPassphraseForUser(deployerName);
    if (deployerAddrPassphrase === undefined || deployerAddrPassphrase === '') {
      logger.error("Error: Deployer passphrase is invalid");
      return responseHelper.error('l_d_5', 'Deployer passphrase is invalid');
    }

    return responseHelper.successWithData({});

  },

  /**
  * Deploy contract
  *
  * @param {string} deployerName - Deployer name
  * @param {string} contractName - Contract name
  * @param {Array} constructorArgs - Contract constructor params
  * @param {BigNumber} gasPrice - Gas price
  * @param {string} fileForContractAddress - path for file where the address will be witten
  * @param {object} options - for params like returnType, tag.
  *
  * @return {response}
  *
  */
  deploy: function(
    deployerName,
    contractName,
    constructorArgs,
    gasPrice,
    fileForContractAddress,
    options) {

    const oThis = this;

    return new Promise(function (onResolve, onReject) {
      const fileName = (fileForContractAddress !== undefined) ? fileForContractAddress.trim() : '';

      logger.info("Contract name: " + contractName);
      logger.info("Gas price: " + gasPrice);
      logger.info("Constructor arguments: " + constructorArgs);
      logger.info("File name for contract address: " + fileName);
      logger.info("Deployer name: " + deployerName);

      const validationResult = oThis.validateDeployParams(deployerName,
        contractName,
        gasPrice,
        fileForContractAddress);

      if (validationResult.isFailure()) {
        return onResolve(validationResult);
      }

      const txUUID = uuid.v4();
      const returnType = basicHelper.getReturnType(options.returnType);

      const asyncPerform = function () {

        const deployerAddress = coreAddresses.getAddressForUser(deployerName);
        const deployerAddrPassphrase = coreAddresses.getPassphraseForUser(deployerName);

        const contractAbi = coreAddresses.getAbiForContract(contractName);
        const contractBin = coreAddresses.getBinForContract(contractName);

        const txParams = {
          from: deployerAddress,
          data: (web3Provider.utils.isHexStrict(contractBin) ? "" : "0x") + contractBin,
          gasPrice: gasPrice,
          gas: coreConstants.OST_GAS_LIMIT
        };

        if (constructorArgs) {
          txParams.arguments = constructorArgs;
        }

        var contract = new web3Provider.eth.Contract(
          contractAbi,
          null,
          txParams
        );

        // this is needed since the contract object
        contract.setProvider(web3Provider.currentProvider);

        // Unlock account
        web3Provider.eth.personal.unlockAccount(
          deployerAddress,
          deployerAddrPassphrase)
          .then(function() {
            contract.deploy(txParams).send()
              .on('transactionHash', function(transactionHash) {
                logger.info(`Transaction hash received for ${txUUID} :${transactionHash}`);
                if (basicHelper.isReturnTypeTxHash(returnType)) {
                  return onResolve(
                    responseHelper.successWithData(
                      {
                        transaction_uuid: txUUID,
                        transaction_hash: transactionHash,
                        transaction_receipt: {}
                      }));
                }
              })
              .on('receipt', function(receipt) {

                const contractAddress = receipt.contractAddress;
                web3Provider.eth.getCode(contractAddress).then(function(code) {
                  if (code.length <= 2) {
                    const errorCode = "l_d_7";
                    logger.error(`${errorCode}: Contract deployment failed`);
                    if (basicHelper.isReturnTypeTxReceipt(returnType)) {
                      return onResolve(responseHelper.error(errorCode, 'Contract deployment failed'));
                    }
                  } else if (basicHelper.isReturnTypeTxReceipt(returnType)) {
                    logger.win(`Contract deployment success: ${txUUID}`);
                    return onResolve(
                      responseHelper.successWithData(
                        {
                          transaction_uuid: txUUID,
                          transaction_hash: receipt.transactionHash,
                          transaction_receipt: receipt
                        }));
                  }
                })
                  .catch(function(reason) {
                    const errorCode = "l_d_8";
                    logger.error(`${errorCode}: Contract deployment failed`);
                    if (basicHelper.isReturnTypeTxReceipt(returnType)) {
                      return onResolve(responseHelper.error(errorCode, 'Contract deployment failed'));
                    }
                  });
              });
          })
          .catch(function(reason) {
            const errorCode = "l_d_6";
            logger.error(`${errorCode}: Contract deployment failed`);
            return onResolve(responseHelper.error(errorCode, 'transaction failed'));
          });

      };
      if (basicHelper.isReturnTypeUUID(returnType)) {
        asyncPerform();
        return onResolve(
          responseHelper.successWithData(
            {
              transaction_uuid: txUUID,
              transaction_hash: "",
              transaction_receipt: {}
            }));
      } else {
        return asyncPerform();
      }

    });
  }
};

