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
  logger.info("argv[7]: " + argv[7]);
  logger.info("argv[8]: " + argv[8]);

  if (argv.length < 7) {
    logger.error("Invalid arguments !!!");
    process.exit(0);
  }
  //argv[2] => uint256 conversionRate;
  //argv[3] => string symbol;
  //argv[4] => string name;
  //argv[5] => uint8 decimals;
  //argv[6] => hex gasPrice;
  //argv[7] => string travis;
  //argv[8] => string File name where contract address needs to write;
  const conversionRate = argv[2].trim();
  const symbol = argv[3].trim();
  const name = argv[4].trim();
  const decimals = argv[5].trim();
  const gasPrice = argv[6].trim();
  var isTravisCIEnabled = false;
  if (argv[7] !== undefined) {
    isTravisCIEnabled = argv[7].trim() === 'travis';
  }
  const fileForContractAddress = (argv[8] !== undefined) ? argv[8].trim() : '';
  const deploymentOptions = {
    gasPrice: gasPrice,
    gas: coreConstants.OST_GAS_LIMIT
  };

  logger.info("Deployer Address: " + deployerAddress);
  logger.info("conversionRate: " + conversionRate);
  logger.info("symbol: " + symbol);
  logger.info("name: " + name);
  logger.info("decimals: " + decimals);
  logger.info("gasPrice: " + gasPrice);
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
  const contractAddress = contractDeployTxReceipt.receipt.contractAddress;
  // if (isTravisCIEnabled) {
  //   await deployHelper.updateEnvContractAddress(
  //     'contractBT', {'ost_pricer_bt_contract_address': contractDeployTxReceipt.contractAddress});
  // }
  deployHelper.writeContractAddressToFile(fileForContractAddress, contractAddress);
}

// example: node ../tools/deploy/EIP20TokenMock.js 5 DKN deepeshCoin 18 0x12A05F200 travis bt.txt
performer(process.argv);
