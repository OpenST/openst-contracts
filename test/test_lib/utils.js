// Copyright 2018 OST.com Ltd.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const assert = require('assert');
const web3 = require('./web3.js');

const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';

module.exports.NULL_ADDRESS = NULL_ADDRESS;

module.exports.isNullAddress = address => address === NULL_ADDRESS;

/**
 * Asserts that a call or transaction reverts.
 *
 * @param {promise} promise The call or transaction.
 * @param {string} expectedMessage Optional. If given, the revert message will
 *                                 be checked to contain this string.
 *
 * @throws Will fail an assertion if the call or transaction is not reverted.
 */
module.exports.expectRevert = async (
    promise, displayMessage, expectedRevertMessage,
) => {
    try {
        await promise;
    } catch (error) {
        assert(
            error.message.search('revert') > -1,
            `The contract should revert. Instead: ${error.message}`,
        );

        if (expectedRevertMessage !== undefined) {
            if (error.reason !== undefined) {
                assert(
                    expectedRevertMessage === error.reason,
                    `\nThe contract should revert with:\n\t"${expectedRevertMessage}" `
                    + `\ninstead received:\n\t"${error.reason}"\n`,
                );
            } else {
                assert(
                    error.message.search(expectedRevertMessage) > -1,
                    `\nThe contract should revert with:\n\t"${expectedRevertMessage}" `
                    + `\ninstead received:\n\t"${error.message}"\n`,
                );
            }
        }

        return;
    }

    assert(false, displayMessage);
};

module.exports.advanceBlock = () => new Promise((resolve, reject) => {
    web3.currentProvider.send({
        jsonrpc: '2.0',
        method: 'evm_mine',
        id: new Date().getTime(),
    }, (err) => {
        if (err) {
            return reject(err);
        }

        const newBlockHash = web3.eth.getBlock('latest').hash;

        return resolve(newBlockHash);
    });
});

/** Receives accounts list and gives away each time one. */
module.exports.AccountProvider = class AccountProvider {
    constructor(accounts) {
        this.accounts = accounts;
        this.index = 0;
    }

    get() {
        assert(this.index < this.accounts.length);
        const account = this.accounts[this.index];
        this.index += 1;
        return account;
    }
};
