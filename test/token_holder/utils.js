const TokenHolder = artifacts.require('TokenHolder');
const TokenRulesMock = artifacts.require('TokenRulesMock');
const UtilityTokenMock = artifacts.require('UtilityTokenMock');

const web3 = require('../test_lib/web3.js');

class TokenHolderUtils {
    static async submitAuthorizeSession(
        tokenHolder, ephemeralKey, spendingLimit, expirationHeight, options,
    ) {
        const transactionID = await tokenHolder.submitAuthorizeSession.call(
            ephemeralKey, spendingLimit, expirationHeight, options,
        );

        await tokenHolder.submitAuthorizeSession(
            ephemeralKey, spendingLimit, expirationHeight, options,
        );

        return transactionID;
    }

    static async createUtilityMockToken() {
        const utilityToken = await UtilityTokenMock.new(
            'OST', 'Open Simple Token', 1,
        );

        return { utilityToken };
    }

    static async createMockTokenRules() {
        const tokenRules = await TokenRulesMock.new();

        return { tokenRules };
    }

    static async createTokenHolder(
        accountProvider,
        utilityTokenMock, tokenRulesMock,
    ) {
        const tokenHolderOwnerAddress = accountProvider.get();

        const tokenHolder = await TokenHolder.new(
            utilityTokenMock.address,
            tokenRulesMock.address,
            tokenHolderOwnerAddress,
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
