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
// TODO remove and or in method parameter names.
contract TokenHolder is MultiSigWallet {

    /* Usings */

    using SafeMath for uint256;


    /* Events */

    event SessionAuthorized(
        bytes32 _transactionId,
        address _ephemeralKey,
        uint256 _spendingLimit,
        uint256 _expirationHeight
    );

    event SessionRevoked(
        bytes32 _transactionId,
        address _ephemeralKey
    );

    /* Structs */

    /** expirationHeight is block at which EphemeralKey expires. */
    struct EphemeralKeyData {
        uint256 spendingLimit;
        uint256 nonce;
        uint256 expirationHeight;
    }


    /* Storage */

    address public brandedToken;
    /** Co Gateway contract address for redeem functionality. */
    address public coGateway;
    /** Stores spending limit per ephemeral key. */
    // TODO should not Cleanup expired ephemeralKey
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
        address _brandedToken, // TODO can we get this from coGateway
        // TODO fetch from _brandedToken
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
     * @notice Authorize session method.
     *
     * @dev 0 spendingLimit is not a valid amount.
     *
     * @param _ephemeralKey session lock to be authorized.
     * @param _spendingLimit max tokens user can spend at a time.
     * @param _expirationHeight expiration height of Ephemeral Key.
     *
     * @return transactionId_ for the request.
     */
    function authorizeSession(
        address _ephemeralKey,
        uint256 _spendingLimit,
        uint256 _expirationHeight
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
            (ephemeralKeys[_ephemeralKey].spendingLimit == 0),
            "Input ephemeralKey should not be authorized!"
        );
        require(
            _spendingLimit != uint256(0),
            "0 spending limit is not allowed!"
        );
        require(
            _expirationHeight != uint256(0),
            "0 expiration Height is not allowed!"
        );
        require(
            _expirationHeight > block.number,
            "Expiration Height should be greater than current block number!"
        );

        transactionId_ = keccak256(abi.encodePacked(
                _ephemeralKey,
                _spendingLimit,
                _expirationHeight,
                this,
                "authorizeSession"
        ));

        proposeTransaction(transactionId_);
        performConfirmTransaction(transactionId_);
        // Add wallet code
        if(isTransactionExecuted(transactionId_)) {
            setEphemeralKeyData(_ephemeralKey, _spendingLimit, _expirationHeight);
            emit SessionAuthorized(
                transactionId_,
                _ephemeralKey,
                _spendingLimit,
                _expirationHeight
            );
        }

        return transactionId_;
    }

    /**
     * @notice Revoke session method.
     *
     * @param _ephemeralKey Ephemeral Key to be revoked.
     *
     * @return transactionId_ for the request.
     */
    function revokeSession(
        address _ephemeralKey
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
            ephemeralKeys[_ephemeralKey].spendingLimit > 0,
            "Input ephemeralKey is not authorized!"
        );

        transactionId_ = keccak256(abi.encodePacked(
                _ephemeralKey,
                this,
                "revokeSession"
        ));

        proposeTransaction(transactionId_);
        confirmTransaction(transactionId_);
        if(isTransactionExecuted(transactionId_)) {
            // Remove Ephemeral Key from the mapping
            delete ephemeralKeys[_ephemeralKey];
            emit SessionRevoked(transactionId_, _ephemeralKey);
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
     *
     * @return transactionId_ for the request.
     */
    function reedem(
        bytes32 _amount,
        uint256 _nonce,
        address _beneficiary,
        bytes32 _hashLock
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

        proposeTransaction(transactionId_);
        confirmTransaction(transactionId_);
        if(isTransactionExecuted(transactionId_)) {
            // TODO Redeem Integration with CoGateway Interface
        }

        return transactionId_;
    }

    /**
     * @notice Validate and execute signed messages.
     *
     * @dev nonce will be consumed irrespective of assembly call output.
     *
     * @param _inputMessageHash Message which was signed.
     * @param _signature signed message.
     * @param _data the bytecode to be executed.
     * @param _to the target contract the transaction will be executed upon. e.g. BT in case of transferFrom.
     * @param _gasLimit Estimated gas Limit from outside.
     *
     * @return transaction status is true/false.
     */
    // TODO emit event?
    // TODO _txGas either estinmate from outside or use gasLeft method
    // TODO never ever use or/and
    // TODO execute rule
    function executeRule(
        bytes32 _inputMessageHash,
        bytes _signature,
        bytes _data,
        address _to,
        uint256 _txGas
    )
        public
        returns (bool status/* success */)
    {
        bytes32 prefixedInputMessageHash = keccak256(abi.encodePacked(
                "\x19Ethereum Signed Message:\n32",
                _inputMessageHash
            ));

        address _inputEphemeralKey = recover(prefixedInputMessageHash, _signature);
        EphemeralKeyData ephemeralKeyData = ephemeralKeys[_inputEphemeralKey];
        require(
            ephemeralKeyData.spendingLimit > 0,
            "Input Ephemeral Key is not present!"
        );

        bytes32 messageHash = getHashedMessage(_to, _data, ephemeralKeyData.nonce + 1);
        require(
            _inputMessageHash == messageHash,
            "Input message hash in invalid!"
        );

        // Assembly call to execute the message
        assembly {
            // Issue call, providing _txGas and 0 value to address _to
            status := call(
                        _txGas, // providing _txGas for call transaction.
                        _to, // To addr
                        0, // No value
                        add(_data, 0x20),  // Removed first 32(0x20) bytes from _data.
                        mload(_data), // Input _data length.
                        0, // Store output over input (saves space).
                        0) // Outputs are 32 bytes long.
        }
        // Consume the nonce irrespective of status value
        ephemeralKeyData.nonce++;

        return status;
    }


    /* Private Functions */

    /**
     *  @notice hash the data
     *
     *  @param _to the target contract the transaction will be executed upon. e.g. BT in case of transfer.
     *  @param _data the bytecode to be executed.
     *  @param _nonce nonce or a timestamp.
     *
     *  @return bytes32 hashed data
     */
    // TODO byte(0x19) verify with test case. Test by passing bytes as argument.
    // TODO does metamask, trezor include etheeum signed message
    function getHashedMessage(
        address _to,
        bytes _data,
        uint256 _nonce
    )
        internal
        pure
        returns (bytes32)
    {
        return keccak256(abi.encodePacked(
            byte(0x19), // Starting a transaction with byte(0x19) ensure the signed data from being a valid ethereum transaction.
            byte(0), // The second argument is a version control byte.
            address(this), // The from field will always be the contract executing the code.
            _to,
            0, // the amount in ether to be sent.
            _data,
            _nonce,
            bytes4(data), // 4 byte standard prefix of the function to be called in the from contract.
                         // This guarantees that a signed message can be only executed in a single instance.
            0, // 0 for a standard call, 1 for a DelegateCall and 0 for a create opcode
            '' // extraHash is always hashed at the end. This is done to increase future compatibility of the standard.
        ));
    }

    /**
     * @notice Recover signer address from a message by using their signature.
     *
     * @param _hash bytes32 message, the hash is the signed message. What is recovered is the signer address.
     * @param _signature bytes signature, the signature is generated using web3.eth.sign().
     *
     * @returns signer address.
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
     * @param _expirationHeight block height at which Ephemeral Key is expired.
     */
    function setEphemeralKeyData(
        address _ephemeralKey,
        uint256 _spendingLimit,
        uint256 _expirationHeight
    )
        private
    {
        ephemeralKeys[_ephemeralKey].spendingLimit = _spendingLimit;
        ephemeralKeys[_ephemeralKey].nonce = 0;
        ephemeralKeys[_ephemeralKey].expirationHeight = _expirationHeight;
    }



}