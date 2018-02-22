"use strict";

/**
 * This is Script to create tables<br><br>
 *
 * @module migrations/create_tables
 */

var rootPrefix = '..'
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , QueryDBKlass = require(rootPrefix + '/app/models/queryDb')
  , QueryDB = new QueryDBKlass(coreConstants.MYSQL_DATABASE)
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
;

/**
 * Create payments table
 *
 * @exports migrations/create_tables
 */
const createTables = {

  perform: async function() {
    logger.win("\nStarting Table Creation");

    const allQueries = createTables.getQueries();
    var query = null
    ;

    for(var i in allQueries){
      query = allQueries[i];
      logger.win("\nRunning Query");
      logger.info(query);
      var response = await QueryDB.executeQuery(query);
      logger.win("\nQuery Response");
      logger.info(response);
    }

    logger.win("\nCompleted Table Creation");
    process.exit(0);

  },

  getQueries: function() {
    // Create Tables
    const createAirdropTableQuery =  'CREATE TABLE `airdrops` (\n' +
      '  `id` bigint(20) NOT NULL AUTO_INCREMENT,\n' +
      '  `contract_address` varchar(50) NOT NULL,\n' +
      '  `created_at` datetime NOT NULL,\n' +
      '  PRIMARY KEY (`id`),\n' +
      '  UNIQUE KEY `UNIQUE_CONTRACT_ADDRESS` (`contract_address`) USING BTREE\n'+
      ') ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;';

    const createUserAirdropDetailsTableQuery = 'CREATE TABLE `user_airdrop_details` (\n' +
      '  `id` bigint(20) NOT NULL AUTO_INCREMENT,\n' +
      '  `user_address` varchar(50) NOT NULL,\n' +
      '  `airdrop_id` bigint(20) NOT NULL,\n' +
      '  `total_airdrop` decimal(30,0) NOT NULL DEFAULT \'0\',\n' +
      '  `airdrop_used` decimal(30,0) NOT NULL DEFAULT \'0\',\n' +
      '  `created_at` datetime NOT NULL,\n' +
      '  PRIMARY KEY (`id`),\n' +
      '  INDEX (user_address, airdrop_id)\n' +
      ') ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;';

    const airdropTransferProofDetails = 'CREATE TABLE `airdrop_allocation_proof_details` (\n' +
      '  `id` bigint(20) NOT NULL AUTO_INCREMENT,\n' +
      '  `transaction_hash` varchar(100) NOT NULL,\n' +
      '  `airdrop_amount` decimal(30,0) NOT NULL DEFAULT \'0\',\n' +
      '  `airdrop_allocated_amount` decimal(30,0) NOT NULL DEFAULT \'0\',\n' +
      '  `created_at` datetime NOT NULL,\n' +
      '  `updated_at` datetime NOT NULL,\n' +
      '  PRIMARY KEY (`id`),\n' +
      '  UNIQUE KEY `UNIQUE_TRANSACTION_HASH` (`transaction_hash`) USING BTREE\n'+
      ') ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;';

    return [createAirdropTableQuery, createUserAirdropDetailsTableQuery, airdropTransferProofDetails];
  }

};

module.exports = createTables;
createTables.perform();
