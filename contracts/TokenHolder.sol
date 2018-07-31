pragma solidity ^0.4.23;

// Copyright 2017 OpenST Ltd.
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
//
// ----------------------------------------------------------------------------
// Utility Chain: Token Holder
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

import "./BrandedToken.sol";
import "./MultiSigWallet.sol";

/**
 *  @title TokenHolder contract.
 *
 *  @notice Implements properties and actions performed by an user. It enables
 *          scalable key management solutions for mainstream apps.
 *
 */
contract TokenHolder is MultiSigWallet {

    /** Events */

    event SessionAuthorized(bytes32 sessionLock, uint256 spendingLimit);

    event SessionRevoked(bytes32 sessionLock);

    event SessionValidated(bytes32 oldSessionLock, bytes32 newSessionLock);

    /** Storage */

    address public brandedToken;
    /** Co Gateway contract address for redeem functionality */
    address public coGateway;
    /** how many max tokens can be spent in a single transfer */
    uint256 private spendingLimit;
    // TODO spending limit per session lock
    mapping (bytes32 => bool) public sessionLocks;
    // TODO Storage needed for tokenRules from branded Token

    /**
	 *  @notice Contract constructor
	 *
	 *  @param _brandedToken erc20 contract address this user is part of
	 *  @param _coGateway utility chain gateway contract address
	 *  @param _spendingLimit max tokens user can spend at a time
	 *  @param _wallets wallet addresses minimum 2 is needed
	 */
    constructor(
        address _brandedToken,
        address _coGateway,
        uint256 _spendingLimit, // TODO remove
        uint256 _required,
        address[] _wallets) MultiSigWallet(_wallets, _required)
        public
    {
        require(_brandedToken != address(0), "Branded token contract address is 0");
        require(_coGateway != address(0), "Co gateway contract address is 0");
        require(_wallets.length >= 2, "Minimum two wallets are needed"); // TODO not needed

        spendingLimit = _spendingLimit;
        brandedToken = _brandedToken;
        coGateway = _coGateway;
    }

    // TODO make it internal
    function authorizeSession(
        bytes32 _sessionLock,
        uint256 _spendingLimit)
        onlyMultiSigWallet
        walletDoesNotExist(msg.sender)
        notNull(msg.sender)
        public
        returns(bool)
    {
        require(_sessionLock != bytes32(0), "Input sessionLock is invalid!");
        require(sessionLocks[_sessionLock] == bytes32(0), "SessionLock is already authorized");

        sessionLocks[_sessionLock] = true;
        spendingLimit = _spendingLimit;

        emit SessionAuthorized(_sessionLock, _spendingLimit);

        return true;
    }

    // TODO make it internal
    function revokeSession(
        bytes32 _sessionLock)
        onlyMultiSigWallet // not needed
        walletDoesNotExist(msg.sender)
        notNull(msg.sender)
        public
        returns(bool)
    {
        require(_sessionLock != bytes32(0), "Input SessionLock is invalid");
        require(sessionLocks[_sessionLock] != bytes32(0), "Input SessionLock is not authorized");

        delete sessionLocks[_sessionLock];
        spendingLimit = 0;

        emit SessionRevoked(_sessionLock);

        return true;
    }

    /*
        @dev support fault tolerance
     */
    function validateSession(
        bytes32 _newSessionLock)
        private
        returns (bytes32)
    {
        require(_newSessionLock != bytes32(0), "Input session lock is invalid");

        bytes32 oldSessionLock = sha3(_newSessionLock);
        if (sessionLocks[oldSessionLock] == true){
            return oldSessionLock;
        } else {
            return bytes32(0);
        }
    }
    // TODO Combine with validateSession
    function updateSessionLock(
        bytes32 _oldSessionLock,
        bytes32 _newSessionLock)
        private
        returns (bool)
    {
        delete(sessionLocks[_oldSessionLock]);
        sessionLocks[_newSessionLock] = true;

        SessionValidated(_oldSessionLock, _newSessionLock);

        return true;
    }

    // TODO test the bottom top transaction failure
    // TODO truffle test if validate session succeeds and transfer fails
    // TODO update sessionlock irrespective of transfer success/failure
    // TODO evaluate if more methods with explicit call needed - requestRedemption(spendingSecret)
    // TODO redeem - internal method. multisig operation
    function transfer(
        address _to,
        address _amount,
        address _spendingSecret)
        public
        onlyWallet
        returns (bool)
    {
        bytes32 oldSessionLock = validateSession(_spendingSecret);
        require(oldSessionLock != bytes32(0), "Session is not validated");
        // TODO combine this method
        updateSessionLock(oldSessionLock, _spendingSecret);

        require(_amount <= spendingLimit, "Amount should be less than spending limit");
        // TODO transfer call needed

        require(BrandedToken(brandedToken).transfer(_to, _amount));

        return true;
    }

}