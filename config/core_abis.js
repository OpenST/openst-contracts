"use strict";

/*
 * Load all contract abi files
 *
 */

const fs = require('fs')
  , path = require('path')
;

function parseFile(filePath, options) {
  filePath = path.join(__dirname, '/' + filePath);
  const fileContent = fs.readFileSync(filePath, options || "utf8");
  return JSON.parse(fileContent);
}

const rootPrefix = "..";

const coreAbis = {
  pricer: parseFile(rootPrefix + '/contracts/abi/Pricer.abi', "utf8")  
};

module.exports = coreAbis;
