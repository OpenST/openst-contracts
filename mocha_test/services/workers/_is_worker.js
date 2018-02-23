/* global describe, it */

const chai = require('chai')
  , assert = chai.assert;

const rootPrefix      = "../../.."
    , constants       = require(rootPrefix + '/mocha_test/lib/constants')
    , workersModule   = require(rootPrefix + '/lib/contract_interact/workers')
    , workers         = new workersModule(constants.workersContractAddress, constants.chainId) // should be workersContractAddress
;

describe('Is worker', function() {
	// Success mode is tested in `set_worker.js`

  it('should fail when worker address is not valid', async function() {

    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    // set worker
    const response = await workers.isWorker(0);

    // confirm failure reponse and message
    assert.equal(response.isFailure(), true);
    assert.equal(response.err.msg, 'worker address is invalid');

  });
});
