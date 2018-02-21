/* global describe, it */

const chai = require('chai')
  , assert = chai.assert;

const rootPrefix      = "../../.."
    , constants       = require(rootPrefix + '/mocha_test/lib/constants')
    , BigNumber       = require('bignumber.js')
    , utils           = require(rootPrefix+'/mocha_test/lib/utils')
    , workersModule   = require(rootPrefix + '/lib/contract_interact/workers')
    , workers         = new workersModule(constants.workerContractAddress, constants.chainId) // should be workersContractAddress
    , web3RpcProvider = require(rootPrefix + '/lib/web3/providers/rpc')
;

describe('Set worker', function() {

  it('should pass the initial address checks', () => {

    assert.isDefined(constants.deployer);
    assert.isDefined(constants.ops);
    assert.isDefined(constants.account1);
    assert.notEqual(constants.deployer, constants.ops);
    assert.notEqual(constants.deployer, constants.account1);
    assert.notEqual(constants.ops, constants.account1);

  });

	it('should pass interaction layer test when return type is uuid', async () => {

    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    const currentBlockNumber = await web3RpcProvider.eth.getBlockNumber()
        , deactivationHeight = new BigNumber(currentBlockNumber).plus(10000)
    ;

    // set worker
    const response = await workers.setWorker(
      constants.ops,
      constants.opsPassphrase,
      constants.workerAccount1,
      deactivationHeight.toNumber(),
      constants.gasUsed,
      {returnType: constants.returnTypeUUID});

    // verify transaction UUID
    // we will not verify if it got mined as its just interaction layer testing
    utils.verifyTransactionUUID(response);

  });

  it('should pass interaction layer test when return type is txHash', async () => {

    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    const currentBlockNumber = await web3RpcProvider.eth.getBlockNumber()
        , deactivationHeight = new BigNumber(currentBlockNumber).plus(10000)
    ;

    // set worker
    const response = await workers.setWorker(
      constants.ops,
      constants.opsPassphrase,
      constants.workerAccount1,
      deactivationHeight.toNumber(),
      constants.gasUsed,
      {returnType: constants.returnTypeHash});

    // verify transaction hash
    utils.verifyTransactionHash(response);

  });

  it('should pass interaction layer test when return type is txReceipt', async () => {

    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    const currentBlockNumber = await web3RpcProvider.eth.getBlockNumber()
        , deactivationHeight = new BigNumber(currentBlockNumber).plus(10000)
    ;

    // set worker
    const response = await workers.setWorker(
      constants.ops,
      constants.opsPassphrase,
      constants.workerAccount1,
      deactivationHeight.toNumber(),
      constants.gasUsed,
      {returnType: constants.returnTypeReceipt});

    // verify transaction receipt
    utils.verifyTransactionReceipt(response);

	});

  it('should fail when gasPrice is null', async () => {

    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    const currentBlockNumber = await web3RpcProvider.eth.getBlockNumber()
        , deactivationHeight = new BigNumber(currentBlockNumber).plus(10000)
    ;

    // set worker
    const response = await workers.setWorker(
      constants.ops,
      constants.opsPassphrase,
      constants.workerAccount1,
      deactivationHeight.toNumber(),
      0,
      {returnType: constants.returnTypeReceipt});

    // confirm failure reponse and message
    assert.equal(response.isFailure(), true);
    assert.equal(response.err.msg, 'gas is mandatory');

  });

  it('should fail when senderAddress is not valid', async () => {

    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    const currentBlockNumber = await web3RpcProvider.eth.getBlockNumber()
        , deactivationHeight = new BigNumber(currentBlockNumber).plus(10000)
    ;

    // set worker
    const response = await workers.setWorker(
      0,
      constants.opsPassphrase,
      constants.workerAccount1,
      deactivationHeight.toNumber(),
      constants.gasUsed,
      {returnType: constants.returnTypeReceipt});

    // confirm failure reponse and message
    assert.equal(response.isFailure(), true);
    assert.equal(response.err.msg, 'sender address is invalid');

  });

  it('should fail when workerAddress is not valid', async () => {

    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    const currentBlockNumber = await web3RpcProvider.eth.getBlockNumber()
        , deactivationHeight = new BigNumber(currentBlockNumber).plus(10000)
    ;

    // set worker
    const response = await workers.setWorker(
      constants.ops,
      constants.opsPassphrase,
      0,
      deactivationHeight.toNumber(),
      constants.gasUsed,
      {returnType: constants.returnTypeReceipt});

    // confirm failure reponse and message
    assert.equal(response.isFailure(), true);
    assert.equal(response.err.msg, 'worker address is invalid');

  });

  it('should fail when deactivationHeight is 0', async () => {

    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    const currentBlockNumber = await web3RpcProvider.eth.getBlockNumber()
        , deactivationHeight = new BigNumber(currentBlockNumber).plus(10000)
    ;

    // set worker
    const response = await workers.setWorker(
      constants.ops,
      constants.opsPassphrase,
      constants.workerAccount1,
      0,
      constants.gasUsed,
      {returnType: constants.returnTypeReceipt});

    // confirm failure reponse and message
    assert.equal(response.isFailure(), true);
    assert.equal(response.err.msg, 'deactivation height is mandatory');

  });

  it('should fail when deactivationHeight is not a number', async () => {

    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    const currentBlockNumber = await web3RpcProvider.eth.getBlockNumber()
        , deactivationHeight = new BigNumber(currentBlockNumber).plus(10000)
    ;

    // set worker
    const response = await workers.setWorker(
      constants.ops,
      constants.opsPassphrase,
      constants.workerAccount1,
      '0',
      constants.gasUsed,
      {returnType: constants.returnTypeReceipt});

    // confirm failure reponse and message
    assert.equal(response.isFailure(), true);
    assert.equal(response.err.msg, 'deactivation height value is invalid');

  });

  it('should fail when deactivationHeight is less than 0', async () => {

    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    const currentBlockNumber = await web3RpcProvider.eth.getBlockNumber()
        , deactivationHeight = new BigNumber(currentBlockNumber).plus(10000)
    ;

    // set worker
    const response = await workers.setWorker(
      constants.ops,
      constants.opsPassphrase,
      constants.workerAccount1,
      -1,
      constants.gasUsed,
      {returnType: constants.returnTypeReceipt});

    // confirm failure reponse and message
    assert.equal(response.isFailure(), true);
    assert.equal(response.err.msg, 'deactivation height value is invalid');

  });

  it('should fail when deactivationHeight is not an integer', async () => {

    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    const currentBlockNumber = await web3RpcProvider.eth.getBlockNumber()
        , deactivationHeight = new BigNumber(currentBlockNumber).plus(10000)
    ;

    // set worker
    const response = await workers.setWorker(
      constants.ops,
      constants.opsPassphrase,
      constants.workerAccount1,
      0.1,
      constants.gasUsed,
      {returnType: constants.returnTypeReceipt});

    // confirm failure reponse and message
    assert.equal(response.isFailure(), true);
    assert.equal(response.err.msg, 'deactivation height value is invalid');

  });

  it('should succeed', async () => {
    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    const currentBlockNumber = await web3RpcProvider.eth.getBlockNumber()
        , deactivationHeight = new BigNumber(currentBlockNumber).plus(10000)
    ;

    // confirm that worker is not a worker
    const isWorkerBefore = await workers.isWorker(constants.workerAccount1);
    assert.equal(isWorkerBefore.isSuccess(), true);
    assert.equal(isWorkerBefore.data.isValid, false);

    // set worker
    const response = await workers.setWorker(
      constants.ops,
      constants.opsPassphrase,
      constants.workerAccount1,
      deactivationHeight.toNumber(),
      constants.gasUsed,
      {returnType: constants.returnTypeReceipt});

    // verify if the transaction receipt is valid
    utils.verifyTransactionReceipt(response);

    // verify if the transaction has was actually mined
    await utils.verifyIfMined(workers, response.data.transaction_hash);

    // confirm that worker is a worker
    const isWorkerAfter = await workers.isWorker(constants.workerAccount1);
    assert.equal(isWorkerAfter.isSuccess(), true);
    assert.equal(isWorkerAfter.data.isValid, true);

  });

});
