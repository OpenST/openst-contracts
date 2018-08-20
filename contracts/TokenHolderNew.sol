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
        address ephemeralKey,
        uint256 spendingLimit
    );

    event SessionRevoked(
        address wallet,
        address ephemeralKey
    );

    /* Structs */

    /**
      isPresent identifies if Ephemeral Key is present in ephemeralKeys
      mapping or not.
     */
    struct EphemeralKeyData {
        uint256 spendingLimit;
        uint256 nonce;
        bool isPresent;
    }


    /* Storage */

    address public brandedToken;
    /** Co Gateway contract address for redeem functionality. */
    address public coGateway;
    /** Stores spending limit per ephemeral key. */
    mapping (address /* Ephemeral Key */ => EphemeralKeyData /* struct */) public ephemeralKeys;
    /** Token rules contract address read from BT contract. */
    address private tokenRules;


    /**
     * @notice Contract constructor.
     *
     * @param _brandedToken erc20 contract address this user is part of.
     * @param _coGateway utility chain gateway contract address.
     * @param _required No of requirements for multi sig wallet.
     * @param _wallets array of wallet addresses.
     */
    constructor(
        address _brandedToken,
        address _coGateway,
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
    function proposeOrConfirmAuthorizeSession(
        address _ephemeralKey,
        uint256 _spendingLimit,
        bool _proposeOrConfirm
    )
        public
        onlyWallet
        returns (bytes32 transactionId_)
    {
        require(
            _ephemeralKey != address(0),
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
     * @param _ephemeralKey Ephemeral Key to be revoked.
     * @param _proposeOrConfirm if true transaction will be proposed otherwise
     *        confirmation is done.
     *
     * @return transactionId_ for the request.
     */
    function proposeOrConfirmRevokeSession(
        address _ephemeralKey,
        bool _proposeOrConfirm
    )
        public
        onlyWallet
        returns (bytes32 transactionId_)
    {
        require(
            _ephemeralKey != address(0),
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
                // Remove Ephemeral Key from the mapping
                delete ephemeralKeys[_ephemeralKey];
                emit SessionRevoked(msg.sender, _ephemeralKey);
            }
        }

        return transactionId_;
    }

    /**
     * @notice redeem is a multisigwallet operation.
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


    /* Private Functions */

    /**
     * @notice Retrieve the public key of the signer.
     *
     * @param prefixedMsgHash Message which was signed.
     * @param v
     * @return success if _newSessionLock is consumed.
     */
    // TODO get the callPrefix from data
    function validateAndExecuteEphemeralKey(
        bytes32 _msgHash,
        bytes _signature,
        bytes data,
        address to,
        bytes callPrefix
    )
        private
        returns (bool successStatus/* success */)
    {
        bytes32 prefixedMsgHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", msgHash));
        address retrievedKey = recover(prefixedMsgHash, _signature);
        if(ephemeralKeys[retrievedKey].isPresent){
            bytes32 constructedMsgHash = keccak256(abi.encodePacked(0, data, ephemeralKeys[retrievedKey].nonce, callPrefix, "CALL", ""));
            if((retrievedKey == ephemeralKey) && (constructedMsgHash == _msgHash)){
                // executing the message
                assembly {
                    successStatus := call(5000, to, value, add(data, 0x20), mload(data), 0, 0)
                }
            }
        }
        return successStatus;
    }



    /**
     * @dev Recover signer address from a message by using their signature
     * @param _hash bytes32 message, the hash is the signed message. What is recovered is the signer address.
     * @param _signature bytes signature, the signature is generated using web3.eth.sign()
     */
    function recover(
        bytes32 _hash,
        bytes _signature
    )
        private
        pure
        returns (address)
    {
        bytes32 r;
        bytes32 s;
        uint8 v;

        // Check the signature length
        if (_signature.length != 65) {
            return (address(0));
        }

        // Divide the signature in r, s and v variables
        // ecrecover takes the signature parameters, and the only way to get them
        // currently is to use assembly.
        // solium-disable-next-line security/no-inline-assembly
        assembly {
            r := mload(add(_signature, 32))
            s := mload(add(_signature, 64))
            v := byte(0, mload(add(_signature, 96)))
        }

        // Version of signature should be 27 or 28, but 0 and 1 are also possible versions
        if (v < 27) {
            v += 27;
        }

        // If the version is correct return the signer address
        if (v != 27 && v != 28) {
            return (address(0));
        } else {
            return ecrecover(_hash, v, r, s);
        }
    }

    /**
     * @notice private method to update ephemeralKeys mapping.
     *
     * @param _ephemeralKey Ephemeral Key which need to be added in ephemeralKeys mapping.
     * @param _spendingLimit spending limit to be updated.
     */
    function setEphemeralKeyData(
        address _ephemeralKey,
        uint256 _spendingLimit
    )
        private
    {
        ephemeralKeys[_ephemeralKey].spendingLimit = _spendingLimit;
        ephemeralKeys[_ephemeralKey].isPresent = true;
        ephemeralKeys[_ephemeralKey].nonce = 0;
    }

}