

class MultiSigWalletHelper {
    static async submitAddWallet(multisig, walletToAdd, options) {
        const transactionID = await multisig.submitAddWallet.call(
            walletToAdd, options,
        );

        await multisig.submitAddWallet(walletToAdd, options);

        return transactionID;
    }

    static async submitRemoveWallet(multisig, walletToRemove, options) {
        const transactionID = await multisig.submitRemoveWallet.call(
            walletToRemove, options,
        );

        await multisig.submitRemoveWallet(walletToRemove, options);

        return transactionID;
    }

    static async submitReplaceWallet(multisig, oldWallet, newWallet, options) {
        const transactionID = await multisig.submitReplaceWallet.call(
            oldWallet, newWallet, options,
        );

        await multisig.submitReplaceWallet(
            oldWallet, newWallet, options,
        );

        return transactionID;
    }

    static async submitRequirementChange(multisig, newRequired, options) {
        const transactionID = await multisig.submitRequirementChange.call(
            newRequired, options,
        );

        await multisig.submitRequirementChange(
            newRequired, options,
        );

        return transactionID;
    }
}

module.exports = {
    MultiSigWalletHelper,
};
