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

    event SessionAuthorized(address wallet, bytes32 sessionLock, uint256 spendingLimit);

    event SessionRevoked(address wallet, bytes32 sessionLock);

    event SessionLockUpdated(bytes32 oldSessionLock, bytes32 newSessionLock);

    /** Storage */

    address public brandedToken;
    /** Co Gateway contract address for redeem functionality */
    address public coGateway;

    address private tokenRules;
    /** support for spending limit per session lock */
    mapping (bytes32 /* session lock*/ => uint256 /* spending limit */) public sessionLocks;

    /**
	 *  @notice Contract constructor
	 *
	 *  @param _brandedToken erc20 contract address this user is part of
	 *  @param _coGateway utility chain gateway contract address
	 *  @param _wallets wallet addresses minimum 2 is needed
	 */
    constructor(
        address _brandedToken,
        address _coGateway,
        uint256 _required,
        address[] _wallets)
        public
        MultiSigWallet(_wallets, _required)
    {
        require(_brandedToken != address(0), "Branded token contract address is 0");
        require(_coGateway != address(0), "Co gateway contract address is 0");

        brandedToken = _brandedToken;
        coGateway = _coGateway;
        /** Needed for onlyTokenRules validation */
        tokenRules = BrandedToken(brandedToken).tokenRules;
    }

    /**
	 *  @notice propose or confirm authorize session method.
	 *
	 *  @param _sessionLock session lock to be authorized.
	 *  @param _spendingLimit max tokens user can spend at a time.
	 *  @param proposeOrConfirm if true transaction will be proposed otherwise confirmation is done.
	 *
	 *  @return bytes32 transactionId for the request.
	 */
    function proposeOrConfirmAuthorizeSession(
        bytes32 _sessionLock,
        uint256 _spendingLimit,
        bool proposeOrConfirm)
        public
        walletDoesNotExist(msg.sender)
        notNull(msg.sender)
        returns(bytes32 transactionId)
    {
        require(_sessionLock != bytes32(0), "Input sessionLock is invalid!");
        require(sessionLocks[_sessionLock] == bytes32(0), "SessionLock is already authorized");

        transactionId = keccak256(abi.encodePacked(_sessionLock, _spendingLimit, this, "authorizeSession"));

        if(proposeOrConfirm){
            require(isAlreadyProposedTransaction(transactionId) == false, "Transaction is already proposed!");
            performProposeTransaction(transactionId);
        } else {
            performConfirmTransaction(transactionId);
            if(isExecuted[transactionId] == 11){
                require(_sessionLock != bytes32(0), "Input sessionLock is invalid!");
                require(sessionLocks[_sessionLock] == bytes32(0), "SessionLock is already authorized");

                sessionLocks[_sessionLock] = _spendingLimit;
                emit SessionAuthorized(msg.sender, _sessionLock, _spendingLimit);
            }
        }
        return transactionId;
    }

    /**
	 *  @notice Revoke session method
	 *
	 *  @param _sessionLock session lock to be revoked
	 *
	 *  @return bool
	 */
    function revokeSession(
        bytes32 _sessionLock)
        internal
        walletDoesNotExist(msg.sender)
        notNull(msg.sender)
        returns(bool /* success */)
    {
        require(_sessionLock != bytes32(0), "Input SessionLock is invalid!");
        require(sessionLocks[_sessionLock] != bytes32(0), "Input SessionLock is not authorized");

        delete sessionLocks[_sessionLock];

        emit SessionRevoked(msg.sender, _sessionLock);

        return true;
    }

    /**
	 *  @notice Validate and update session lcok
	 *
	 *  @param _newSessionLock session lock to be verified and updated
	 *
	 *  @return bool
	 */
    function updateSessionLock(
        bytes32 _newSessionLock)
        private
        returns (bool /* success */)
    {
        bytes32 oldSessionLock = keccak256(abi.encodePacked(_newSessionLock));
        if (sessionLocks[oldSessionLock] == true){
            delete(sessionLocks[oldSessionLock]);
            sessionLocks[_newSessionLock] = true;

            emit SessionLockUpdated(oldSessionLock, _newSessionLock);
            return true;
        } else {
            return false;
        }
    }

    // TODO test the bottom top transaction failure
    // TODO truffle test if validate session succeeds and transfer fails
    // TODO update sessionlock irrespective of transfer success/failure
    // TODO evaluate if more methods with explicit call needed - requestRedemption(spendingSecret)
    // TODO redeem - internal method. multisig operation
    function transfer(
        address _to,
        address _amount,
        address _spendingSessionLock)
        public
        onlyWallet
        returns (bool)
    {
        require(_spendingSessionLock != bytes32(0), "Spending session lock is invalid");
        require(updateSessionLock(_spendingSessionLock));

        require(_amount <= spendingLimit, "Amount should be less than spending limit");
        // TODO transfer call needed
        require(BrandedToken(brandedToken).transfer(_to, _amount));

        return true;
    }

}