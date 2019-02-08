const assert = require('assert');
const contracts = require('@openstfoundation/openst-contracts');
const { contractNames } = require('../contract_names.json');

contractNames.forEach((name) => {
  assert(contracts[name].abi !== undefined);
});
