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


const BN = require('bn.js');
const Utils = require('../test_lib/utils.js');
const { Event } = require('../test_lib/event_decoder');
const { AccountProvider } = require('../test_lib/utils.js');

const ProxyContract = artifacts.require('Proxy');
const MasterCopySpy = artifacts.require('MasterCopySpy');


contract('Proxy::fallback', async (accounts) => {
    const accountProvider = new AccountProvider(accounts);

    it('Checks that initialization through setup does in proxy\'s storage.', async () => {
        const mcInitialBalanceConstructor = 11;
        const mcInitialBalanceSetup = 22;

        const mc = await MasterCopySpy.new(mcInitialBalanceConstructor);
        const proxy = await ProxyContract.new(mc.address);
        const pmc = await MasterCopySpy.at(proxy.address);
        await pmc.setup(mcInitialBalanceSetup);

        assert.isOk(
            (await mc.remainingBalance.call()).eqn(mcInitialBalanceConstructor),
        );

        assert.isOk(
            (await pmc.remainingBalance.call()).eqn(mcInitialBalanceSetup),
        );
    });

    it('Checks msg.value and msg.sender correctness.', async () => {
        const initialBalance = 22;

        const mc = await MasterCopySpy.new(initialBalance);
        const proxy = await ProxyContract.new(mc.address);
        const pmc = await MasterCopySpy.at(proxy.address);
        await pmc.setup(initialBalance);

        const msgValue = 11;
        const msgSender = accountProvider.get();
        const currencyCode = 7;
        const beneficiary = accountProvider.get();

        await pmc.pay(
            currencyCode,
            beneficiary,
            {
                value: msgValue,
                from: msgSender,
            },
        );

        assert.strictEqual(
            await pmc.recordedMsgSender.call(),
            msgSender,
        );

        assert.strictEqual(
            await mc.recordedMsgSender.call(),
            Utils.NULL_ADDRESS,
        );

        assert.isOk(
            (await pmc.recordedMsgValue.call()).eqn(msgValue),
        );

        assert.isOk(
            (await mc.recordedMsgValue.call()).eqn(0),
        );
    });

    it('Checks that a call through proxy updates only proxy\'s storage.', async () => {
        const initialBalance = 22;

        const mc = await MasterCopySpy.new(initialBalance);
        const proxy = await ProxyContract.new(mc.address);
        const pmc = await MasterCopySpy.at(proxy.address);
        await pmc.setup(initialBalance);

        const msgValue = 11;
        const currencyCode = 7;
        const beneficiary = accountProvider.get();

        await pmc.pay(
            currencyCode,
            beneficiary,
            {
                value: msgValue,
            },
        );

        assert.strictEqual(
            await pmc.recordedBeneficiary.call(),
            beneficiary,
        );

        assert.isOk(
            (await pmc.recordedCurrencyCode.call()).eqn(currencyCode),
        );

        assert.isOk(
            (await pmc.remainingBalance.call()).eqn(initialBalance - msgValue),
        );

        assert.strictEqual(
            await mc.recordedBeneficiary.call(),
            Utils.NULL_ADDRESS,
        );

        assert.isOk(
            (await mc.recordedCurrencyCode.call()).eqn(0),
        );

        assert.isOk(
            (await mc.remainingBalance.call()).eqn(initialBalance),
        );
    });

    it('Checks that return data is correctly propagated back.', async () => {
        const initialBalance = 22;

        const mc = await MasterCopySpy.new(initialBalance);
        const proxy = await ProxyContract.new(mc.address);
        const pmc = await MasterCopySpy.at(proxy.address);
        await pmc.setup(initialBalance);

        const msgValue = 11;
        const currencyCode = 7;
        const beneficiary = accountProvider.get();

        const remainingBalance = await pmc.pay.call(
            currencyCode,
            beneficiary,
            {
                value: msgValue,
            },
        );

        assert.isOk(
            remainingBalance.eqn(initialBalance - msgValue),
        );
    });

    it('Checks that exception is handled properly.', async () => {
        const initialBalance = 22;

        const mc = await MasterCopySpy.new(initialBalance);
        const proxy = await ProxyContract.new(mc.address);
        const pmc = await MasterCopySpy.at(proxy.address);
        await pmc.setup(initialBalance);

        const currencyCode = 7;
        const beneficiary = accountProvider.get();

        await Utils.expectRevert(
            pmc.pay.call(
                currencyCode,
                beneficiary,
                {
                    value: initialBalance + 1,
                },
            ),
        );
    });

    it('Checks the event emition.', async () => {
        const initialBalance = 22;

        const mc = await MasterCopySpy.new(initialBalance);
        const proxy = await ProxyContract.new(mc.address);
        const pmc = await MasterCopySpy.at(proxy.address);
        await pmc.setup(initialBalance);

        const msgValue = 11;
        const currencyCode = 7;
        const beneficiary = accountProvider.get();

        const transactionResponse = await pmc.pay(
            currencyCode,
            beneficiary,
            {
                value: msgValue,
            },
        );

        const events = Event.decodeTransactionResponse(
            transactionResponse,
        );

        assert.strictEqual(
            events.length,
            1,
        );

        Event.assertEqual(events[0], {
            name: 'Payment',
            args: {
                _beneficiary: beneficiary,
                _amount: new BN(msgValue),
            },
        });
    });
});
