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
    /** Max No of times spending session lock should be hashed for verification */
    uint8 private maxFaultToleranceCount;
    /** support for spending limit per session lock */
    mapping (bytes32 /* session lock*/ => uint256 /* spending limit */) public sessionLocks;

    /**
	 *  @notice Contract constructor
	 *
	 *  @param _brandedToken erc20 contract address this user is part of
	 *  @param _coGateway utility chain gateway contract address
	 *  @param _maxFaultToleranceCount Max No of times spending session lock should be hashed for verification
	 *  @param _required No of requirements for multi sig wallet
	 *  @param _wallets array of wallet addresses
	 */
    constructor(
        address _brandedToken,
        address _coGateway,
        uint8 _maxFaultToleranceCount,
        uint8 _required,
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
        maxFaultToleranceCount = _maxFaultToleranceCount;
    }

    /** Public Functions */

    /**
	 *  @notice propose or confirm authorize session method.
	 *
	 *  @param _sessionLock session lock to be authorized.
	 *  @param _spendingLimit max tokens user can spend at a time.
	 *  @param _proposeOrConfirm if true transaction will be proposed otherwise confirmation is done.
	 *
	 *  @return bytes32 transactionId for the request.
	 */
    function proposeOrConfirmAuthorizeSession(
        bytes32 _sessionLock,
        uint256 _spendingLimit,
        bool _proposeOrConfirm)
        public
        onlyWallet
        returns (bytes32 transactionId)
    {
        // TODO change to modifiers
        require(_sessionLock != bytes32(0), "Input sessionLock is invalid!");
        require(sessionLocks[_sessionLock] == bytes32(0), "SessionLock is already authorized");

        transactionId = keccak256(abi.encodePacked(_sessionLock, _spendingLimit, this, "authorizeSession"));

        if (_proposeOrConfirm) {
            require(isAlreadyProposedTransaction(transactionId) == false, "Transaction is already proposed!");
            performProposeTransaction(transactionId);
        } else {
            performConfirmTransaction(transactionId);
            if(isExecuted[transactionId] == 11){
                sessionLocks[_sessionLock] = _spendingLimit;
                emit SessionAuthorized(msg.sender, _sessionLock, _spendingLimit);
            }
        }
        return transactionId;
    }

    /**
	 *  @notice Revoke session method.
	 *
	 *  @param _sessionLock session lock to be revoked.
	 *
	 *  @return bytes32 transactionId for the request.
	 */
    function proposeOrConfirmRevokeSession(
        bytes32 _sessionLock,
        bool _proposeOrConfirm)
        public
        onlyWallet
        returns (bytes32 transactionId)
    {
        // TODO change to modifiers
        require(_sessionLock != bytes32(0), "Input sessionLock is invalid!");
        require(sessionLocks[_sessionLock] != bytes32(0), "Input SessionLock is not authorized!");

        transactionId = keccak256(abi.encodePacked(_sessionLock, this, "revokeSession"));
        if (_proposeOrConfirm) {
            require(isAlreadyProposedTransaction(transactionId) == false, "Transaction is already proposed!");
            performProposeTransaction(transactionId);
        } else {
            performConfirmTransaction(transactionId);
            if(isExecuted[transactionId] == 11) {
                delete sessionLocks[_sessionLock];
                emit SessionRevoked(msg.sender, _sessionLock);
            }
        }
        return transactionId;
    }

    // TODO test the bottom top transaction failure
    /**
	 *  @notice TokenHolder transfer method
	 *
	 *  @param _to address to whom amount needs to transfer
	 *  @param _amount amount to tokens to transfer
	 *  @param _spendingSessionLock session lock which will be spent for this transaction
	 *
	 *  @return bool
	 */
    function transfer(
        address _to,
        uint256 _amount,
        address _spendingSessionLock)
        public
        onlyWallet
        returns (bool /** success */)
    {
        // TODO truffle test if validate session succeeds and transfer fails
        require(_spendingSessionLock != bytes32(0), "Spending session lock is invalid!");
        require(updateSessionLock(_spendingSessionLock));

        uint256 spendingLimit = sessionLocks[_spendingSessionLock];
        require(_amount <= spendingLimit, "Amount should be less than spending limit");
        // TODO check transfer call is success before actual transfer method
        require(BrandedToken(brandedToken).transfer(_to, _amount));

        return true;
    }

    // TODO evaluate if more methods with explicit call needed - requestRedemption(spendingSecret)
    function requestRedemption()
    {

    }

    // TODO redeem - multisig operation
    function redeem()
    {

    }

    /** Private Functions */

    /**
	 *  @notice Validate and update session lock
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
        bytes32 oldSessionLock;

        for(uint8 i=0; i<maxFaultToleranceCount; i++) {
            oldSessionLock = keccak256(abi.encodePacked(_newSessionLock));
            /** if entry exists in sessionLocks mapping */
            if (sessionLocks[oldSessionLock] != uint(0)) {
                delete(sessionLocks[oldSessionLock]);
                sessionLocks[_newSessionLock] = true;

                emit SessionLockUpdated(oldSessionLock, _newSessionLock);
                return true;
            }
        }
        return false;
    }

}