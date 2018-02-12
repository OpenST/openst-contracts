
const chai = require('chai')
  , assert = chai.assert;

module.exports.verifyReceipt = async (pricer, transactionHash) => {

  const receipt = await pricer.getTxReceipt(transactionHash);

  assert.equal(receipt.isSuccess(), true);
  assert.equal(transactionHash, receipt.data.transactionReceipt.formattedTransactionReceipt.transactionHash);
  assert.exists(receipt.data.transactionReceipt);

};

