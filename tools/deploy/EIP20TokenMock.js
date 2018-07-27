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

const readline = require('readline')
  , BigNumber = require('bignumber.js')
;

const rootPrefix = '../..',
  prompts = readline.createInterface(process.stdin, process.stdout),
  logger = require(rootPrefix + '/helpers/custom_console_logger'),
  gasLimitGlobalConstant = require(rootPrefix + '/lib/global_constant/gas_limit'),
  InstanceComposer = require(rootPrefix + '/instance_composer')
;

require(rootPrefix + '/services/deploy/deployer');
require(rootPrefix + '/tools/deploy/helper');
require(rootPrefix + '/lib/providers/storage');

/**
 * It is the main performer method of this deployment script
 *
 * @param {Array} arguments
 *
 * @return {}
 */

async function performer(argv) {

  if (argv.length < 8) {
    logger.error('Invalid arguments !!!');
    process.exit(0);
  }

  //argv[2] => uint256 conversionFactor;
  //argv[3] => string symbol;
  //argv[4] => string name;
  //argv[5] => uint8 decimals;
  //argv[6] => hex gasPrice;
  //argv[7] => file path from which config strategy needs to be loaded;
  //argv[8] => string travis;
  //argv[9] => string File name where contract address needs to write;
  const conversionFactor = argv[2].trim();
  const symbol = argv[3].trim();
  const name = argv[4].trim();
  const decimals = argv[5].trim();
  const gasPrice = argv[6].trim();

  const fileForConfigStrategy = argv[7] !== undefined ? argv[7].trim() : '';
  if (!fileForConfigStrategy) {
    logger.error('Exiting deployment scripts. Invalid fileForConfigStrategy', fileForConfigStrategy);
    process.exit(1);
  }

  var isTravisCIEnabled = false;
  if (argv[8] !== undefined) {
    isTravisCIEnabled = argv[8].trim() === 'travis';
  }
  const fileForContractAddress = argv[9] !== undefined ? argv[9].trim() : '';

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

  const contractName = 'eip20tokenmock',
    options = { returnType: 'txReceipt' };

  let constructorArgs = [conversionRate, conversionDecimals, symbol, name, decimals];

  const configStrategy = require(fileForConfigStrategy)
    , instanceComposer = new InstanceComposer(configStrategy)
    , Deployer = instanceComposer.getDeployerClass()
    , deployHelper = instanceComposer.getDeployHelper()
    , storageProvider = instanceComposer.getStorageProvider()
    , openSTStorage = storageProvider.getInstance()
  ;

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

    await new openSTStorage.model.TokenBalance({
      erc20_contract_address: contractAddress
    }).allocate();

    if (fileForContractAddress !== '') {
      await deployHelper.writeContractAddressToFile(fileForContractAddress, contractAddress);
    }

  }

  process.exit(0);

}

// example: node ../tools/deploy/EIP20TokenMock.js 5 DKN deepeshCoin 18 0x12A05F200 config_strategy.js travis bt.txt
performer(process.argv);
