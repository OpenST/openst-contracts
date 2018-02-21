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
 *       <li>Deploy Pricer contract</li>
 *     </ol>
 *
 *
 * @module tools/deploy/pricer
 */

const readline = require('readline');
const rootPrefix = '../..';
const web3Provider = require(rootPrefix + '/lib/web3/providers/rpc');
const prompts = readline.createInterface(process.stdin, process.stdout);
const logger = require(rootPrefix + '/helpers/custom_console_logger');
const OpsManagedContract = require(rootPrefix + "/lib/contract_interact/ops_managed_contract");
const Deployer = require(rootPrefix + '/lib/deployer');
const coreAddresses = require(rootPrefix + '/config/core_addresses');
const coreConstants = require(rootPrefix + '/config/core_constants');


/**
 * Validation Method
 *
 * @param {Array} arguments
 *
 * @return {}
 */
function validate(argv) {
  if (argv[2] === undefined || argv[2] === '') {
    logger.error("Mandatory Param is missing! ( brandedTokenAddress)");
    process.exit(0);
  }

  if (argv[3] === undefined || argv[3] === '') {
    logger.error("Base currency is mandatory!");
    process.exit(0);
  }
  if (argv[4] === undefined || argv[4] === '') {
    logger.error("Gas Price is mandatory!");
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

  logger.info("argv[0]: " + argv[0]);
  logger.info("argv[1]: " + argv[1]);
  logger.info("argv[2]: " + argv[2]);
  logger.info("argv[3]: " + argv[3]);
  logger.info("argv[4]: " + argv[4]);
  logger.info("argv[5]: " + argv[5]);
  logger.info("argv[6]: " + argv[6]);

  validate(argv);
  const brandedTokenAddress = argv[2].trim();
  const baseCurrency = argv[3].trim();
  const gasPrice = argv[4].trim();
  var isTravisCIEnabled = false;
  if (argv[5] !== undefined) {
    isTravisCIEnabled = argv[5].trim() === 'travis';
  }

  const fileForContractAddress = (argv[6] !== undefined) ? argv[6].trim() : '';

  logger.info("Branded Token Address: " + brandedTokenAddress);
  logger.info("Base currency: " + baseCurrency);
  logger.info("Gas price: " + gasPrice);
  logger.info("Travis CI enabled Status: " + isTravisCIEnabled);
  logger.info("File to write For ContractAddress: "+fileForContractAddress);
  if (isTravisCIEnabled === false ) {
    await new Promise(
      function (onResolve, onReject) {
        prompts.question("Please verify all above details. Do you want to proceed? [Y/N]", function (intent) {
          if (intent === 'Y') {
            logger.info('Great! Proceeding deployment.');
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

  const contractName = 'pricer';

  var constructorArgs = [
    brandedTokenAddress,
    web3Provider.utils.asciiToHex(baseCurrency)
  ];

  const deployerInstance = new Deployer();

  const options = {returnType: "txReceipt"};

  const deployResult =  await deployerInstance.deploy(
    contractName,
    constructorArgs,
    gasPrice,
    options);

  if (deployResult.isSuccess()) {
    const contractAddress = deployResult.data.transaction_receipt.contractAddress;
    logger.win("contractAddress: " + contractAddress);
    if (fileForContractAddress !== '') {
      deployerInstance.writeContractAddressToFile(fileForContractAddress, contractAddress);
    }

    // set ops address
    const opsName = "ops";
    const opsAddress = coreAddresses.getAddressForUser(opsName);

    logger.info("Setting Ops Address to: " + opsAddress);
    const deployerName = "deployer";
    var opsManaged = new OpsManagedContract(contractAddress, gasPrice);
    var result = await opsManaged.setOpsAddress(deployerName, opsAddress, {
      gasPrice: gasPrice,
      gas: coreConstants.OST_GAS_LIMIT
    });
    logger.info(result);
    var contractOpsAddress = await opsManaged.getOpsAddress();
    logger.info("Ops Address Set to: " + contractOpsAddress);

  }

}

performer(process.argv);
