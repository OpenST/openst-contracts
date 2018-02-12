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


const addressTemplate = "export OST_PRICER_DEPLOYER_ADDR='{{ost_pricer_deployer_address}}'\n" +
  "export OST_PRICER_OPS_ADDR='{{ost_pricer_ops_address}}'\n" +
  "export OST_PRICER_PO_TEST_ACCOUNT1='{{ost_pricer_test_account_1}}'\n" +
  "export OST_PRICER_PO_TEST_ACCOUNT1_PASSPHRASE='testtest'\n" +
  "export OST_PRICER_PO_TEST_ACCOUNT2='{{ost_pricer_test_account_2}}'\n" +
  "export OST_PRICER_PO_TEST_ACCOUNT2_PASSPHRASE='testtest'\n" +
  "export OST_PRICER_PO_TEST_ACCOUNT3='{{ost_pricer_test_account_3}}'\n" +
  "export OST_PRICER_PO_TEST_ACCOUNT3_PASSPHRASE='testtest'\n" +
  "export OST_PRICER_PO_TEST_ACCOUNT4='{{ost_pricer_test_account_4}}'\n" +
  "export OST_PRICER_PO_TEST_ACCOUNT4_PASSPHRASE='testtest'\n";

const contractPricer = "export OST_PRICER_CONTRACT_ADDR='{{ost_pricer_contract_address}}'\n";
const contractBT = "export OST_PRICER_BT_CONTRACT_ADDR='{{ost_pricer_bt_contract_address}}'\n";
const contractPO = "export OST_PRICER_PO_CONTRACT_ADDR='{{ost_pricer_po_contract_address}}'\n";


const populateEnvVars = {

  renderAndPopulate: function (type, vars) {
    var renderData = '';
    try {
      if (type === 'address') {
        renderData = mustache.to_html(addressTemplate, vars);
      }
      else if (type === 'contractPricer') {
        renderData = mustache.to_html(contractPricer, vars);
      } else if (type === 'contractBT') {
        renderData = mustache.to_html(contractBT, vars);
      } else if (type === 'contractPO') {
        renderData = mustache.to_html(contractPO, vars);
      } else {
        console.error(" Invalid Template Type To render");
        process.exit(1);
      }
      var existingSourceFileData = fs.readFileSync(Path.join(__dirname, '/' + envVarsSourceFile));
      var dataToWrite = existingSourceFileData.toString() + "\n\n" + renderData;
      //console.log("ENV Constants to Write");
      //console.log(dataToWrite);
      fs.writeFileSync(Path.join(__dirname, '/' + envVarsSourceFile), dataToWrite);
    } catch (e) {
      console.error("Error Reading and Populating Source File");
      console.error(e);
      process.exit(1);
    }

  }

};

module.exports = populateEnvVars;
