'use strict';

/**
 * Decode logs from a transaction receipt
 *
 * @module lib/web3/events/formatter
 *
 */

const rootPrefix = '../../..',
  InstanceComposer = require(rootPrefix + '/instance_composer');

require(rootPrefix + '/config/core_addresses');

const Web3EventsDecoder = function(configStrategy, instanceComposer) {};

/**
 * Ivent Decoder.
 *
 * @namespace web3EventsDecoder
 *
 */
Web3EventsDecoder.prototype = {
  /**
   * performer
   *
   * @param {Object} txReceipt
   * @param {Hash} addressToNameMap - Map of the address(key) to name(value)
   *
   * @returns {result} object of {@link resulthelpwe\\er}
   *
   * @methodOf web3EventsDecoder
   *
   */
  perform: function(txReceipt, addressToNameMap) {
    const oThis = this,
      coreAddresses = oThis.ic().getCoreAddresses();

    var decodedEvents = [];

    // Transaction receipt not found
    if (!txReceipt) {
      return 'Transaction receipt was not found.';
    }

    // Block not yet mined
    if (!txReceipt.blockNumber) {
      return 'Transaction not yet mined. Please try after some time.';
    }

    var toAddr = txReceipt.to;
    var contractName = oThis.getContractNameFor(toAddr, addressToNameMap);

    // if the address is a known address
    if (contractName && txReceipt.logs.length > 0) {
      var abiDecoder = require('abi-decoder'),
        relevantLogs = [];

      for (var i = 0; i < txReceipt.logs.length; i++) {
        var currContract = oThis.getContractNameFor(txReceipt.logs[i].address, addressToNameMap);

        console.debug(
          '**** contract address: ' +
            txReceipt.logs[i].address +
            ' at log index(' +
            i +
            ') in TxHash: ' +
            txReceipt.transactionHash +
            ''
        );

        if (!currContract) {
          console.error(
            '**** No contract found for contract address: ' +
              txReceipt.logs[i].address +
              ' at log index(' +
              i +
              ') in TxHash: ' +
              txReceipt.transactionHash +
              ''
          );
          continue;
        }

        const currContractABI = coreAddresses.getAbiForContract(currContract);

        // ABI not found
        if (!currContractABI) {
          return 'ABI not found for contract ';
        }

        relevantLogs.push(txReceipt.logs[i]);
        abiDecoder.addABI(currContractABI);
      }

      if (relevantLogs.length > 0) {
        decodedEvents = abiDecoder.decodeLogs(relevantLogs);
      }
    }

    return {
      rawTransactionReceipt: txReceipt,
      formattedTransactionReceipt: {
        transactionHash: txReceipt.transactionHash,
        blockHash: txReceipt.blockHash,
        blockNumber: txReceipt.blockNumber,
        eventsData: decodedEvents,
        toAddress: toAddr,
        contractAddress: txReceipt.contractAddress || ''
      }
    };
  },
  getContractNameFor: function(address, addressToNameMap) {
    const oThis = this,
      lcAddress = String(address).toLowerCase(),
      coreAddresses = oThis.ic().getCoreAddresses();
    if (!addressToNameMap || !(addressToNameMap[address] || addressToNameMap[lcAddress])) {
      return coreAddresses.getContractNameFor(address);
    }
    return addressToNameMap[address] || addressToNameMap[lcAddress];
  }
};

InstanceComposer.register(Web3EventsDecoder, 'getWeb3EventsDecoder', true);

module.exports = Web3EventsDecoder;
