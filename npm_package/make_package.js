#!/usr/bin/env node

// Copyright 2019 OpenST Ltd.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @file This file runs as part of the npm packaging process.
 *
 * It reads a set number of contracts from the truffle build directory and
 * extracts ABI and BIN of each contract. The extracted information is added to
 * a new object that is finally serialized to disk. That JSON file will be
 * exported by this package.
 */

const fs = require('fs');
const path = require('path');
const { contractNames } = require('./contract_names.json');

/**
 * Retrieves the contract's metadata (abi & bin) from the provided file path.
 * @param {String} contractPath Contract's file path.
 *
 * @returns {Object} Contract's abi and bin.
 */
function retrieveContractMetaData(contractPath) {
  if (!fs.existsSync(contractPath)) {
    throw new Error(
      `Cannot read file ${contractPath}.`,
    );
  }

  const contractFile = fs.readFileSync(contractPath);
  const metaData = JSON.parse(contractFile);

  const contract = {};
  contract.abi = metaData.abi;

  if (metaData.bytecode !== '0x') {
    contract.bin = metaData.bytecode;
  }

  return contract;
}

const contracts = {
  openst: {},
  gnosis: {},
};

contractNames.openst.forEach((contract) => {
  const contractPath = path.join(
    __dirname,
    `../build/contracts/${contract}.json`,
  );

  contracts.openst[contract] = retrieveContractMetaData(contractPath);
});

contractNames.gnosis.forEach((contract) => {
  const contractPath = path.join(
    __dirname,
    `../external/gnosis/safe-contracts/build/contracts/${contract}.json`,
  );

  contracts.gnosis[contract] = retrieveContractMetaData(contractPath);
});

fs.writeFileSync(path.join(__dirname, './dist/contracts.json'), JSON.stringify(contracts));
