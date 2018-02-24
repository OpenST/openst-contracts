/**
 * This is script for deploying Workers contract on any chain.<br><br>
 *
 *   Prerequisite:
 *    <ol>
 *       <li>Deployer Address</li>
 *     </ol>
 *
 *   These are the following steps:<br>
 *     <ol>
 *       <li>Deploy Workers contract</li>
 *     </ol>
 *
 *
 * @module tools/deploy/workers
 */

const readline = require('readline');
const rootPrefix = '../..';
const coreAddresses = require(rootPrefix + '/config/core_addresses');
const prompts = readline.createInterface(process.stdin, process.stdout);
const logger = require(rootPrefix + '/helpers/custom_console_logger');
const OpsManagedContract = require(rootPrefix + "/lib/contract_interact/ops_managed_contract");
const Deployer = require(rootPrefix + '/lib/deployer');
const returnTypes = require(rootPrefix + "/lib/global_constant/return_types");

// Different addresses used for deployment
const deployerName = "deployer"
  , deployerAddress = coreAddresses.getAddressForUser(deployerName)
  , deployerPassphrase = coreAddresses.getPassphraseForUser(deployerName)
;

// Set Ops Address
const opsName = "ops"
  , opsAddress = coreAddresses.getAddressForUser(opsName)
;


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

  if (!argv[2]) {
    logger.error("Gas Price is mandatory!");
    process.exit(0);
  }
  if (!argv[3]) {
    logger.error("chainId is mandatory!");
    process.exit(0);
  }

  const gasPrice = argv[2].trim()
    , chainId = argv[3].trim()
  ;
  var isTravisCIEnabled = false;
  if (argv[4] !== undefined) {
    isTravisCIEnabled = argv[4].trim() === 'travis';
  }

  const fileForContractAddress = (argv[5] !== undefined) ? argv[5].trim() : '';

  logger.info("Gas price: " + gasPrice);
  logger.info("chainId: " + chainId);
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

  const contractName = 'workers'
    , constructorArgs = []
    , deployerInstance = new Deployer()
    , deployOptions = {returnType: returnTypes.transactionReceipt()}
  ;

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

    logger.info("Setting Ops Address to: " + opsAddress);
    const setOpsOptions = {
        returnType: returnTypes.transactionReceipt(),
        tag: 'workersDeployment'
      }
      , opsManaged = new OpsManagedContract(contractAddress, gasPrice, chainId)
    ;
    var result = await opsManaged.setOpsAddress(deployerAddress,
      deployerPassphrase,
      opsAddress,
      setOpsOptions);
    logger.info(result);
    var contractOpsAddress = await opsManaged.getOpsAddress();
    logger.info("Ops Address Set to: " + contractOpsAddress);
  } else{
    logger.error("Error deploying contract");
    logger.error(deployResult);
  }

}

// node tools/deploy/worker.js gasPrice chainId <travis> <fileToWrite>
performer(process.argv);
