'use strict';

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

const openSTStorage = require('@openstfoundation/openst-storage');

const readline = require('readline'),
  rootPrefix = '../..',
  prompts = readline.createInterface(process.stdin, process.stdout),
  logger = require(rootPrefix + '/helpers/custom_console_logger'),
  Deployer = require(rootPrefix + '/services/deploy/deployer'),
  BigNumber = require('bignumber.js'),
  helper = require(rootPrefix + '/tools/deploy/helper'),
  gasLimitGlobalConstant = require(rootPrefix + '/lib/global_constant/gas_limit'),
  dynamodbConnectionParams = require(rootPrefix + '/config/dynamoDB'),
  ddbServiceObj = new openSTStorage.Dynamodb(dynamodbConnectionParams),
  autoScalingServiceObj = require(rootPrefix + '/lib/auto_scaling_service');

/**
 * It is the main performer method of this deployment script
 *
 * @param {Array} arguments
 *
 * @return {}
 */

async function performer(argv) {
  if (argv.length < 7) {
    logger.error('Invalid arguments !!!');
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
  const fileForContractAddress = argv[8] !== undefined ? argv[8].trim() : '';

  const conversionDecimals = 5;
  const conversionRate = new BigNumber(String(conversionFactor)).mul(new BigNumber(10).toPower(conversionDecimals));
  if (!conversionRate.modulo(1).equals(0)) {
    logger.error('Exiting deployment scripts. Invalid conversion factor');
    process.exit(1);
  }

  logger.debug('conversionFactor: ' + conversionFactor);
  logger.debug('conversionRate: ' + conversionRate);
  logger.debug('conversionDecimals: ' + conversionDecimals);
  logger.debug('symbol: ' + symbol);
  logger.debug('name: ' + name);
  logger.debug('decimals: ' + decimals);
  logger.debug('gasPrice: ' + gasPrice);
  logger.debug('Travis CI enabled Status: ' + isTravisCIEnabled);

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

  const contractName = 'eip20tokenmock',
    options = { returnType: 'txReceipt' };

  var constructorArgs = [conversionRate, conversionDecimals, symbol, name, decimals];

  const deployerInstance = new Deployer({
    contract_name: contractName,
    constructor_args: constructorArgs,
    gas_price: gasPrice,
    gas_limit: gasLimitGlobalConstant.default(),
    options: options
  });

  const deployResult = await deployerInstance.perform();

  if (deployResult.isSuccess()) {
    const contractAddress = deployResult.data.transaction_receipt.contractAddress;
    logger.win('contractAddress: ' + contractAddress);

    logger.debug('*** Allocating shard for Token balance');

    await new openSTStorage.TokenBalanceModel({
      ddb_service: ddbServiceObj,
      auto_scaling: autoScalingServiceObj,
      erc20_contract_address: contractAddress
    }).allocate();

    if (fileForContractAddress !== '') {
      await helper.writeContractAddressToFile(fileForContractAddress, contractAddress);
    }
  }
  process.exit(0);
}

// example: node ../tools/deploy/EIP20TokenMock.js 5 DKN deepeshCoin 18 0x12A05F200 travis bt.txt
performer(process.argv);
