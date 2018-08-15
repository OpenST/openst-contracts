'use strict';

/**
 * This is Script to alter tables "airdrop_allocation_proof_details" and "airdrops"<br><br>
 *
 * @module migrations/create_tables
 */

var rootPrefix = '..',
  InstanceComposer = require(rootPrefix + '/instance_composer'),
  configStrategy = require(rootPrefix + '/mocha_test/scripts/config_strategy'),
  logger = require(rootPrefix + '/helpers/custom_console_logger');

require(rootPrefix + '/config/core_constants');
require(rootPrefix + '/app/models/queryDb');

const instanceComposer = new InstanceComposer(configStrategy),
  coreConstants = instanceComposer.getCoreConstants(),
  QueryDBKlass = instanceComposer.getQueryDBKlass(),
  QueryDB = new QueryDBKlass(coreConstants.MYSQL_DATABASE);

/**
 * Create payments table
 *
 * @exports migrations/create_tables
 */
const alterTables = {
  perform: async function() {
    logger.win('\nStarting Alter Table ');

    const allQueries = alterTables.getQueries();
    let query = null;

    for (let i in allQueries) {
      query = allQueries[i];
      logger.win('\nRunning Query');
      logger.debug(query);
      let response = await QueryDB.migrate(query);
      logger.win('\nQuery Response');
      logger.debug(response);
    }

    process.exit(0);
  },

  getQueries: function() {
    const chainId = coreConstants.CHAIN_ID;

    if (chainId != undefined) {
      const alterAirdropAllocationProofDetailsTable =
        'ALTER TABLE `airdrop_allocation_proof_details` \n' +
        '   ADD `chain_id` bigint(20) NOT NULL \n' +
        '   DEFAULT ' +
        chainId +
        ' \n' +
        '   AFTER `id` ;';

      const alterAirdropAllocationProofUniqueIndex =
        'ALTER TABLE `airdrop_allocation_proof_details` \n' +
        '   DROP INDEX `UNIQUE_TRANSACTION_HASH` ,\n' +
        '   ADD UNIQUE KEY  `UNIQUE_TXN_HASH_CHAINID` (`transaction_hash` , `chain_id` ); ';

      const alterAirdropTable =
        'ALTER TABLE `airdrops` \n' +
        '   ADD `chain_id` bigint(20) NOT NULL \n' +
        '   DEFAULT ' +
        chainId +
        ' \n' +
        '   AFTER `id` ; ';

      const alterAirdropUniqueIndex =
        'ALTER TABLE `airdrops` \n' +
        '   DROP INDEX `UNIQUE_CONTRACT_ADDRESS` ,\n' +
        '   ADD UNIQUE KEY  `UNIQUE_CONTRACT_ADDR_CHAINID` (`contract_address` , `chain_id` ); ';

      return [
        alterAirdropAllocationProofDetailsTable,
        alterAirdropAllocationProofUniqueIndex,
        alterAirdropTable,
        alterAirdropUniqueIndex
      ];
    } else {
      logger.error('Chain id is undefined. Check environment variable OST_UTILITY_CHAIN_ID');
      return [];
    }
  }
};

module.exports = alterTables;
alterTables.perform();
