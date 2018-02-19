"use strict";

/*
 * Load all contract abi files
 *
 */

const fs = require('fs'),
  path = require('path');

function parseFile(filePath, options) {
  const absFilePath = path.join(__dirname, '/' + filePath);
  const fileContent = fs.readFileSync(absFilePath, options || "utf8");
  return JSON.parse(fileContent);
}

const rootPrefix = "..";

const coreAbis = {
  pricer: parseFile(rootPrefix + '/contracts/abi/Pricer.abi', "utf8"),
  eip20tokenmock: parseFile(rootPrefix + '/contracts/abi/EIP20TokenMock.abi', "utf8"),
  opsManaged: parseFile(rootPrefix + '/contracts/abi/OpsManaged.abi', "utf8"),
  workers: parseFile(rootPrefix + '/contracts/abi/Workers.abi', "utf8"),
  airdrop: parseFile(rootPrefix + '/contracts/abi/Airdrop.abi', "utf8")
};

module.exports = coreAbis;
