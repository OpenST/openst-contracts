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

const MultiSigWallet = artifacts.require('MultiSigWallet');

class MultiSigWalletUtils {
    constructor({ accountProvider, walletCount, required }) {
        return (
            async () => {
                assert(walletCount > 0);
                assert(required > 0);

                this._accountProvider = accountProvider;
                this._required = required;
                this._walletCount = walletCount;

                this._wallets = [];

                for (let i = 0; i < walletCount; i += 1) {
                    this._wallets.push(this._accountProvider.get());
                }

                this._multisig = await MultiSigWallet.new(this._wallets, this._required);

                return this;
            })();
    }

    multisig() {
        return this._multisig;
    }

    wallet(index) {
        assert(index < this._wallets.length);
        assert(index >= 0);

        return this._wallets[index];
    }

    async submitAddWallet(walletToAdd, fromWalletIndex) {
        const transactionID = await this._multisig.submitAddWallet.call(
            walletToAdd,
            { from: this.wallet(fromWalletIndex) },
        );

        await this._multisig.submitAddWallet(
            walletToAdd,
            { from: this.wallet(fromWalletIndex) },
        );

        return transactionID;
    }

    async submitRemoveWallet(walletToRemoveIndex, fromWalletIndex) {
        const transactionID = await this._multisig.submitRemoveWallet.call(
            this.wallet(walletToRemoveIndex),
            { from: this.wallet(fromWalletIndex) },
        );

        await this._multisig.submitRemoveWallet(
            this.wallet(walletToRemoveIndex),
            { from: this.wallet(fromWalletIndex) },
        );

        return transactionID;
    }

    async submitReplaceWallet(oldWalletIndex, newWallet, fromWalletIndex) {
        const transactionID = await this._multisig.submitReplaceWallet.call(
            this.wallet(oldWalletIndex),
            newWallet,
            { from: this.wallet(fromWalletIndex) },
        );

        await this._multisig.submitReplaceWallet(
            this.wallet(oldWalletIndex),
            newWallet,
            { from: this.wallet(fromWalletIndex) },
        );

        return transactionID;
    }

    async submitRequirementChange(newRequired, fromWalletIndex) {
        const transactionID = await this._multisig.submitRequirementChange.call(
            newRequired,
            { from: this.wallet(fromWalletIndex) },
        );

        await this._multisig.submitRequirementChange(
            newRequired,
            { from: this.wallet(fromWalletIndex) },
        );

        return transactionID;
    }
}

module.exports = {
    MultiSigWalletUtils,
};
