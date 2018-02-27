/*eslint-disable */
const chai = require('chai')
  , assert = chai.assert
  , rootPrefix = '../..'
  , eventListener = require(rootPrefix+'/mocha_test/lib/event_listener')
  , helper = require(rootPrefix + '/lib/contract_interact/helper')
  ;
/*eslint-enable */

eventListener.startObserving();


module.exports.verifyIfMined = async (contract, transactionHash) => {

  const receipt = await contract.getTxReceipt(transactionHash);
  assert.equal(receipt.isSuccess(), true);
  assert.exists(receipt.data.transactionReceipt);
  assert.equal(transactionHash, receipt.data.transactionReceipt.formattedTransactionReceipt.transactionHash);

};

module.exports.verifyTransactionUUID = function (response) {

  console.log("verifyTransactionUUID");
  console.log(response);
  // verify if the response is success
  assert.equal(response.isSuccess(), true, "response success check");

  // verify if the uuid, transaction has and transaction receipt is available
  assert.isNotEmpty(response.data.transaction_uuid, "check if transaction uuid exists");
  assert.isEmpty(response.data.transaction_hash, "check if transaction hash does not exists");
  assert.isEmpty(response.data.transaction_receipt, "check if transaction receipt does not exists");

};

module.exports.verifyTransactionHash = function (response) {

  console.log("verifyTransactionHash");
  console.log(response);
  // verify if the response is success
  assert.equal(response.isSuccess(), true, "response success check");

  // verify if the uuid, transaction has and transaction receipt is available
  assert.isNotEmpty(response.data.transaction_uuid, "check if transaction uuid exists");
  assert.isNotEmpty(response.data.transaction_hash, "check if transaction hash exists");
  assert.isEmpty(response.data.transaction_receipt, "check if transaction receipt does not exists");

  // verify if the events were fired
  assert.equal(eventListener.verifyIfEventFired(response.data.transaction_uuid, "transaction_initiated"), true, "Event verification for transaction_initiated");

};

module.exports.verifyTransactionReceipt = function (response) {

  console.log("response");
  console.log(response);
  // verify if the response is success
  assert.equal(response.isSuccess(), true, "response success check");

  // verify if the uuid, transaction has and transaction receipt is available
  assert.isNotEmpty(response.data.transaction_uuid, "check if transaction uuid exists");
  assert.isNotEmpty(response.data.transaction_hash, "check if transaction hash exists");
  assert.exists(response.data.transaction_receipt, "check if transaction receipt exists");

  // verify if the events were fired
  assert.equal(eventListener.verifyIfEventFired(response.data.transaction_uuid, "transaction_initiated"), true, "Event verification for transaction_initiated");
  assert.equal(eventListener.verifyIfEventFired(response.data.transaction_uuid, "transaction_mined"), true, "Event verification for transaction_mined");

};

