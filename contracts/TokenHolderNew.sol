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

    // TODO EK in place of ephemeralKey
    event SessionAuthorized(
        address wallet,
        bytes32 ephemeralKey,
        uint256 spendingLimit
    );

    // TODO EK in place of ephemeralKey
    event SessionRevoked(
        address wallet,
        bytes32 ephemeralKey
    );
    /** Event emitted whenever newSessionLock is consumed. */
    // TODO We don't need
    event SessionLockUpdated(
        bytes32 oldSessionLock,
        bytes32 newSessionLock,
        uint256 spendingLimit
    );
    /** Event emitted on increase allowance and decrease allowance. */
    event AllowanceUpdated(
        address spender,
        uint256 existingAllowanceAmount,
        uint256 updatedAllowanceAmount
    );

    /* Structs */

    /**
      isPresent identifies if session lock is present in sessionLocks
      mapping or not.
     */
    // TODO Rename below struct
    struct EphemeralKeyData {
        uint256 spendingLimit;
        bool isPresent;
    }


    /* Storage */

    address public brandedToken;
    /** Co Gateway contract address for redeem functionality. */
    address public coGateway;
    // TODO Rename mapping variable names
    /** Stores spending limit per ephemeral key. */
    mapping (bytes32 /* Ephemeral Key */ => EphemeralKeyData /* struct */) public ephemeralKeys;
    /** Token rules contract address read from BT contract. */
    address private tokenRules;
    // TODO No need of below variable
    /** Max No of times spending session lock should be hashed for verification. */
    uint8 private maxFaultToleranceCount;


    /* Modifiers */

    /**
     * @notice onlyTokenRules modifier.
     *
     * @dev msg.sender should be token rules contract address.
     */
    // TODO Check if below modifier is needed in functions
    modifier onlyTokenRules() {
        require(
            msg.sender == tokenRules,
            "msg.sender should be token rules contract address!"
        );
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
    // TODO _maxFaultToleranceCount not needed
    constructor(
        address _brandedToken,
        address _coGateway,
        uint8 _maxFaultToleranceCount,
        uint8 _required,
        address[] _wallets
    )
        public
        MultiSigWallet(_wallets, _required)
    {
        require(
            _brandedToken != address(0),
            "Branded token contract address is 0"
        );
        require(
            _coGateway != address(0),
            "Co gateway contract address is 0"
        );

        brandedToken = _brandedToken;
        coGateway = _coGateway;
        // Needed for onlyTokenRules contract validation
        tokenRules = BrandedToken(brandedToken).tokenRules();
        maxFaultToleranceCount = _maxFaultToleranceCount;
    }


    /* Public Functions */

    /**
     * @notice propose or confirm authorize session method.
     *
     * @dev 0 spendingLimit is a valid transfer amount.
     *
     * @param _ephemeralKey session lock to be authorized.
     * @param _spendingLimit max tokens user can spend at a time.
     * @param _proposeOrConfirm if true transaction will be proposed
     *        otherwise confirmation is done.
     *
     * @return transactionId_ for the request.
     */
    // TODO update below method with introduction of EK and remove _ephemeralKey
    function proposeOrConfirmAuthorizeSession(
        bytes32 _ephemeralKey,
        uint256 _spendingLimit,
        bool _proposeOrConfirm
    )
        public
        onlyWallet
        returns (bytes32 transactionId_)
    {
        require(
            _ephemeralKey != bytes32(0),
            "Ephemeral Key is invalid!"
        );
        require(
            !ephemeralKeys[_ephemeralKey].isPresent,
            "Ephemeral Key is already authorized"
        );

        transactionId_ = keccak256(abi.encodePacked(
                _ephemeralKey,
                _spendingLimit,
                this,
                "authorizeSession"
        ));
        if (_proposeOrConfirm) {
            require(
                !isAlreadyProposedTransaction(transactionId_),
                "Transaction is already proposed!"
            );
            performProposeTransaction(transactionId_);
        } else {
            performConfirmTransaction(transactionId_);
            if(isTransactionExecuted(transactionId_)) {
                setEphemeralKeyData(_ephemeralKey, _spendingLimit);

                emit SessionAuthorized(msg.sender, _ephemeralKey, _spendingLimit);
            }
        }

        return transactionId_;
    }

    /**
     * @notice Revoke session method.
     *
     * @param _ephemeralKey session lock to be revoked.
     * @param _proposeOrConfirm if true transaction will be proposed otherwise
     *        confirmation is done.
     *
     * @return transactionId_ for the request.
     */
    // TODO update below method with introduction of EK and remove _ephemeralKey
    function proposeOrConfirmRevokeSession(
        bytes32 _ephemeralKey,
        bool _proposeOrConfirm
    )
        public
        onlyWallet
        returns (bytes32 transactionId_)
    {
        require(
            _ephemeralKey != bytes32(0),
            "Session lock is invalid!"
        );
        require(
            ephemeralKeys[_ephemeralKey].isPresent,
            "Input ephemeralKey is not authorized!"
        );

        transactionId_ = keccak256(abi.encodePacked(
                _ephemeralKey,
                this,
                "revokeSession"
        ));
        if (_proposeOrConfirm) {
            require(
                !isAlreadyProposedTransaction(transactionId_),
                "Transaction is already proposed!"
            );
            performProposeTransaction(transactionId_);
        } else {
            performConfirmTransaction(transactionId_);
            if(isTransactionExecuted(transactionId_)) {
                // Remove session lock from the mapping
                delete ephemeralKeys[_ephemeralKey];
                emit SessionRevoked(msg.sender, _ephemeralKey);
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
     * @return transactionId_ for the request.
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
            require(
                !isAlreadyProposedTransaction(transactionId_),
                "Transaction is already proposed!"
            );
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
     * @notice TokenHolder transfer method.
     *
     * @param _to address to whom BT amount needs to transfer.
     * @param _amount amount of tokens to transfer.
     * @param _spendingEphemeralKey session lock which will be spent for
     *        this transaction.
     *
     * @return the success/failure status of transfer method
     */
    // TODO remove _spendingEphemeralKey and introduce executable messages
    function transfer(
        address _to,
        uint256 _amount,
        bytes32 _spendingEphemeralKey
    )
        public
        onlyTokenRules
        returns (bool /** success */)
    {
        require(
            _spendingEphemeralKey != bytes32(0),
            "Ephemeral Key is invalid!"
        );
        require(updateEphemeralKey(_spendingEphemeralKey));

        uint256 spendingLimit = ephemeralKeys[_spendingEphemeralKey].spendingLimit;
        require(
            _amount <= spendingLimit,
            "Transfer amount should be less or equal to spending limit"
        );

        require(BrandedToken(brandedToken).transfer(_to, _amount));

        return true;
    }

    /**
     * @notice TokenHolder requestRedemption method.
     *
     * @param _amount amount of tokens to transfer.
     * @param _fee Fee to be paid.
     * @param _beneficiary address to whom amount needs to transfer.
     * @param _spendingSessionLock session lock which will be spent
     *        for this transaction.
     *
     * @return the success/failure status of transfer method
     */
    // TODO remove _spendingSessionLock and introduce executable messages
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
        require(
            _spendingSessionLock != bytes32(0),
            "Session lock is invalid!"
        );
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
     * @return final updated allowance which is approved.
     */
    // TODO remove _spendingSessionLock and introduce executable messages
    function increaseAllowance(
        address _spender,
        uint256 _amount,
        bytes32 _spendingSessionLock
    )
        public
        onlyTokenRules
        returns (uint256 _updatedAllowanceAmount)
    {
        require(
            _spendingSessionLock != bytes32(0),
            "Session lock is invalid!"
        );
        require(updateSessionLock(_spendingSessionLock));

        uint256 existingAllowanceAmount = BrandedToken(brandedToken).allowance(this, _spender);
        _updatedAllowanceAmount = existingAllowanceAmount.add(_amount);
        require(BrandedToken(brandedToken).approve(_spender, _updatedAllowanceAmount));

        emit AllowanceUpdated(
            _spender,
            existingAllowanceAmount,
            _updatedAllowanceAmount
        );

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
     * @return final updated allowance which is approved.
     */
    // TODO remove _spendingSessionLock and introduce executable messages
    function decreaseAllowance(
        address _spender,
        uint256 _amount,
        bytes32 _spendingSessionLock
    )
        public
        onlyTokenRules
        returns (uint256 _updatedAllowanceAmount)
    {
        require(
            _spendingSessionLock != bytes32(0),
            "Session lock is invalid!"
        );
        require(updateSessionLock(_spendingSessionLock));

        uint256 existingAllowanceAmount = BrandedToken(brandedToken).allowance(this, _spender);
        _updatedAllowanceAmount = existingAllowanceAmount.sub(_amount);
        require(BrandedToken(brandedToken).approve(_spender, _updatedAllowanceAmount));

        emit AllowanceUpdated(
            _spender,
            existingAllowanceAmount,
            _updatedAllowanceAmount
        );

        return _updatedAllowanceAmount;
    }


    /* Private Functions */

    /**
     * @notice Validate and update session lock.
     *
     * @param _newSessionLock session lock to be verified and updated.
     *
     * @return success if _newSessionLock is consumed.
     */
    // TODO remove _newSessionLock and verify signed messages
    // TODO ECRecover logic needed here
    function retrieveAddress(
        bytes32 prefixedMsgHash,
        uint8 v,
        bytes32 r,
        bytes32 s
    )
        private
        returns (bool /* success */)
    {
        address publicKey = ecrecover(prefixedMsgHash, v, r, s);
        require(publicKey == ephemeralKey);
    }

    /**
     * @notice Validate and update session lock.
     *
     * @param _newSessionLock session lock to be verified and updated.
     *
     * @return success if _newSessionLock is consumed.
     */
    // TODO remove _newSessionLock and verify signed messages
    // TODO Remove after ECRecover method needed
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
            /** if entry exists in ephemeralKeys mapping */
            if (ephemeralKeys[oldSessionLock].isPresent) {
                uint256 spendingLimit = ephemeralKeys[oldSessionLock].spendingLimit;
                setEphemeralKeyData(_newSessionLock, spendingLimit);
                delete(ephemeralKeys[oldSessionLock]);

                emit SessionLockUpdated(
                    oldSessionLock,
                    _newSessionLock,
                    spendingLimit
                );

                return true;
            }
        }
        // False is error condition in case _newSessionLock is not found in
        // ephemeralKeys mapping.
        return false;
    }

    /**
     * @notice private method to update ephemeralKeys mapping.
     *
     * @param _ephemeralKey Ephemeral Key which need to be added in ephemeralKeys mapping.
     * @param _spendingLimit spending limit to be updated.
     */
    // TODO check if we need below
    function setEphemeralKeyData(
        bytes32 _ephemeralKey,
        uint256 _spendingLimit
    )
        private
    {
        ephemeralKeys[_ephemeralKey].spendingLimit = _spendingLimit;
        ephemeralKeys[_ephemeralKey].isPresent = true;
    }

}