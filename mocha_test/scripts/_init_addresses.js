const fs = require('fs');
const Path = require('path');

const _addresses = {
  "deployerAdd": null,
  "opsAdd": null,
  "account1": null,
  "account2": null,
  "account3": null,
  "account4": null,
  "airdropBudgetHolder": null
};

const rootPrefix = "../.."
  , coreConstants = require( rootPrefix + '/config/core_constants' )
  , populateEnvVars = require( rootPrefix + "/mocha_test/lib/populate_env_vars.js")
  , poaGenesis = require( rootPrefix + "/mocha_test/scripts/poa-genesis.json")
;

function main( addressFile ) {
  const _path = Path.join(__dirname, addressFile );
  const fileContent = fs.readFileSync( _path, "utf8");
  fileContent.toString().split('\n').forEach(function (line, index) {

    var thisAddress = line.replace("Address: {", "0x").replace("}","").trim();
    if ( thisAddress.length < 40 ) {
      return;
    }

    if ( !_addresses.deployerAdd ) {
      //First Address
      _addresses.deployerAdd = thisAddress;
      fundAddress(thisAddress);
    } else if ( !_addresses.opsAdd ) {
      _addresses.opsAdd = thisAddress;
      fundAddress(thisAddress);
    } else if ( !_addresses.account1 ) {
      _addresses.account1 = thisAddress;
      fundAddress(thisAddress);
    } else if ( !_addresses.account2 ) {
      _addresses.account2 = thisAddress;
      fundAddress(thisAddress);
    } else if ( !_addresses.account3 ) {
      _addresses.account3 = thisAddress;
      fundAddress(thisAddress);
    } else if ( !_addresses.account4 ) {
      _addresses.account4 = thisAddress;
      fundAddress(thisAddress);
    } else if ( !_addresses.airdropBudgetHolder ) {
      _addresses.airdropBudgetHolder = thisAddress;
      fundAddress(thisAddress);
    } else if ( !_addresses.workerAccount1 ) {
      _addresses.workerAccount1 = thisAddress;
      fundAddress(thisAddress);
    }
  });

  populateEnvVars.renderAndPopulate('address', {
    ost_pricer_deployer_address: _addresses.deployerAdd,
    ost_pricer_ops_address: _addresses.opsAdd,
    ost_pricer_test_account_1: _addresses.account1,
    ost_pricer_test_account_2: _addresses.account2,
    ost_pricer_test_account_3: _addresses.account3,
    ost_pricer_test_account_4: _addresses.account4,
    ost_airdrop_budget_holder: _addresses.airdropBudgetHolder,
    ost_worker_test_account_1: _addresses.workerAccount1
   }
  );
}

function fundAddress( address ) {

  //Update poa-genesis-value
  updateGenesisAlloc( poaGenesis, address, "0x200000000000000000000000000000000000000000000000000000000000000");
  writeJsonToFile(poaGenesis, "./poa-genesis.json");

}
function updateGenesisAlloc( genesis, foundation, value ) {
  const _alloc = genesis.alloc;
  _alloc[ foundation ] = { "balance" : value };
  //Remove the place holder if it exists.
  _alloc[ "" ] && (delete _alloc[ "" ] );
}

function writeJsonToFile( jsObject, relativeFilePath, tab_space ) {
  tab_space = tab_space || 2;
  var json = JSON.stringify(jsObject, null, tab_space);

  var jsonFilePath = relativeFilePath;
  if ( !Path.isAbsolute( jsonFilePath ) ) {
    jsonFilePath = Path.join(__dirname, '/' + relativeFilePath );
  }

  console.log("writeJsonToFile :: jsonFilePath :: ", jsonFilePath);

  fs.writeFileSync(jsonFilePath, json );
}


main( process.argv[2] );
