"use strict";

/*
 * Load all contract bin files
 *
 */

const fs = require('fs')
  , path = require('path')
;

function readFile(filePath, options) {
  filePath = path.join(__dirname, '/' + filePath);
  return fs.readFileSync(filePath, options || "utf8");
}

const rootPrefix = "..";

const coreBins = {
  pricer: readFile(rootPrefix + '/contracts/bin/Pricer.bin', 'utf8')  
};

module.exports = coreBins;
