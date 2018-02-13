
const chai = require('chai')  
  , assert = chai.assert
  ,rootPrefix = '../../..'
  , eventListner = require('./event_listner')
  , helper = require(rootPrefix + '/lib/contract_interact/helper')
  ;

eventListner.startObserving();


module.exports.verifyIfMined = async (pricer, transactionHash) => {

  const receipt = await pricer.getTxReceipt(transactionHash);
  assert.equal(receipt.isSuccess(), true);
  assert.exists(receipt.data.transactionReceipt);
  assert.equal(transactionHash, receipt.data.transactionReceipt.formattedTransactionReceipt.transactionHash);

};

module.exports.verifyTransactionUUID = function (response) {
  // verify if the response is success
  assert.equal(response.isSuccess(), true, "response success check");

  // verify if the uuid, transaction has and transaction receipt is available
  assert.exists(response.data.transaction_uuid, "check if transaction uuid exists");
  assert.equal(response.data.transaction_hash, "", "check if transaction hash does not exists");
  assert.equal(response.data.transaction_receipt, "", "check if transaction receipt does not exists");

  // verify if the events were fired
  //assert.equal(eventListner.verifyIfEventFired(response.data.transaction_uuid, "transaction_initiated"), false, "Event verification for transaction_initiated");
  //assert.equal(eventListner.verifyIfEventFired(response.data.transaction_uuid, "transaction_mined"), false, "Event verification for transaction_mined");

};

module.exports.verifyTransactionHash = function (response) {
  // verify if the response is success
  assert.equal(response.isSuccess(), true, "response success check");

  // verify if the uuid, transaction has and transaction receipt is available
  assert.exists(response.data.transaction_uuid, "check if transaction uuid exists");
  assert.exists(response.data.transaction_hash, "check if transaction hash exists");
  assert.equal(response.data.transaction_receipt, "", "check if transaction receipt does not exists");

  // verify if the events were fired
  assert.equal(eventListner.verifyIfEventFired(response.data.transaction_uuid, "transaction_initiated"), true, "Event verification for transaction_initiated");
  //assert.equal(eventListner.verifyIfEventFired(response.data.transaction_uuid, "transaction_mined"), true, "Event verification for transaction_mined");

};

module.exports.verifyTransactionReceipt = function (response) {
  console.log("verifyTransactionReceipt");
  console.log(response);
  // verify if the response is success
  assert.equal(response.isSuccess(), true, "response success check");

  // verify if the uuid, transaction has and transaction receipt is available
  assert.exists(response.data.transaction_uuid, "check if transaction uuid exists");
  assert.exists(response.data.transaction_hash, "check if transaction hash exists");
  assert.exists(response.data.transaction_receipt, "check if transaction receipt exists");

  // verify if the events were fired
  assert.equal(eventListner.verifyIfEventFired(response.data.transaction_uuid, "transaction_initiated"), true, "Event verification for transaction_initiated");
  assert.equal(eventListner.verifyIfEventFired(response.data.transaction_uuid, "transaction_mined"), true, "Event verification for transaction_mined");

};

