"use strict";

/*
 * Load all contract bin files
 *
 */

const fs = require('fs'),
  path = require('path');

function readFile(filePath, options) {
  const absFilePath = path.join(__dirname, '/' + filePath);
  return fs.readFileSync(absFilePath, options || "utf8");
}

const rootPrefix = "..";

const coreBins = {
  pricer: readFile(rootPrefix + '/contracts/bin/Pricer.bin', 'utf8'),
  eip20tokenmock: readFile(rootPrefix + '/contracts/bin/EIP20TokenMock.bin', 'utf8')
};

module.exports = coreBins;
