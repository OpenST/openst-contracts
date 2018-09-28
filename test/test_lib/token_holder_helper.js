

class TokenHolderHelper {
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
}

module.exports = {
    TokenHolderHelper,
};
