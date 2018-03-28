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

const readline = require('readline')
  , rootPrefix = '../..'
  , web3Provider = require(rootPrefix + '/lib/web3/providers/ws')
  , prompts = readline.createInterface(process.stdin, process.stdout)
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , Deployer = require(rootPrefix + '/services/deploy/deployer')
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , returnTypes = require(rootPrefix + "/lib/global_constant/return_types")
  , helper = require(rootPrefix + "/tools/deploy/helper")
  , SetOpsKlass = require(rootPrefix + '/services/ops_managed/set_ops')
  , GetOpsKlass = require(rootPrefix + '/services/ops_managed/get_ops')
;

// Different addresses used for deployment
const deployerName = "deployer"
  , deployerAddress = coreAddresses.getAddressForUser(deployerName)
  , deployerPassphrase = coreAddresses.getPassphraseForUser(deployerName)
;

// Set Ops Address
const opsName = "ops"
  ,  opsAddress = coreAddresses.getAddressForUser(opsName)
;


/**
 * Validation Method
 *
 * @param {Array} arguments
 *
 * @return {}
 */
function validate(argv) {
  if (!argv[2]) {
    logger.error("Mandatory Param is missing! ( brandedTokenAddress)");
    process.exit(0);
  }

  if (!argv[3]) {
    logger.error("Base currency is mandatory!");
    process.exit(0);
  }
  if (!argv[4]) {
    logger.error("Gas Price is mandatory!");
    process.exit(0);
  }
  if (!argv[5]) {
    logger.error("Chain Id is mandatory!");
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

  // logger.debug("argv[0]: " + argv[0]);
  // logger.debug("argv[1]: " + argv[1]);
  // logger.debug("argv[2]: " + argv[2]);
  // logger.debug("argv[3]: " + argv[3]);
  // logger.debug("argv[4]: " + argv[4]);
  // logger.debug("argv[5]: " + argv[5]);
  // logger.debug("argv[6]: " + argv[6]);
  // logger.debug("argv[7]: " + argv[7]);

  validate(argv);
  const brandedTokenAddress = argv[2].trim();
  const baseCurrency = argv[3].trim();
  const gasPrice = argv[4].trim();
  const chainId = argv[5].trim();
  var isTravisCIEnabled = false;
  if (argv[6] !== undefined) {
    isTravisCIEnabled = argv[6].trim() === 'travis';
  }
  const fileForContractAddress = (argv[7] !== undefined) ? argv[7].trim() : '';

  logger.debug("Branded Token Address: " + brandedTokenAddress);
  logger.debug("Base currency: " + baseCurrency);
  logger.debug("Gas price: " + gasPrice);
  logger.debug("Chain id: " + chainId);
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

  const constructorArgs = [
    brandedTokenAddress,
    web3Provider.utils.asciiToHex(baseCurrency)
  ];

  const contractName = 'pricer'
    , deployOptions = {returnType: returnTypes.transactionReceipt()};
  ;

  const deployerInstance = new Deployer({
    contract_name: contractName,
    constructor_args: constructorArgs,
    gas_price: gasPrice,
    options: deployOptions
  });
  const deployResult =  await deployerInstance.perform();

  if (deployResult.isSuccess()) {

    const contractAddress = deployResult.data.transaction_receipt.contractAddress;
    logger.win("contractAddress: " + contractAddress);
    if (fileForContractAddress !== '') {
      helper.writeContractAddressToFile(fileForContractAddress, contractAddress);
    }

    const setOpsOptions = {
      returnType: returnTypes.transactionReceipt(),
      tag: ''
    }
    logger.debug("Setting Ops Address to: " + opsAddress);
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
    logger.debug("Ops Address Set to: " + contractOpsAddress);

  } else {
    logger.error("Error deploying contract");
    logger.error(deployResult);
  }

  process.exit(0);
}

performer(process.argv);
