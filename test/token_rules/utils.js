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

const EIP20TokenMock = artifacts.require('EIP20TokenMock');
const TokenRules = artifacts.require('TokenRules');

/**
 * Creates an EIP20 instance to be used during TokenRules::executeTransfers
 * function's testing with the following defaults:
 *      - conversionRate: 1
 *      - conversionRateDecimals: 1
 *      - symbol: 'OST'
 *      - name: 'Open Simple Token'
 *      - decimals: 1
 */
module.exports.createEIP20Token = async () => {
    const token = await EIP20TokenMock.new(
        1, 1, 'OST', 'Open Simple Token', 1,
    );

    return token;
};

/** Returns true if the specified constraint exists, otherwise false. */
module.exports.constraintExists = async (tokenRules, constraintAddress) => {
    const constraintCount = await tokenRules.globalConstraintCount.call();

    for (let i = 0; i < constraintCount; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        const c = await tokenRules.globalConstraints.call(i);
        if (c === constraintAddress) {
            return true;
        }
    }

    return false;
};

/**
 * Creates and returns the tuple:
 *      (tokenRules, organizationAddress, token)
 */
module.exports.createTokenRules = async (accountProvider) => {
    const organizationAddress = accountProvider.get();
    const token = await this.createEIP20Token();

    const tokenRules = await TokenRules.new(
        organizationAddress, token.address,
    );

    return {
        tokenRules,
        organizationAddress,
        token,
    };
};
