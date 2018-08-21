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
// TODO Implement requestRedemption
// TODO check messageBus code regarding r, s, v
// TODO remove ephermal key when expired in executeRule
contract TokenHolder is MultiSigWallet {

    /* Usings */

    using SafeMath for uint256;


    /* Events */

    event SessionAuthorized(
        bytes32 indexed _transactionId,
        address _ephemeralKey,
        uint256 _spendingLimit,
        uint256 _expirationHeight
    );

    event SessionRevoked(
        bytes32 indexed _transactionId,
        address _ephemeralKey
    );

    event EphemeralKeyExpired(
        address indexed _ephemeralKey
    );

    event RuleExecuted(
        address _to,
        uint256 _nonce,
        bool _status
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
    /** Stores EphemeralKeyData per ephemeral key. */
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
    // TODO Review protocol deployment flow and check if we need _brandedToken or _coGateway in constructor
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
            "Ephemeral key is invalid!"
        );
        require(
            !isAuthorizedEphemeralKey(_ephemeralKey),
            "Input ephemeral key should not be authorized!"
        );
        require(
            _spendingLimit != uint256(0),
            "0 spending limit is not allowed!"
        );
        require(
            _expirationHeight > block.number,
            "Expiration Height should be greater than current block number!"
        );

        transactionId_ = keccak256(abi.encodePacked(
                _ephemeralKey,
                _spendingLimit,
                _expirationHeight,
                address(this),
                "authorizeSession"
        ));

        proposeTransaction(transactionId_);
        confirmTransaction(transactionId_);
        // Add ephemeral key
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
            isAuthorizedEphemeralKey(_ephemeralKey),
            "Input ephemeralKey is not authorized!"
        );

        transactionId_ = keccak256(abi.encodePacked(
                _ephemeralKey,
                address(this),
                "revokeSession"
        ));

        proposeTransaction(transactionId_);
        confirmTransaction(transactionId_);
        if(isTransactionExecuted(transactionId_)) {
            // Remove ephemeral key from the mapping
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
                address(this),
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
     * @notice Validate and execute signed messages as per EIP 1077.
     *
     * @dev nonce will be consumed irrespective of assembly call output.
     *      v, r, s are the values for the transaction signature.
     *      They are used to get public key of any ethereum account..
     *
     * @param _to the target contract the transaction will be executed upon. e.g. Airdrop in case for Airdrop.pay.
     * @param _from it will always be the contract executing the code. It needs to be tokenholder contract address.
     * @param _nonce incremental nonce.
     * @param _data the bytecode to be executed.
     *         Use web3 getData method to construct _data.
     * @param _v It's the recovery id.
     * @param _r It's the output of an ECDSA signature.
     * @param _s It's also the output of an ECDSA signature.
     *
     * @return transaction status is true/false.
     */
    function executeRule(
        address _to,
        address _from,
        uint256 _nonce,
        bytes _data,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    )
        public
        returns (bool executionResult_ /* success */)
    {
        require(
            _to != address(0),
            "to address can't be 0"
        );
        require(
            _from == address(this),
            "From should be tokenholder contract address"
        );
        require(
            _data != bytes(0),
            "Data can't be 0."
        );
        // Construct hashed message.
        bytes32 messageHash = getHashedMessage(_to, _from, _data, _nonce);
        address signer = ecrecover(messageHash, _v, _r, _s);
        require(
            isAuthorizedEphemeralKey(signer),
            "Invalid ephemeral key!"
        );
        ephemeralKeyData = ephemeralKeys[signer];
        if (ephemeralKeyData.expirationHeight < block.number) {
            // cleanup expired ephemeral key
            delete ephemeralKeys[signer];
            emit EphemeralKeyExpired(signer);
            return false;
        }
        require(
            ephemeralKeyData.expirationHeight >= block.number,
            "ephemeral key has expired!"
        );
        // Consume the nonce
        ephemeralKeyData.nonce = ephemeralKeyData.nonce + 1;
        require(
            ephemeralKeyData.nonce == _nonce,
            "Invalid nonce!"
        );

        BrandedToken(brandedToken).approve(
            address(tokenRules),
            ephemeralKeyData.spendingLimit
        );
        executionResult_ = address(_to).call(_data);
        emit RuleExecuted(_to, executionResult_, _nonce);
        BrandedToken(brandedToken).approve(address(tokenRules), 0);

        return executionResult_;
    }


    /* Private Functions */

    /**
     *  @notice hash the data
     *
     *  @param _to the target contract the transaction will be executed upon. e.g. BT in case of transfer.
     *  @param _from it will always be the contract executing the code. It needs to be tokenholder contract address.
     *  @param _data the bytecode to be executed.
     *  @param _nonce nonce or a timestamp.
     *
     *  @return bytes32 hashed data
     */
    // TODO byte(0x19) verify with test case. Test by passing bytes as argument.
    function getHashedMessage(
        address _to,
        address _from,
        bytes _data,
        uint256 _nonce
    )
        private
        returns (bytes32)
    {
        return keccak256(abi.encodePacked(
            byte(0x19), // Starting a transaction with byte(0x19) ensure the signed data from being a valid ethereum transaction.
            byte(0), // The second argument is a version control byte.
            _from, // The from field will always be the contract executing the code.
            _to,
            0, // the amount in ether to be sent.
            _data,
            _nonce,
            bytes4(data), // 4 byte standard call prefix of the function to be called in the from contract.
                         // This guarantees that a signed message can be only executed in a single instance.
            0, // 0 for a standard call, 1 for a DelegateCall and 0 for a create opcode
            '' // extraHash is always hashed at the end. This is done to increase future compatibility of the standard.
        ));
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

    /**
     * @notice private method to check if valid ephemeral key.
     *
     * @param _ephemeralKey Ephemeral Key which need to be checked in ephemeralKeys mapping.
     *
     * @return status is true/false.
     */
    function isAuthorizedEphemeralKey(
        address _ephemeralKey
    )
        private
        pure
        returns (bool /** success status */)
    {
        return ephemeralKeys[_ephemeralKey].spendingLimit > 0;
    }

}