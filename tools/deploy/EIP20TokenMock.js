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

  logger.info("argv[0]: " + argv[0]);
  logger.info("argv[1]: " + argv[1]);
  logger.info("argv[2]: " + argv[2]);
  logger.info("argv[3]: " + argv[3]);
  logger.info("argv[4]: " + argv[4]);
  logger.info("argv[5]: " + argv[5]);
  logger.info("argv[6]: " + argv[6]);

  if (argv.length < 6) {
    logger.error("Invalid arguments !!!");
    process.exit(0);
  }
  //argv[2] => uint256 conversionRate;
  //argv[3] => string symbol;
  //argv[4] => string name;
  //argv[5] => uint8 decimals;
  //argv[6] => string travis;
  const conversionRate = argv[2].trim();
  const symbol = argv[3].trim();
  const name = argv[4].trim();
  const decimals = argv[5].trim();
  var isTravisCIEnabled = false;
  if (argv[6] !== undefined) {
    isTravisCIEnabled = argv[6].trim() === 'travis';
  }

  logger.info("Deployer Address: " + deployerAddress);
  logger.info("conversionRate: " + conversionRate);
  logger.info("symbol: " + symbol);
  logger.info("name: " + name);
  logger.info("decimals: " + decimals);
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

  const contractName = 'eip20tokenmock';
  const contractAbi = coreAddresses.getAbiForContract(contractName);
  const contractBin = coreAddresses.getBinForContract(contractName);


  var constructorArgs = [
    conversionRate,
    symbol,
    name,
    decimals
  ];

  //logger.info("contractName: "+contractName);
  //logger.info(web3Provider);
  //logger.info("contractAbi: "+contractAbi);
  //logger.info("contractBin: "+contractBin);
  //logger.info("deployerName: "+deployerName);
  //logger.info("deploymentOptions: "+deploymentOptions);
  //logger.info("constructorArgs: "+constructorArgs);

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
  await deployHelper.updateEnvContractAddress('contractBT', {'ost_pricer_bt_contract_address': contractDeployTxReceipt.contractAddress});
}

performer(process.argv);
