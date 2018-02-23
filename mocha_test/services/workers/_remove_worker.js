/* global describe, it */

const chai = require('chai')
  , assert = chai.assert;

const rootPrefix      = "../../.."
    , constants       = require(rootPrefix + '/mocha_test/lib/constants')
    , utils           = require(rootPrefix+'/mocha_test/lib/utils')
    , workersModule   = require(rootPrefix + '/lib/contract_interact/workers')
    , workers         = new workersModule(constants.workerContractAddress, constants.chainId) // should be workersContractAddress
;

describe('Remove worker', function() {

  it('should pass the initial address checks', function() {

    assert.isDefined(constants.deployer);
    assert.isDefined(constants.ops);
    assert.notEqual(constants.deployer, constants.ops);

  });

  it('should fail when gasPrice is null', async function() {

    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    // set worker
    const response = await workers.removeWorker(
      constants.ops,
      constants.opsPassphrase,
      constants.workerAccount1,
      0,
      {returnType: constants.returnTypeReceipt});

    // confirm failure reponse and message
    assert.equal(response.isFailure(), true);
    assert.equal(response.err.msg, 'gas is mandatory');

  });

  it('should fail when senderAddress is not valid', async function() {

    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    // set worker
    const response = await workers.removeWorker(
      0,
      constants.opsPassphrase,
      constants.workerAccount1,
      constants.gasUsed,
      {returnType: constants.returnTypeReceipt});

    // confirm failure reponse and message
    assert.equal(response.isFailure(), true);
    assert.equal(response.err.msg, 'sender address is invalid');

  });

  it('should fail when workerAddress is not valid', async function() {

    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    // set worker
    const response = await workers.removeWorker(
      constants.ops,
      constants.opsPassphrase,
      0,
      constants.gasUsed,
      {returnType: constants.returnTypeReceipt});

    // confirm failure reponse and message
    assert.equal(response.isFailure(), true);
    assert.equal(response.err.msg, 'worker address is invalid');

  });

  it('should succeed', async function() {

    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    // set worker
    const response = await workers.removeWorker(
      constants.ops,
      constants.opsPassphrase,
      constants.workerAccount1,
      constants.gasUsed,
      {returnType: constants.returnTypeReceipt});

    // verify if the transaction receipt is valid
    utils.verifyTransactionReceipt(response);

    // verify if the transaction has was actually mined
    await utils.verifyIfMined(workers, response.data.transaction_hash);

    // confirm that worker is not a worker
    const isWorkerAfter = await workers.isWorker(constants.workerAccount1);
    assert.equal(isWorkerAfter.isSuccess(), true);
    assert.equal(isWorkerAfter.data.isValid, false);

  });

	it('should pass for interaction layer test when return type is uuid', async function() {

    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    // set worker
    const response = await workers.removeWorker(
      constants.ops,
      constants.opsPassphrase,
      constants.workerAccount1,
      constants.gasUsed,
      {returnType: constants.returnTypeUUID});

    // verify transaction UUID
    // we will not verify if it got mined as its just interaction layer testing
    utils.verifyTransactionUUID(response);

  });

  it('should pass for interaction layer test when return type is txHash', async function() {

    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    // set worker
    const response = await workers.removeWorker(
      constants.ops,
      constants.opsPassphrase,
      constants.workerAccount1,
      constants.gasUsed,
      {returnType: constants.returnTypeHash});

    // verify transaction hash
    utils.verifyTransactionHash(response);

  });

  it('should pass for interaction layer test when return type is txReceipt', async function() {

    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    // set worker
    const response = await workers.removeWorker(
      constants.ops,
      constants.opsPassphrase,
      constants.workerAccount1,
      constants.gasUsed,
      {returnType: constants.returnTypeReceipt});

    // verify transaction receipt
    utils.verifyTransactionReceipt(response);

	});

});
