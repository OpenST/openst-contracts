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

    mapping (bytes32 => bool) public sessionLocks;

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
        uint256 _spendingLimit,
        address[] _wallets)
        public
    {
        require(_brandedToken != address(0), "branded token contract address is 0");
        require(_coGateway != address(0), "Co gateway contract address is 0");
        require(_wallets.length >= 2, "Minimum two wallets are needed");

        spendingLimit = _spendingLimit;
        brandedToken = _brandedToken;
        coGateway = _coGateway;
    }

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
        require(sessionLocks[_sessionLock] == bytes32(0), "sessionLock is already authorized");

        sessionLocks[_sessionLock] = true;
        spendingLimit = _spendingLimit;

        emit SessionAuthorized(_sessionLock, _spendingLimit);

        return true;
    }

    function revokeSession(
        bytes32 _sessionLock)
        onlyMultiSigWallet
        walletDoesNotExist(msg.sender)
        notNull(msg.sender)
        public
        returns(bool)
    {
        require(_sessionLock != bytes32(0), "sessionLock is 0 ");
        require(sessionLocks[_sessionLock] != bytes32(0), "sessionLock is not authorized");

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
        internal
        onlyWallet
        returns (bytes32)
    {
        require(_newSessionLock != bytes32(0), "Input secret is 0");

        bytes32 oldSessionLock = sha3(_newSessionLock);
        if (sessionLocks[oldSessionLock] == true){
            return oldSessionLock;
        } else {
            return bytes32(0);
        }
    }

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

    function transfer(
        address _to,
        address _amount,
        address _spendingSecret)
        public
        onlyWallet
        returns (bool)
    {
        bytes32 oldSessionLock = validateSession(_spendingSecret);
        require(oldSessionLock != bytes32(0), "session not validated");

        require(_amount <= spendingLimit, "Amount should be less than spending limit");
        BrandedToken(brandedToken).transfer(_to, _amount);

        updateSessionLock(oldSessionLock, _spendingSecret);

        return true;
    }

}