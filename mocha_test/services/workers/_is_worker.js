/* global describe, it */

const chai = require('chai'),
  assert = chai.assert;

const rootPrefix = '../../..',
  constants = require(rootPrefix + '/mocha_test/lib/constants'),
  openstPayment = require(rootPrefix + '/index'),
  IsWorkerKlass = openstPayment.services.workers.isWorker,
  apiErrorConfig = require(rootPrefix + '/config/api_error_config');

describe('Is worker', function() {
  // Success mode is tested in `set_worker.js`

  it('should fail when worker address is not valid', async function() {
    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    const IsWorkerObject = new IsWorkerKlass({
      workers_contract_address: constants.workersContractAddress,
      worker_address: 0,
      chain_id: constants.chainId
    });
    const response = await IsWorkerObject.perform();

    // confirm failure reponse and message
    assert.equal(response.isFailure(), true);
    assert.equal(response.toHash().err.msg, apiErrorConfig['invalid_api_params'].message);
  });
});
