/**
 * This is script for deploying Pricer contract on any chain.<br><br>
 *
 *   Prerequisite:
 *    <ol>
 *       <li>Deployer Address</li>
 *     </ol>
 *
 *
 * @module tools/deploy/EIP20TokenMock
 */

const readline = require('readline');
const rootPrefix = '../..';
const prompts = readline.createInterface(process.stdin, process.stdout);
const logger = require(rootPrefix + '/helpers/custom_console_logger');
const Deployer = require(rootPrefix + '/lib/deployer');
const coreConstants = require(rootPrefix + '/config/core_constants');
const BigNumber = require('bignumber.js');

/**
 * It is the main performer method of this deployment script
 *
 * @param {Array} arguments
 *
 * @return {}
 */


async function performer(argv) {

  if (argv.length < 7) {
    logger.error("Invalid arguments !!!");
    process.exit(0);
  }
  //argv[2] => uint256 conversionFactor;
  //argv[3] => string symbol;
  //argv[4] => string name;
  //argv[5] => uint8 decimals;
  //argv[6] => hex gasPrice;
  //argv[7] => string travis;
  //argv[8] => string File name where contract address needs to write;
  const conversionFactor = argv[2].trim();
  const symbol = argv[3].trim();
  const name = argv[4].trim();
  const decimals = argv[5].trim();
  const gasPrice = argv[6].trim();
  var isTravisCIEnabled = false;
  if (argv[7] !== undefined) {
    isTravisCIEnabled = argv[7].trim() === 'travis';
  }
  const fileForContractAddress = (argv[8] !== undefined) ? argv[8].trim() : '';


  const conversionDecimals = 5;
  const conversionRate = (new BigNumber(String(conversionFactor))).mul((new BigNumber(10)).toPower(conversionDecimals));
  if (!conversionRate.modulo(1).equals(0)){
    logger.error('Exiting deployment scripts. Invalid conversion factor');
    process.exit(1);
  }


  logger.info("conversionFactor: " + conversionFactor);
  logger.info("conversionRate: " + conversionRate);
  logger.info("conversionDecimals: " + conversionDecimals);
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

  var constructorArgs = [
    conversionRate,
    conversionDecimals,
    symbol,
    name,
    decimals
  ];

  const options = {returnType: "txReceipt"};

  const deployerInstance = new Deployer();

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
  }
}



// example: node ../tools/deploy/EIP20TokenMock.js 5 DKN deepeshCoin 18 0x12A05F200 travis bt.txt
performer(process.argv);
