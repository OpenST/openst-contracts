// Copyright 2018 OpenST Ltd.
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

const web3 = require('../test_lib/web3.js');

class Event {
    static decodeTransactionResponse(transactionResponse) {
        const events = [];

        assert.isOk(Object.prototype.hasOwnProperty.call(
            transactionResponse, 'logs',
        ));

        const { logs } = transactionResponse;

        for (let i = 0; i < logs.length; i += 1) {
            events.push({
                name: logs[i].event,
                args: logs[i].args,
            });
        }

        return events;
    }

    static assertEqual(actual, expected) {
        assert.strictEqual(actual.name, expected.name);
        Object.keys(expected.args).forEach((key) => {
            if (key !== '0' && key !== '1' && key !== '__length__') {
                assert.isOk(Object.hasOwnProperty.call(actual.args, key));
                if (web3.utils.isBN(expected.args[key])) {
                    assert.isOk(web3.utils.isBN(actual.args[key]));
                    assert.isOk(expected.args[key].eq(actual.args[key]));
                } else {
                    assert.strictEqual(actual.args[key], expected.args[key]);
                }
            }
        });

        Object.keys(actual.args).forEach((key) => {
            if (Number.isNaN(Number.parseInt(key, 10)) && key !== '__length__') {
                assert.isOk(Object.hasOwnProperty.call(expected.args, key));
            }
        });
    }

    static assertEqualMulti(actualList, expectedList) {
        assert.strictEqual(
            actualList.length,
            expectedList.length,
            'Length of actual event list and expected ones should be equal.',
        );

        for (let i = 0; i < actualList.lengh; i += 1) {
            const actual = actualList[i];
            const expected = expectedList[i];
            this.assertEqual(actual, expected);
        }
    }
}

module.exports = {
    Event,
};
