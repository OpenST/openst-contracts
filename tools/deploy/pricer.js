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
const deployHelper = require(rootPrefix + '/tools/deploy/helper');
const coreConstants = require(rootPrefix + '/config/core_constants');
const coreAddresses = require(rootPrefix + '/config/core_addresses');
const prompts = readline.createInterface(process.stdin, process.stdout);
const logger = require(rootPrefix + '/helpers/custom_console_logger');
//const PriceOracle = require(rootPrefix + "/lib/contract_interact/price_oracle");

const deploymentOptions = {
  gasPrice: coreConstants.OST_GAS_PRICE,
  gas: coreConstants.OST_GAS_LIMIT
};

// Different addresses used for deployment
const deployerName = "deployer";
const deployerAddress = coreAddresses.getAddressForUser(deployerName);

/**
 * It is the main performer method of this deployment script
 *
 * @param {Array} arguments
 *
 * @return {}
 */
async function performer(argv) {

  const brandedTokenAddress = argv[2].trim();
  const travisCIEnabledValue = argv[3].trim();

  const isTravisCIEnabled = travisCIEnabledValue === 'travis';

  logger.info("Deployer Address: " + deployerAddress);
  logger.info("Branded Token Address: " + brandedTokenAddress);
  logger.info("Travis CI enabled Status: " + isTravisCIEnabled);

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
  const contractAbi = coreAddresses.getAbiForContract(contractName);
  const contractBin = coreAddresses.getBinForContract(contractName);


  var constructorArgs = [brandedTokenAddress];

  logger.info("Deploying contract: "+contractName);

  var contractDeployTxReceipt = await deployHelper.perform(
    contractName,
    web3Provider,
    contractAbi,
    contractBin,
    deployerName,
    deploymentOptions,
    constructorArgs
  );

  logger.info(contractDeployTxReceipt);
  logger.win(contractName+ " Deployed ");

}

performer(process.argv);
