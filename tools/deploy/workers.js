"use strict";

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

const readline = require('readline')
  , rootPrefix = '../..'
  , prompts = readline.createInterface(process.stdin, process.stdout)
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , Deployer = require(rootPrefix + '/services/deployer')
  , helper = require(rootPrefix + "/tools/deploy/helper")
  , SetWorkerAndOpsKlass = require(rootPrefix + '/lib/set_worker_and_ops')
  , setWorkerOps = new SetWorkerAndOpsKlass()
;

/**
 * It is the main performer method of this deployment script
 *
 * Example:
 * node tools/deploy/worker.js gasPrice chainId <travis> <fileToWrite>
 *
 * @return {}
 */
async function performer(argv) {

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

  var response = await setWorkerOps.perform({gasPrice: gasPrice, chainId: chainId});
  logger.debug("**** Deployment Response", response);
  if (response.isSuccess() && fileForContractAddress !== '') {
    helper.writeContractAddressToFile(fileForContractAddress, response.data.workerContractAddress);
  }

  process.exit(0);

}

// node tools/deploy/workers.js gasPrice chainId <travis> <fileToWrite>
performer(process.argv);
