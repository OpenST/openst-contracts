'use strict';

/**
 * This is Script to create tables<br><br>
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
const createTables = {
  perform: async function() {
    logger.win('\nStarting Table Creation');

    const allQueries = createTables.getQueries();
    var query = null;

    for (var i in allQueries) {
      query = allQueries[i];
      logger.win('\nRunning Query');
      logger.debug(query);
      var response = await QueryDB.migrate(query);
      logger.win('\nQuery Response');
      logger.debug(response);
    }

    logger.win('\nCompleted Table Creation');
    process.exit(0);
  },

  getQueries: function() {
    const createAirdropTableQuery =
      'CREATE TABLE IF NOT EXISTS `airdrops` (\n' +
      '  `id` bigint(20) NOT NULL AUTO_INCREMENT,\n' +
      '  `contract_address` varchar(50) NOT NULL,\n' +
      '  `created_at` datetime NOT NULL,\n' +
      '  `updated_at` datetime NOT NULL,\n' +
      '  PRIMARY KEY (`id`),\n' +
      '  UNIQUE KEY `UNIQUE_CONTRACT_ADDRESS` (`contract_address`) USING BTREE\n' +
      ') ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;';

    const createUserAirdropDetailsTableQuery =
      'CREATE TABLE IF NOT EXISTS `user_airdrop_details` (\n' +
      '  `id` bigint(20) NOT NULL AUTO_INCREMENT,\n' +
      '  `user_address` varchar(50) NOT NULL,\n' +
      '  `airdrop_id` bigint(20) NOT NULL,\n' +
      "  `airdrop_amount` decimal(30,0) NOT NULL DEFAULT '0',\n" +
      "  `airdrop_used_amount` decimal(30,0) NOT NULL DEFAULT '0',\n" +
      "  `expiry_timestamp` bigint(20) NOT NULL DEFAULT '0',\n" +
      '  `created_at` datetime NOT NULL,\n' +
      '  `updated_at` datetime NOT NULL,\n' +
      '  PRIMARY KEY (`id`),\n' +
      '  INDEX (user_address, airdrop_id)\n' +
      ') ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;';

    const airdropTransferProofDetails =
      'CREATE TABLE IF NOT EXISTS `airdrop_allocation_proof_details` (\n' +
      '  `id` bigint(20) NOT NULL AUTO_INCREMENT,\n' +
      '  `transaction_hash` varchar(100) NOT NULL,\n' +
      "  `airdrop_amount` decimal(30,0) NOT NULL DEFAULT '0',\n" +
      "  `airdrop_allocated_amount` decimal(30,0) NOT NULL DEFAULT '0',\n" +
      '  `created_at` datetime NOT NULL,\n' +
      '  `updated_at` datetime NOT NULL,\n' +
      '  PRIMARY KEY (`id`),\n' +
      '  UNIQUE KEY `UNIQUE_TRANSACTION_HASH` (`transaction_hash`) USING BTREE\n' +
      ') ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;';

    return [createAirdropTableQuery, createUserAirdropDetailsTableQuery, airdropTransferProofDetails];
  }
};

module.exports = createTables;
createTables.perform();
