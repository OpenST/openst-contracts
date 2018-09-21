
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
                logIndex: logs[i].logIndex,
            });
        }

        return events;
    }

    static assertEqual(actual, expected) {
        assert.strictEqual(actual.logIndex, expected.logIndex);
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
            if (key !== '0' && key !== '1' && key !== '__length__') {
                assert.isOk(Object.hasOwnProperty.call(expected.args, key));
            }
        });
    }
}

module.exports = {
    Event,
};
