const fs = require('fs');
const Path = require('path');

const _addresses = {
  "deployerAdd": null,
  "opsAdd": null
};

const rootPrefix = ".."
  , coreConstants   = require( rootPrefix + '/config/core_constants' )
  , populateEnvVars = require( rootPrefix + "/test/populate_env_vars.js")
  , poaGenesis = require( rootPrefix + "/test/poa-genesis.json")
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
    }
  });

  populateEnvVars.renderAndPopulate('address', {
    ost_pricer_deployer_address: _addresses.deployerAdd,
    ost_pricer_ops_address: _addresses.opsAdd
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
