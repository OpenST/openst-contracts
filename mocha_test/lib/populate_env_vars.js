"use strict";

/*
 * Helper
 *
 * * Author: Deepesh
 * * Date: 29/01/2018
 * * Reviewed by:
 */

const mustache = require('mustache')
  , fs = require('fs')
  , Path = require('path')
  , envVarsSourceFile = '../../mocha_test/scripts/env_vars.sh';


const addressTemplate = "export OST_UTILITY_DEPLOYER_ADDR='{{ost_utility_deployer_address}}'\n" +
  "export OST_UTILITY_OPS_ADDR='{{ost_utility_ops_address}}'\n" +
  "export OST_UTILITY_TEST_ACCOUNT1='{{ost_utility_test_account_1}}'\n" +
  "export OST_UTILITY_TEST_ACCOUNT1_PASSPHRASE='testtest'\n" +
  "export OST_UTILITY_TEST_ACCOUNT2='{{ost_utility_test_account_2}}'\n" +
  "export OST_UTILITY_TEST_ACCOUNT2_PASSPHRASE='testtest'\n" +
  "export OST_UTILITY_TEST_ACCOUNT3='{{ost_utility_test_account_3}}'\n" +
  "export OST_UTILITY_TEST_ACCOUNT3_PASSPHRASE='testtest'\n" +
  "export OST_UTILITY_TEST_ACCOUNT4='{{ost_utility_test_account_4}}'\n" +
  "export OST_UTILITY_TEST_ACCOUNT4_PASSPHRASE='testtest'\n" +
  "export OST_UTILITY_TEST_ACCOUNT5='{{ost_utility_test_account_5}}'\n" +
  "export OST_UTILITY_TEST_ACCOUNT5_PASSPHRASE='testtest'\n" +
  "export OST_AIRDROP_BUDGET_HOLDER='{{ost_airdrop_budget_holder}}'\n" +
  "export OST_AIRDROP_BUDGET_HOLDER_PASSPHRASE='testtest'\n" +
  "export OST_WORKER_TEST_ACCOUNT1='{{ost_worker_test_account_1}}'\n" +
  "export OST_WORKER_TEST_ACCOUNT1_PASSPHRASE='testtest'\n"
;

const populateEnvVars = {

  renderAndPopulate: function (type, vars) {
    var renderData = '';
    try {
      if (type === 'address') {
        renderData = mustache.to_html(addressTemplate, vars);
      }
      else {
        console.error(" Invalid Template Type To render");
        process.exit(1);
      }
      var existingSourceFileData = fs.readFileSync(Path.join(__dirname, '/' + envVarsSourceFile));
      var dataToWrite = existingSourceFileData.toString() + "\n\n" + renderData;
      //logger.debug("ENV Constants to Write");
      //logger.debug(dataToWrite);
      fs.writeFileSync(Path.join(__dirname, '/' + envVarsSourceFile), dataToWrite);
    } catch (e) {
      console.error("Error Reading and Populating Source File");
      console.error(e);
      process.exit(1);
    }

  }

};

module.exports = populateEnvVars;
