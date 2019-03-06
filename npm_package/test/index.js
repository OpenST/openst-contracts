const assert = require('assert');
const contracts = require('@openstfoundation/openst-contracts');
const { contractNames } = require('../contract_names.json');

contractNames.openst.forEach((name) => {
  assert(contracts.openst[name].abi !== undefined);
});

contractNames.gnosis.forEach((name) => {
  assert(contracts.gnosis[name].abi !== undefined);
});
