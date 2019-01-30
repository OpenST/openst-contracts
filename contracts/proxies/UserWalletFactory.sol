pragma solidity ^0.5.0;

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

import "./Proxy.sol";


/**
 * @title Allows to create a new gnosis safe proxy and executes a
 *        message call to the newly created proxy. Afterwards, in the same
 *        transaction, creates a new token holder proxy by specifying
 *        as an owner the newly created gnosis safe proxy contract.
 */
contract UserWalletFactory {

    /* Events */

    /**
     * @notice The event is emitted the from UserWalletFactory::createUserWallet
     *         function on success.
     *
     * @param _gnosisSafeProxy A newly created gnosis safe's proxy.
     * @param _tokenHolderProxy A newly created token holder's proxy.
     */
    event UserWalletCreated(
        Proxy _gnosisSafeProxy,
        Proxy _tokenHolderProxy
    );


    /* Constants */

    /** The callprefix of the TokenHolder::setup function. */
    bytes4 public constant TOKENHOLDER_SETUP_CALLPREFIX = bytes4(
        keccak256(
            "setup(address,address,address,address[],uint256[],uint256[])"
        )
    );


    /* External Functions  */

    /**
    * @notice Create a new gnosis safe proxy and executes a
    *         message call to the newly created proxy. Afterwards, in the same
    *         transaction, creates a new token holder proxy by specifying
    *         as an owner the newly created gnosis safe proxy contract.
    *
    * @param _gnosisSafeMasterCopy The address of a master copy of gnosis safe.
    * @param _gnosisSafeData The message data to be called on a newly created
    *                        gnosis safe proxy.
    * @param _tokenHolderMasterCopy The address of a master copy of token
    *                               holder.
    * @param _token The address of the economy token.
    * @param _tokenRules The address of the token rules.
    * @param _sessionKeys Session key addresses to authorize.
    * @param _sessionKeysSpendingLimits Session keys' spending limits.
    * @param _sessionKeysExpirationHeights Session keys' expiration heights.
    *
    * @return gnosisSafeProxy_ A newly created gnosis safe's proxy address.
    * @return tokenHolderProxy_ A newly created token holder's proxy address.
    */
    function createUserWallet(
        address _gnosisSafeMasterCopy,
        bytes calldata _gnosisSafeData,
        address _tokenHolderMasterCopy,
        address _token,
        address _tokenRules,
        address[] calldata _sessionKeys,
        uint256[] calldata _sessionKeysSpendingLimits,
        uint256[] calldata _sessionKeysExpirationHeights
    )
        external
        returns (Proxy gnosisSafeProxy_, Proxy tokenHolderProxy_)
    {
        gnosisSafeProxy_ = new Proxy(_gnosisSafeMasterCopy);
        callProxyData(gnosisSafeProxy_, _gnosisSafeData);

        tokenHolderProxy_ = new Proxy(_tokenHolderMasterCopy);

        bytes memory tokenHolderData = abi.encodeWithSelector(
            TOKENHOLDER_SETUP_CALLPREFIX,
            _token,
            _tokenRules,
            gnosisSafeProxy_,
            _sessionKeys,
            _sessionKeysSpendingLimits,
            _sessionKeysExpirationHeights
        );
        callProxyData(tokenHolderProxy_, tokenHolderData);

        emit UserWalletCreated(gnosisSafeProxy_, tokenHolderProxy_);
    }


    /* Private Functions */

    function callProxyData(
        Proxy _proxy,
        bytes memory _data
    )
        private
    {
        if (_data.length > 0) {
            // solium-disable-next-line security/no-inline-assembly
            assembly {
                if eq(call(gas, _proxy, 0, add(_data, 0x20), mload(_data), 0, 0), 0) {
                    revert(0, 0)
                }
            }
        }
    }
}
