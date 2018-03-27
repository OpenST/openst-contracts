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
const rootPrefix = '../..';
const web3Provider = require(rootPrefix + '/lib/web3/providers/rpc');
const Deployer = require(rootPrefix + '/lib/deployer');
const coreConstants = require(rootPrefix + '/config/core_constants');
const coreAddresses = require(rootPrefix + '/config/core_addresses');
const prompts = readline.createInterface(process.stdin, process.stdout);
const logger = require(rootPrefix + '/helpers/custom_console_logger');
const OpsManagedContract = require(rootPrefix + "/lib/contract_interact/ops_managed_contract");
const returnTypes = require(rootPrefix + "/lib/global_constant/return_types");

// Different addresses used for deployment
const deployerName = "deployer"
  , deployerAddress = coreAddresses.getAddressForUser(deployerName)
  , deployerPassphrase = coreAddresses.getPassphraseForUser(deployerName)
;

const opsName = "ops";
const opsAddress = coreAddresses.getAddressForUser(opsName);


/**
 * Validation Method
 *
 * @param {Array} arguments
 *
 * @return {}
 */
function validate(argv) {
  if (!argv[2]) {
    logger.error("brandedTokenAddress is mandatory!");
    process.exit(0);
  }
  if (!argv[3]) {
    logger.error("Base currency is mandatory!");
    process.exit(0);
  }
  if (!argv[4]) {
    logger.error("Worker Contract Address is mandatory!");
    process.exit(0);
  }
  if (!argv[5]) {
    logger.error("airdropbudgetholder is mandatory!");
    process.exit(0);
  }
  if (!argv[6]) {
    logger.error("gas price is mandatory!");
    process.exit(0);
  }
  if (!argv[7]) {
    logger.error("chainId is mandatory!");
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
  if (argv[8] !== undefined) {
    isTravisCIEnabled = argv[8].trim() === 'travis';
  }
  const fileForContractAddress = (argv[9] !== undefined) ? argv[9].trim() : '';

  logger.debug("Deployer Address: " + deployerAddress);
  logger.debug("Ops Address: " + opsAddress);
  logger.debug("Branded Token Address: " + brandedTokenAddress);
  logger.debug("Base currency: " + baseCurrency);
  logger.debug("Worker Contract Address: " + workerContractAddress);
  logger.debug("Airdrop Budget Holder: " + airdropBudgetHolder);
  logger.debug("Gas price: " + gasPrice);
  logger.debug("chainId: " + chainId);
  logger.debug("Travis CI enabled Status: " + isTravisCIEnabled);
  logger.debug("File to write For ContractAddress: "+fileForContractAddress);

  if (isTravisCIEnabled === false ) {
    await new Promise(
      function (onResolve, onReject) {
        prompts.question("Please verify all above details. Do you want to proceed? [Y/N]", function (intent) {
          if (intent === 'Y') {
            logger.debug('Great! Proceeding deployment.');
            prompts.close();
            onResolve();
          } else {
            logger.error('Exiting deployment scripts. Change the enviroment variables and re-run.');
            process.exit(1);
          }
        });
      }
    );
  } else {
    prompts.close();
  }

  const contractName = 'airdrop'
    , deployerInstance = new Deployer()
  ;

  const constructorArgs = [
    brandedTokenAddress,
    web3Provider.utils.asciiToHex(baseCurrency),
    workerContractAddress,
    airdropBudgetHolder
  ];
  const deployOptions = {returnType: returnTypes.transactionReceipt()};
  const deployResult =  await deployerInstance.deploy(
    contractName,
    constructorArgs,
    gasPrice,
    deployOptions);

  if (deployResult.isSuccess()) {
    const contractAddress = deployResult.data.transaction_receipt.contractAddress;
    logger.win("contractAddress: " + contractAddress);
    if (fileForContractAddress !== '') {
      deployerInstance.writeContractAddressToFile(fileForContractAddress, contractAddress);
    }

    logger.debug("Setting Ops Address to: " + opsAddress);
    const opsManaged = new OpsManagedContract(contractAddress, gasPrice, chainId)
      , setOpsOptions = {
          returnType: returnTypes.transactionReceipt(),
          tag: ''
        }
    ;
    var setOpsResult = await opsManaged.setOpsAddress(deployerAddress,
      deployerPassphrase,
      opsAddress,
      setOpsOptions
    );
    logger.debug(setOpsResult);
    var contractOpsAddress = await opsManaged.getOpsAddress();
    logger.debug("Ops Address Set to: " + contractOpsAddress);

  } else {
    logger.error("Error deploying contract");
    logger.error(deployResult);
  }
  process.exit(0);
}

// node tools/deploy/airdrop.js brandedTokenContractAddress baseCurrency workerContractAddress airdropBudgetHolder gasPrice chainId <travis> <fileToWrite>
performer(process.argv);
