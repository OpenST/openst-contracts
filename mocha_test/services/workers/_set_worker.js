/* global describe, it */

const chai = require('chai')
  , assert = chai.assert;

const rootPrefix      = "../../.."
    , constants       = require(rootPrefix + '/mocha_test/lib/constants')
    , BigNumber       = require('bignumber.js')
    , utils           = require(rootPrefix+'/mocha_test/lib/utils')
    , web3Provider = require(rootPrefix + '/lib/web3/providers/ws')
    , SetWorkerKlass = require(rootPrefix + '/services/workers/set_worker')
    , IsWorkerKlass = require(rootPrefix + '/services/workers/is_worker')
;

describe('Set worker', function() {

  it('should pass the initial address checks', function() {

    assert.isDefined(constants.deployer);
    assert.isDefined(constants.ops);
    assert.isDefined(constants.account1);

  });

  it('should fail when gasPrice is null', async function() {

    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    const currentBlockNumber = await web3Provider.eth.getBlockNumber()
        , deactivationHeight = new BigNumber(currentBlockNumber).plus(10000)
    ;

    // set worker
    var SetWorkerObject = new SetWorkerKlass({
      workers_contract_address: constants.workersContractAddress,
      sender_address: constants.ops,
      sender_passphrase: constants.opsPassphrase,
      worker_address: constants.workerAccount1,
      deactivation_height: deactivationHeight.toString(10),
      gas_price: 0,
      chain_id: constants.chainId,
      options: constants.optionsReceipt
    });
    const response = await SetWorkerObject.perform();

    // confirm failure reponse and message
    assert.equal(response.isFailure(), true);
    assert.equal(response.err.msg, 'gas is mandatory');

  });

  it('should fail when senderAddress is not valid', async function() {

    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    const currentBlockNumber = await web3Provider.eth.getBlockNumber()
        , deactivationHeight = new BigNumber(currentBlockNumber).plus(10000)
    ;

    // set worker
    var SetWorkerObject = new SetWorkerKlass({
      workers_contract_address: constants.workersContractAddress,
      sender_address: 0,
      sender_passphrase: constants.opsPassphrase,
      worker_address: constants.workerAccount1,
      deactivation_height: deactivationHeight.toString(10),
      gas_price: constants.gasUsed,
      chain_id: constants.chainId,
      options: constants.optionsReceipt
    });
    const response = await SetWorkerObject.perform();
    // confirm failure reponse and message
    assert.equal(response.isFailure(), true);
    assert.equal(response.err.msg, 'sender address is invalid');

  });

  it('should fail when workerAddress is not valid', async function() {

    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    const currentBlockNumber = await web3Provider.eth.getBlockNumber()
        , deactivationHeight = new BigNumber(currentBlockNumber).plus(10000)
    ;

    // set worker
    var SetWorkerObject = new SetWorkerKlass({
      workers_contract_address: constants.workersContractAddress,
      sender_address: constants.ops,
      sender_passphrase: constants.opsPassphrase,
      worker_address: 0,
      deactivation_height: deactivationHeight.toString(10),
      gas_price: constants.gasUsed,
      chain_id: constants.chainId,
      options: constants.optionsReceipt
    });
    const response = await SetWorkerObject.perform();

    // confirm failure reponse and message
    assert.equal(response.isFailure(), true);
    assert.equal(response.err.msg, 'worker address is invalid');

  });

  it('should fail when deactivationHeight is not present', async function() {

    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    const currentBlockNumber = await web3RpcProvider.eth.getBlockNumber()
        , deactivationHeight = new BigNumber(currentBlockNumber).plus(10000)
    ;

    // set worker
    var SetWorkerObject = new SetWorkerKlass({
      workers_contract_address: constants.workersContractAddress,
      sender_address: constants.ops,
      sender_passphrase: constants.opsPassphrase,
      worker_address: constants.workerAccount1,
      deactivation_height: null,
      gas_price: constants.gasUsed,
      chain_id: constants.chainId,
      options: constants.optionsReceipt
    });
    const response = await SetWorkerObject.perform();

    // confirm failure reponse and message
    assert.equal(response.isFailure(), true);
    assert.equal(response.err.msg, 'deactivation height is mandatory');

  });

  it('should fail when deactivationHeight is not a number', async function() {

    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    const currentBlockNumber = await web3RpcProvider.eth.getBlockNumber()
        , deactivationHeight = new BigNumber(currentBlockNumber).plus(10000)
    ;

    // set worker
    var SetWorkerObject = new SetWorkerKlass({
      workers_contract_address: constants.workersContractAddress,
      sender_address: constants.ops,
      sender_passphrase: constants.opsPassphrase,
      worker_address: constants.workerAccount1,
      deactivation_height: 'NaN',
      gas_price: constants.gasUsed,
      chain_id: constants.chainId,
      options: constants.optionsReceipt
    });
    const response = await SetWorkerObject.perform();
    // confirm failure reponse and message
    assert.equal(response.isFailure(), true);
    assert.equal(response.err.msg, 'deactivation height value is invalid');

  });

  it('should fail when deactivationHeight is less than 0', async function() {

    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    const currentBlockNumber = await web3RpcProvider.eth.getBlockNumber()
        , deactivationHeight = new BigNumber(currentBlockNumber).plus(10000)
    ;

    // set worker
    var SetWorkerObject = new SetWorkerKlass({
      workers_contract_address: constants.workersContractAddress,
      sender_address: constants.ops,
      sender_passphrase: constants.opsPassphrase,
      worker_address: constants.workerAccount1,
      deactivation_height: -1,
      gas_price: constants.gasUsed,
      chain_id: constants.chainId,
      options: constants.optionsReceipt
    });
    const response = await SetWorkerObject.perform();
    // confirm failure reponse and message
    assert.equal(response.isFailure(), true);
    assert.equal(response.err.msg, 'deactivation height value is invalid');

  });

  it('should fail when deactivationHeight is not an integer', async function() {

    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    const currentBlockNumber = await web3Provider.eth.getBlockNumber()
        , deactivationHeight = new BigNumber(currentBlockNumber).plus(10000)
    ;

    // set worker
    var SetWorkerObject = new SetWorkerKlass({
      workers_contract_address: constants.workersContractAddress,
      sender_address: constants.ops,
      sender_passphrase: constants.opsPassphrase,
      worker_address: constants.workerAccount1,
      deactivation_height: 0.1,
      gas_price: constants.gasUsed,
      chain_id: constants.chainId,
      options: constants.optionsReceipt
    });
    const response = await SetWorkerObject.perform();
    // confirm failure reponse and message
    assert.equal(response.isFailure(), true);
    assert.equal(response.err.msg, 'deactivation height value is invalid');

  });

  it('should succeed', async function() {

    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    const currentBlockNumber = await web3Provider.eth.getBlockNumber()
        , deactivationHeight = new BigNumber(currentBlockNumber).plus(10000)
    ;

    // confirm that worker is not a worker
    var IsWorkerObject = new IsWorkerKlass({
      workers_contract_address: constants.workersContractAddress,
      worker_address: constants.workerAccount1,
      chain_id: constants.chainId
    });
    const isWorkerBefore = await IsWorkerObject.perform();
    assert.equal(isWorkerBefore.isSuccess(), true);
    assert.equal(isWorkerBefore.data.isValid, false);

    // set worker
    var SetWorkerObject = new SetWorkerKlass({
      workers_contract_address: constants.workersContractAddress,
      sender_address: constants.ops,
      sender_passphrase: constants.opsPassphrase,
      worker_address: constants.workerAccount1,
      deactivation_height: deactivationHeight.toString(10),
      gas_price: constants.gasUsed,
      chain_id: constants.chainId,
      options: constants.optionsReceipt
    });
    const response = await SetWorkerObject.perform();

    // verify if the transaction receipt is valid
    utils.verifyTransactionReceipt(response);

    // confirm that worker is a worker
    var IsWorkerObject = new IsWorkerKlass({
      workers_contract_address: constants.workersContractAddress,
      worker_address: constants.workerAccount1,
      chain_id: constants.chainId
    });
    const isWorkerAfter = await IsWorkerObject.perform();
    assert.equal(isWorkerAfter.isSuccess(), true);
    assert.equal(isWorkerAfter.data.isValid, true);

  });

	it('should pass interaction layer test when return type is uuid', async function() {

    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    const currentBlockNumber = await web3Provider.eth.getBlockNumber()
        , deactivationHeight = new BigNumber(currentBlockNumber).plus(10000)
    ;

    // set worker
    var SetWorkerObject = new SetWorkerKlass({
      workers_contract_address: constants.workersContractAddress,
      sender_address: constants.ops,
      sender_passphrase: constants.opsPassphrase,
      worker_address: constants.workerAccount1,
      deactivation_height: deactivationHeight.toString(10),
      gas_price: constants.gasUsed,
      chain_id: constants.chainId,
      options: constants.optionsUUID
    });
    const response = await SetWorkerObject.perform();

    // verify transaction UUID
    // we will not verify if it got mined as its just interaction layer testing
    utils.verifyTransactionUUID(response);

  });

  it('should pass interaction layer test when return type is txHash', async function() {

    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    const currentBlockNumber = await web3Provider.eth.getBlockNumber()
        , deactivationHeight = new BigNumber(currentBlockNumber).plus(10000)
    ;

    // set worker
    var SetWorkerObject = new SetWorkerKlass({
      workers_contract_address: constants.workersContractAddress,
      sender_address: constants.ops,
      sender_passphrase: constants.opsPassphrase,
      worker_address: constants.workerAccount1,
      deactivation_height: deactivationHeight.toString(10),
      gas_price: constants.gasUsed,
      chain_id: constants.chainId,
      options: constants.optionsHash
    });
    const response = await SetWorkerObject.perform();

    // verify transaction hash
    utils.verifyTransactionHash(response);

  });

  it('should pass interaction layer test when return type is txReceipt', async function() {

    // eslint-disable-next-line no-invalid-this
    this.timeout(100000);

    const currentBlockNumber = await web3Provider.eth.getBlockNumber()
        , deactivationHeight = new BigNumber(currentBlockNumber).plus(10000)
    ;

    // set worker
    var SetWorkerObject = new SetWorkerKlass({
      workers_contract_address: constants.workersContractAddress,
      sender_address: constants.ops,
      sender_passphrase: constants.opsPassphrase,
      worker_address: constants.workerAccount1,
      deactivation_height: deactivationHeight.toString(10),
      gas_price: constants.gasUsed,
      chain_id: constants.chainId,
      options: constants.optionsReceipt
    });
    const response = await SetWorkerObject.perform();

    // verify transaction receipt
    utils.verifyTransactionReceipt(response);

	});

});
