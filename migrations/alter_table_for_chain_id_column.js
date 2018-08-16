'use strict';

/**
 * This is Script is used to add chainId column in tables "airdrop_allocation_proof_details" and "airdrops"<br><br>
 *
 * Usage : node ./migrations/alter_table_for_chain_id_column.js defaultChainId
 *
 * @module migrations/alter_table_for_chain_id_column.js
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
    const args = process.argv,
      chainId = args[2];

    if (!chainId) {
      logger.error('Chain id is NOT passed in the arguments.');
      alterTables.usageDemo();
      process.exit(1);
    }

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
  },

  usageDemo: function() {
    logger.info('usage:', 'node ./migrations/alter_table_for_chain_id_column.js defaultChainId');
    logger.info('* provided chain id will be used as a default value for all the existing rows.');
  }
};

module.exports = alterTables;
alterTables.perform();
