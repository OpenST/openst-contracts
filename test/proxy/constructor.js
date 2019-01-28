// Copyright 2019 OpenST Ltd.
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


const Utils = require('../test_lib/utils.js');
const web3 = require('../test_lib/web3.js');
const { AccountProvider } = require('../test_lib/utils.js');

const ProxyContract = artifacts.require('Proxy');

contract('Proxy::constructor', async () => {
    contract('Negative Tests', async () => {
        it('Reverts if the master copy address is null.', async () => {
            await Utils.expectRevert(
                ProxyContract.new(
                    Utils.NULL_ADDRESS,
                ),
                'Should revert as the master copy address is null.',
                'Master copy address is null.',
            );
        });
    });

    contract('Storage', async (accounts) => {
        const accountProvider = new AccountProvider(accounts);

        it('Checks that passed arguments are set correctly.', async () => {
            const masterCopyAddress = accountProvider.get();

            const proxyContract = await ProxyContract.new(
                masterCopyAddress,
            );

            assert.strictEqual(
                await proxyContract.masterCopy.call(),
                masterCopyAddress,
            );
        });

        it('Checks that the master copy address is at 0 position of storage.', async () => {
            const masterCopyAddress = accountProvider.get();

            const proxyContract = await ProxyContract.new(
                masterCopyAddress,
            );

            assert.strictEqual(
                (await web3.eth.getStorageAt(proxyContract.address, 0)),
                masterCopyAddress.toLowerCase(),
            );
        });
    });
});
