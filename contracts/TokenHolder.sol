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

import "./SafeMath.sol";
import "./BrandedToken.sol";
import "./MultiSigWallet.sol";


/**
 * @title TokenHolder contract.
 *
 * @notice Implements properties and actions performed by an user. It enables
 *         scalable key management solutions for mainstream apps.
 *
 */
contract TokenHolder is MultiSigWallet {

    /* Usings */

    using SafeMath for uint256;


    /* Events */

    event SessionAuthorized(
        address wallet,
        bytes32 sessionLock,
        uint256 spendingLimit
    );

    event SessionRevoked(
        address wallet,
        bytes32 sessionLock
    );
    /** Event emitted whenever newSessionLock is consumed */
    event SessionLockUpdated(
        bytes32 oldSessionLock,
        bytes32 newSessionLock,
        uint256 spendingLimit
    );
    /** Event emitted on increase allowance and decrease allowance */
    event AllowanceUpdated(
        address spender,
        uint256 existingAllowanceAmount,
        uint256 updatedAllowanceAmount
    );

    /* Structs */

    /**
        isPresent identifies if session lock is present in sessionLocks
        mapping or not
     */
    struct SessionLockData {
        uint256 spendingLimit;
        bool isPresent;
    }


    /* Storage */

    address public brandedToken;
    /** Co Gateway contract address for redeem functionality */
    address public coGateway;
    /** Stores spending limit per session lock */
    mapping (bytes32 /* session lock */ => SessionLockData /* spending limit */) public sessionLocks;
    /** Token rules contract address read from BT contract */
    address private tokenRules;
    /** Max No of times spending session lock should be hashed for verification */
    uint8 private maxFaultToleranceCount;


    /* Modifiers */

    /**
     * @notice onlyTokenRules modifier.
     *
     * @dev msg.sender should be token rules contract address.
     */
    modifier onlyTokenRules() {
        require(msg.sender == tokenRules, "msg.sender should be token rules contract address!");
        _;
    }

    /**
     * @notice Contract constructor.
     *
     * @param _brandedToken erc20 contract address this user is part of.
     * @param _coGateway utility chain gateway contract address.
     * @param _maxFaultToleranceCount Max No of times spending session lock
     *        should be hashed for verification.
     * @param _required No of requirements for multi sig wallet.
     * @param _wallets array of wallet addresses.
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
        tokenRules = BrandedToken(brandedToken).tokenRules();
        maxFaultToleranceCount = _maxFaultToleranceCount;
    }


    /* Public Functions */

    /**
     * @notice propose or confirm authorize session method.
     *
     * @dev 0 spendingLimit is a valid transfer amount.
     *
     * @param _sessionLock session lock to be authorized.
     * @param _spendingLimit max tokens user can spend at a time.
     * @param _proposeOrConfirm if true transaction will be proposed
     *        otherwise confirmation is done.
     *
     * @return bytes32 transactionId_ for the request.
     */
    function proposeOrConfirmAuthorizeSession(
        bytes32 _sessionLock,
        uint256 _spendingLimit,
        bool _proposeOrConfirm
    )
        public
        onlyWallet
        returns (bytes32 transactionId_)
    {
        require(_sessionLock != bytes32(0), "Session lock is invalid!");
        require(!sessionLocks[_sessionLock].isPresent, "SessionLock is already authorized");

        transactionId_ = keccak256(abi.encodePacked(
                _sessionLock,
                _spendingLimit,
                this,
                "authorizeSession"
        ));
        if (_proposeOrConfirm) {
            require(!isAlreadyProposedTransaction(transactionId_), "Transaction is already proposed!");
            performProposeTransaction(transactionId_);
        } else {
            performConfirmTransaction(transactionId_);
            if(isTransactionExecuted(transactionId_)) {
                setSessionLockData(_sessionLock, _spendingLimit);

                emit SessionAuthorized(msg.sender, _sessionLock, _spendingLimit);
            }
        }

        return transactionId_;
    }

    /**
     * @notice Revoke session method.
     *
     * @param _sessionLock session lock to be revoked.
     * @param _proposeOrConfirm if true transaction will be proposed otherwise
     *        confirmation is done.
     *
     * @return bytes32 transactionId_ for the request.
     */
    function proposeOrConfirmRevokeSession(
        bytes32 _sessionLock,
        bool _proposeOrConfirm
    )
        public
        onlyWallet
        returns (bytes32 transactionId_)
    {
        require(_sessionLock != bytes32(0), "Session lock is invalid!");
        require(sessionLocks[_sessionLock].isPresent, "Input SessionLock is not authorized!");

        transactionId_ = keccak256(abi.encodePacked(
                _sessionLock,
                this,
                "revokeSession"
        ));
        if (_proposeOrConfirm) {
            require(!isAlreadyProposedTransaction(transactionId_), "Transaction is already proposed!");
            performProposeTransaction(transactionId_);
        } else {
            performConfirmTransaction(transactionId_);
            if(isTransactionExecuted(transactionId_)) {
                // Remove session lock from the mapping
                delete sessionLocks[_sessionLock];
                emit SessionRevoked(msg.sender, _sessionLock);
            }
        }

        return transactionId_;
    }

    /**
     * @notice redeem multisigwallet operation.
     *
     * @param _amount Amount to redeem.
     * @param _nonce incremental nonce.
     * @param _beneficiary beneficiary address who will get redeemed amount.
     * @param _hashLock hash lock. Secret will be used during redeem process
     *        to unlock the secret.
     * @param _proposeOrConfirm if true transaction will be proposed
     *        otherwise confirmation is done.
     *
     * @return bytes32 transactionId_ for the request.
     */
    function proposeOrConfirmReedem(
        bytes32 _amount,
        uint256 _nonce,
        address _beneficiary,
        bytes32 _hashLock,
        bool _proposeOrConfirm
    )
        public
        onlyWallet
        returns (bytes32 transactionId_)
    {
        transactionId_ = keccak256(abi.encodePacked(
                _amount,
                _nonce,
                _beneficiary,
                _hashLock,
                this,
                "redeem"
        ));
        if (_proposeOrConfirm) {
            require(!isAlreadyProposedTransaction(transactionId_), "Transaction is already proposed!");
            performProposeTransaction(transactionId_);
        } else {
            performConfirmTransaction(transactionId_);
            if(isTransactionExecuted(transactionId_)) {
                // TODO Redeem Integration with CoGateway Interface
            }
        }

        return transactionId_;
    }

    /**
     * @notice TokenHolder transfer method
     *
     * @param _to address to whom BT amount needs to transfer.
     * @param _amount amount of tokens to transfer.
     * @param _spendingSessionLock session lock which will be spent for
     *        this transaction.
     *
     * @return bool
     */
    function transfer(
        address _to,
        uint256 _amount,
        bytes32 _spendingSessionLock
    )
        public
        onlyTokenRules
        returns (bool /** success */)
    {
        require(_spendingSessionLock != bytes32(0), "Session lock is invalid!");
        require(updateSessionLock(_spendingSessionLock));

        uint256 spendingLimit = sessionLocks[_spendingSessionLock].spendingLimit;
        require(_amount <= spendingLimit, "Transfer amount should be less or equal to spending limit");

        require(BrandedToken(brandedToken).transfer(_to, _amount));

        return true;
    }

    /**
     * @notice TokenHolder requestRedemption method
     *
     * @param _amount amount of tokens to transfer.
     * @param _fee Fee to be paid.
     * @param _beneficiary address to whom amount needs to transfer.
     * @param _spendingSessionLock session lock which will be spent
     *        for this transaction.
     *
     * @return bool
     */
    function requestRedemption(
        uint256 _amount,
        uint256 _fee,
        address _beneficiary,
        bytes32 _spendingSessionLock
    )
        public
        onlyTokenRules
        returns (bool /** success */)
    {
        require(_spendingSessionLock != bytes32(0), "Session lock is invalid!");
        require(updateSessionLock(_spendingSessionLock));

        // TODO Integration with CoGateway Interface

        return true;
    }

    /**
     * @notice TokenHolder increaseAllowance method.
     *
     * @dev Below method is needed so that BrandedToken.transferFrom can be called.
     *      Amount can be approved to an escrow contract address for
     *      BT.transferFrom to work.
     *
     * @param _spender address to whom allowance needs to increase.
     * @param _amount amount of tokens to transfer.
     * @param _spendingSessionLock session lock which will be spent for
     *        this transaction.
     *
     * @return uint256 final allowance which is approved.
     */
    function increaseAllowance(
        address _spender,
        uint256 _amount,
        bytes32 _spendingSessionLock
    )
        public
        onlyTokenRules
        returns (uint256 _updatedAllowanceAmount)
    {
        require(_spendingSessionLock != bytes32(0), "Session lock is invalid!");
        require(updateSessionLock(_spendingSessionLock));

        uint256 existingAllowanceAmount = BrandedToken(brandedToken).allowance(this, _spender);
        _updatedAllowanceAmount = existingAllowanceAmount.add(_amount);
        require(BrandedToken(brandedToken).approve(_spender, _updatedAllowanceAmount));

        emit AllowanceUpdated(_spender, existingAllowanceAmount, _updatedAllowanceAmount);

        return _updatedAllowanceAmount;
    }

    /**
     * @notice TokenHolder decreaseAllowance method.
     *
     * @dev Below method is needed so that BrandedToken.transferFrom can be called.
     *      Amount can be approved to an escrow contract address for
     *      BT.transferFrom to work.
     *
     * @param _spender address to whom allowance needs to decrease.
     * @param _amount amount of tokens to transfer.
     * @param _spendingSessionLock session lock which will be spent
     *        for this transaction.
     *
     * @return uint256 final allowance which is approved.
     */
    function decreaseAllowance(
        address _spender,
        uint256 _amount,
        bytes32 _spendingSessionLock
    )
        public
        onlyTokenRules
        returns (uint256 _updatedAllowanceAmount)
    {
        require(_spendingSessionLock != bytes32(0), "Session lock is invalid!");
        require(updateSessionLock(_spendingSessionLock));

        uint256 existingAllowanceAmount = BrandedToken(brandedToken).allowance(this, _spender);
        _updatedAllowanceAmount = existingAllowanceAmount.sub(_amount);
        require(BrandedToken(brandedToken).approve(_spender, _updatedAllowanceAmount));

        emit AllowanceUpdated(_spender, existingAllowanceAmount, _updatedAllowanceAmount);

        return _updatedAllowanceAmount;
    }


    /* Private Functions */

    /**
     * @notice Validate and update session lock.
     *
     * @param _newSessionLock session lock to be verified and updated.
     *
     * @return bool success if _newSessionLock is consumed.
     */
    function updateSessionLock(
        bytes32 _newSessionLock
    )
        private
        returns (bool /* success */)
    {
        bytes32 oldSessionLock;

        for(uint8 i = 0; i < maxFaultToleranceCount; i++) {
            oldSessionLock = keccak256(abi.encodePacked(
                    _newSessionLock
            ));
            /** if entry exists in sessionLocks mapping */
            if (sessionLocks[oldSessionLock].isPresent) {
                uint256 spendingLimit = sessionLocks[oldSessionLock].spendingLimit;
                setSessionLockData(_newSessionLock, spendingLimit);
                delete(sessionLocks[oldSessionLock]);

                emit SessionLockUpdated(
                    oldSessionLock,
                    _newSessionLock,
                    spendingLimit
                );

                return true;
            }
        }
        // False is error condition in case _newSessionLock is not found in
        // sessionLocks mapping.
        return false;
    }

    /**
     * @notice private method to update SessionLockData.
     *
     * @param _sessionLock session lock which need to be added in sessionLocks mapping.
     * @param _spendingLimit spending limit to be updated.
     */
    function setSessionLockData(
        bytes32 _sessionLock,
        uint256 _spendingLimit
    )
        private
    {
        sessionLocks[_sessionLock].spendingLimit = _spendingLimit;
        sessionLocks[_sessionLock].isPresent = true;
    }

}