'use strict';

/**
 * This is script for deploying Pricer contract on any chain.<br><br>
 *
 *   Prerequisite:
 *    <ol>
 *       <li>Deployer Address</li>
 *     </ol>
 *
 *   These are the following steps:<br>
 *     <ol>
 *       <li>Deploy Airdrop contract</li>
 *     </ol>
 *
 *
 * @module tools/deploy/pricer
 */

const readline = require('readline');

const rootPrefix = '../..',
  prompts = readline.createInterface(process.stdin, process.stdout),
  logger = require(rootPrefix + '/helpers/custom_console_logger'),
  returnTypes = require(rootPrefix + '/lib/global_constant/return_types'),
  InstanceComposer = require(rootPrefix + '/instance_composer');

// Different addresses used for deployment
const deployerName = 'deployer',
  opsName = 'ops';

require(rootPrefix + '/config/core_addresses');
require(rootPrefix + '/services/manifest');
require(rootPrefix + '/tools/deploy/helper');

/**
 * Validation Method
 *
 * @param {Array} arguments
 *
 * @return {}
 */
function validate(argv) {
  if (!argv[2]) {
    logger.error('brandedTokenAddress is mandatory!');
    process.exit(0);
  }
  if (!argv[3]) {
    logger.error('Base currency is mandatory!');
    process.exit(0);
  }
  if (!argv[4]) {
    logger.error('Worker Contract Address is mandatory!');
    process.exit(0);
  }
  if (!argv[5]) {
    logger.error('airdropbudgetholder is mandatory!');
    process.exit(0);
  }
  if (!argv[6]) {
    logger.error('gas price is mandatory!');
    process.exit(0);
  }
  if (!argv[7]) {
    logger.error('chainId is mandatory!');
    process.exit(0);
  }

  if (!argv[8]) {
    logger.error('Config strategy file is mandatory!');
    process.exit(0);
  }
}

/**
 * It is the main performer method of this deployment script
 *
 * @param {Array} arguments
 *
 * @return {}
 */
async function performer(argv) {
  validate(argv);
  const brandedTokenAddress = argv[2].trim();
  const baseCurrency = argv[3].trim();
  const workerContractAddress = argv[4].trim();
  const airdropBudgetHolder = argv[5].trim();
  const gasPrice = argv[6].trim();
  const chainId = argv[7].trim();
  var isTravisCIEnabled = false;

  const fileForConfigStrategy = argv[8] !== undefined ? argv[8].trim() : '';

  if (argv[9] !== undefined) {
    isTravisCIEnabled = argv[9].trim() === 'travis';
  }
  const fileForContractAddress = argv[10] !== undefined ? argv[10].trim() : '';

  if (!fileForConfigStrategy) {
    logger.error('Exiting airdrop deployment script. Invalid fileForConfigStrategy', fileForConfigStrategy);
    process.exit(1);
  }

  logger.debug('Branded Token Address: ' + brandedTokenAddress);
  logger.debug('Base currency: ' + baseCurrency);
  logger.debug('Worker Contract Address: ' + workerContractAddress);
  logger.debug('Airdrop Budget Holder: ' + airdropBudgetHolder);
  logger.debug('Gas price: ' + gasPrice);
  logger.debug('chainId: ' + chainId);
  logger.debug('Travis CI enabled Status: ' + isTravisCIEnabled);
  logger.debug('File to write For ContractAddress: ' + fileForContractAddress);
  logger.debug('fileForConfigStrategy: ' + fileForConfigStrategy);

  if (isTravisCIEnabled === false) {
    await new Promise(function(onResolve, onReject) {
      prompts.question('Please verify all above details. Do you want to proceed? [Y/N]', function(intent) {
        if (intent === 'Y') {
          logger.debug('Great! Proceeding deployment.');
          prompts.close();
          onResolve();
        } else {
          logger.error('Exiting deployment scripts. Change the enviroment variables and re-run.');
          process.exit(1);
        }
      });
    });
  } else {
    prompts.close();
  }

  const configStrategy = require(rootPrefix + fileForConfigStrategy),
    instanceComposer = new InstanceComposer(configStrategy),
    helper = instanceComposer.getDeployHelper(),
    manifest = instanceComposer.getServiceManifest(),
    SetOpsKlass = manifest.opsManaged.setOps,
    GetOpsKlass = manifest.opsManaged.getOps,
    DeployAirdropKlass = manifest.deploy.airdrop,
    coreAddresses = instanceComposer.getCoreAddresses(),
    deployerAddress = coreAddresses.getAddressForUser(deployerName),
    deployerPassphrase = coreAddresses.getPassphraseForUser(deployerName),
    opsAddress = coreAddresses.getAddressForUser(opsName);

  logger.debug('Deployer Address: ' + deployerAddress);
  logger.debug('Ops Address: ' + opsAddress);

  const deployOptions = { returnType: returnTypes.transactionReceipt() };
  const DeployAirdropObject = new DeployAirdropKlass({
    branded_token_contract_address: brandedTokenAddress,
    base_currency: baseCurrency,
    worker_contract_address: workerContractAddress,
    airdrop_budget_holder: airdropBudgetHolder,
    gas_price: gasPrice,
    options: deployOptions
  });
  const deployResult = await DeployAirdropObject.perform();

  if (deployResult.isSuccess()) {
    const contractAddress = deployResult.data.transaction_receipt.contractAddress;
    logger.win('contractAddress: ' + contractAddress);
    if (fileForContractAddress !== '') {
      helper.writeContractAddressToFile(fileForContractAddress, contractAddress);
    }

    const setOpsOptions = {
      returnType: returnTypes.transactionReceipt(),
      tag: ''
    };
    logger.debug('Setting Ops Address to: ' + opsAddress);
    const SetOpsObject = new SetOpsKlass({
      contract_address: contractAddress,
      gas_price: gasPrice,
      chain_id: chainId,
      deployer_address: deployerAddress,
      deployer_passphrase: deployerPassphrase,
      ops_address: opsAddress,
      options: setOpsOptions
    });
    var setOpsResult = await SetOpsObject.perform();
    logger.debug(setOpsResult);

    const GetOpsObject = new GetOpsKlass({
      contract_address: contractAddress,
      gas_price: gasPrice,
      chain_id: chainId
    });
    const getOpsResult = await GetOpsObject.perform();
    const contractOpsAddress = getOpsResult.data.opsAddress;
    logger.debug('Ops Address Set to: ' + contractOpsAddress);
  } else {
    logger.error('Error deploying contract');
    logger.error(deployResult);
  }
  process.exit(0);
}

// node tools/deploy/airdrop.js brandedTokenContractAddress baseCurrency workerContractAddress airdropBudgetHolder gasPrice chainId <travis> <fileToWrite> <strategyFilePath>
performer(process.argv);
