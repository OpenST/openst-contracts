const TokenHolder = artifacts.require('TokenHolder');
const TokenRulesSpy = artifacts.require('TokenRulesSpy');
const UtilityTokenFake = artifacts.require('UtilityTokenFake');

const web3 = require('../test_lib/web3.js');

class TokenHolderUtils {
    static async createUtilityMockToken() {
        const utilityToken = await UtilityTokenFake.new(
            'OST', 'Open Simple Token', 1,
        );

        return { utilityToken };
    }

    static async createMockTokenRules() {
        const tokenRules = await TokenRulesSpy.new();

        return { tokenRules };
    }

    static async createTokenHolder(
        accountProvider,
        utilityTokenMock, tokenRulesMock,
    ) {
        const tokenHolderOwnerAddress = accountProvider.get();

        const tokenHolder = await TokenHolder.new();
        await tokenHolder.setup(
            utilityTokenMock.address,
            tokenRulesMock.address,
            tokenHolderOwnerAddress,
            [],
            [],
            [],
        );

        return {
            tokenHolderOwnerAddress,
            tokenHolder,
        };
    }

    static async authorizeSessionKey(
        tokenHolder, tokenHolderOwnerAddress,
        sessionPublicKeyToAuthorize, spendingLimit, deltaExpirationHeight,
    ) {
        const blockNumber = await web3.eth.getBlockNumber();

        await tokenHolder.authorizeSession(
            sessionPublicKeyToAuthorize,
            spendingLimit,
            blockNumber + deltaExpirationHeight,
            { from: tokenHolderOwnerAddress },
        );
    }
}

module.exports = {
    TokenHolderUtils,
};
