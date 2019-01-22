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

const BN = require('bn.js');
const assert = require('assert');
const EthUtils = require('ethereumjs-util');
const web3 = require('./web3.js');

const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';

const MAX_UINT256 = new BN(2).pow(new BN(256)).sub(new BN(1));

const generateExTxHash = (
    from, to, data, nonce, callPrefix,
) => web3.utils.soliditySha3(
    {
        t: 'bytes1', v: '0x19',
    },
    {
        t: 'bytes1', v: '0x0',
    },
    {
        t: 'address', v: from,
    },
    {
        t: 'address', v: to,
    },
    {
        t: 'uint8', v: 0,
    },
    {
        t: 'bytes32', v: web3.utils.keccak256(data),
    },
    {
        t: 'uint256', v: nonce,
    },
    {
        t: 'uint8', v: 0,
    },
    {
        t: 'uint8', v: 0,
    },
    {
        t: 'uint8', v: 0,
    },
    {
        t: 'bytes4', v: callPrefix,
    },
    {
        t: 'uint8', v: 0,
    },
    {
        t: 'bytes32', v: '0x0',
    },
);

module.exports = {

    NULL_ADDRESS,

    MAX_UINT256,

    isNullAddress: address => address === NULL_ADDRESS,

    /**
     * Asserts that a call or transaction reverts.
     *
     * @param {promise} promise The call or transaction.
     * @param {string} expectedMessage Optional. If given, the revert message will
     *                                 be checked to contain this string.
     *
     * @throws Will fail an assertion if the call or transaction is not reverted.
     */
    expectRevert: async (
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
    },

    advanceBlock: () => new Promise((resolve, reject) => {
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
    }),

    /** Receives accounts list and gives away each time one. */
    AccountProvider: class AccountProvider {
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
    },

    generateExTx: (
        from, to, data, nonce, callPrefix, sessionPrivateKey,
    ) => {
        const exTxHash = generateExTxHash(
            from, to, data, nonce, callPrefix,
        );

        const exTxSignature = EthUtils.ecsign(
            EthUtils.toBuffer(exTxHash),
            EthUtils.toBuffer(sessionPrivateKey),
        );

        return { exTxHash, exTxSignature };
    },

    getParamFromTxEvent: (
        transaction, contractAddress, eventName, paramName,
    ) => {
        assert(
            typeof transaction === 'object'
            && !Array.isArray(transaction)
            && transaction !== null,
        );
        assert(eventName !== '');
        assert(contractAddress !== '');

        const { logs } = transaction;

        const filteredLogs = logs.filter(
            l => l.event === eventName && l.address === contractAddress,
        );

        assert(
            filteredLogs.length === 1,
            'Too many entries found after filtering the logs.',
        );

        const param = filteredLogs[0].args[paramName];

        assert(typeof param !== 'undefined');

        return param;
    },
};
