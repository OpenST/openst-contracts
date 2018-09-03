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
import "./GatewayRedeemInterface.sol";


/**
 * @title TokenHolder contract.
 *
 * @notice Implements properties and actions performed by an user. It enables
 *         scalable key management solutions for mainstream apps.
 */
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
        address _ephemeralKey
    );

    event RuleExecuted(
        bytes32 _messageHash,
        uint256 _nonce,
        bool _status
    );


    /* Enums */

    enum EphemeralKeyStatus {NON_AUTHORIZED, AUTHORIZED, REVOKED}


    /* Structs */

    /** expirationHeight is the block number at which ephemeralKey expires. */
    struct EphemeralKeyData {
        uint256 spendingLimit;
        uint256 nonce;
        uint256 expirationHeight;
        EphemeralKeyStatus status;
    }


    /* Storage */

    bytes4 public constant EXECUTE_RULE_PREFIX = bytes4 (
        keccak256 (
            "executeRule(address,bytes,uint256,uin8,bytes32,bytes32)"
        )
    );

    bytes4 public constant REDEEM_PREFIX = bytes4 (
        keccak256 (
            "redeem(address,bytes,uint256,uin8,bytes32,bytes32)"
        )
    );

    address public brandedToken;

    /** Co Gateway contract address for redeem functionality. */
    address public coGateway;

    mapping (address /* key */ => EphemeralKeyData) public ephemeralKeys;

    address private tokenRules;


    /* Special Functions */

    /**
     * @param _brandedToken erc20 contract address this user is part of.
     * @param _coGateway utility chain gateway contract address.
     * @param _tokenRules Token rules contract address.
     * @param _required No of requirements for multi sig wallet.
     * @param _wallets array of wallet addresses.
     */
    constructor (
        address _brandedToken,
        address _coGateway,
        address _tokenRules,
        uint256 _required,
        address[] _wallets
    )
        public
        MultiSigWallet(_wallets, _required)
    {
        require(
            _brandedToken != address(0),
            "Branded token contract address is 0."
        );
        require(
            _coGateway != address(0),
            "Co gateway contract address is 0."
        );
        require(
            _tokenRules != address(0),
            "TokenRules contract address is 0."
        );

        brandedToken = _brandedToken;
        coGateway = _coGateway;
        tokenRules = _tokenRules;
    }


    /* Public Functions */

    /**
     * @notice Submits a transaction for a session authorization with
     *         the specified ephemeral key.
     *
     * @dev If the session authorization with the specified key is already
     *      proposed by other wallet, the function only confirms that proposal.
     *      Function requires:
     *          - The key is not null.
     *          - The key is not authorized.
     *          - Expiration height is bigger than the current block height.
     *
     * @param _ephemeralKey Ephemeral key to authorize.
     * @param _spendingLimit Spending limit of the key.
     * @param _expirationHeight Expiration height of the ephemeral key.
     *
     * @return transactionId_ Tranaction id of the proposal.
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
        require(_ephemeralKey != address(0), "Ephemeral key address is 0.");
        EphemeralKeyStatus status = ephemeralKeys[_ephemeralKey].status;
        if (status == EphemeralKeyStatus.AUTHORIZED) {
            revert("Ephemeral key is currently authorized.");
        } else if (status == EphemeralKeyStatus.REVOKED) {
            revert("Ephemeral key was already revoked.");
        }
        require(
            _expirationHeight > block.number,
            "Expiration height is lte to the current block height."
        );

        transactionId_ = keccak256(
            abi.encodePacked (
                _ephemeralKey,
                _spendingLimit,
                _expirationHeight,
                address(this),
                "authorizeSession"
            )
        );

        submitTransaction(transactionId_);

        if (isTransactionExecuted(transactionId_) == true) {

            EphemeralKeyData storage keyData = ephemeralKeys[_ephemeralKey];

            keyData.spendingLimit = _spendingLimit;
            keyData.expirationHeight = _expirationHeight;
            keyData.nonce = 0;
            keyData.status = EphemeralKeyStatus.AUTHORIZED;

            emit SessionAuthorized (
                transactionId_,
                _ephemeralKey,
                _spendingLimit,
                _expirationHeight
            );
        }
    }

    /**
     * @notice Submits a transaction for the session revocation for
     *         the specified ephemeral key.
     *
     * @dev If the session revocation for the specified key is already
     *      proposed by other wallet, the function only confirms that proposal.
     *      Function revokes the key even if it has expired.
     *      Function requires:
     *          - The key is not null.
     *          - The key is authorized.
     *
     * @param _ephemeralKey Ephemeral key to revoke.
     *
     * @return transactionId_ Transaction id of the proposal.
     */
    function revokeSession (
        address _ephemeralKey
    )
        public
        onlyWallet
        returns (bytes32 transactionId_)
    {
        require(_ephemeralKey != address(0), "Ephemeral key is null.");
        EphemeralKeyStatus status = ephemeralKeys[_ephemeralKey].status;
        if (status == EphemeralKeyStatus.NON_AUTHORIZED) {
            revert("Ephemeral key was not yet authorized.");
        } else if (status == EphemeralKeyStatus.REVOKED) {
            revert("Ephemeral key was already revoked.");
        }

        transactionId_ = keccak256(
            abi.encodePacked (
                _ephemeralKey,
                address(this),
                "revokeSession"
            )
        );

        submitTransaction(transactionId_);

        if (isTransactionExecuted(transactionId_) == true) {
            ephemeralKeys[_ephemeralKey].status = EphemeralKeyStatus.REVOKED;
            emit SessionRevoked(transactionId_, _ephemeralKey);
        }
    }

    function executeRule(
        address _to,
        bytes _data,
        uint256 _nonce,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    )
        public
        returns (bool executeStatus_)
    {
        bytes32 messageHash = bytes32(0);
        address ephemeralKey = address(0);
        (messageHash, ephemeralKey) = processExecutableTransaction (
            EXECUTE_RULE_PREFIX,
            _to,
            _data,
            _nonce,
            _v,
            _r,
            _s
        );

        EphemeralKeyData storage ephemeralKeyData = ephemeralKeys[ephemeralKey];

        BrandedToken(brandedToken).approve (
            tokenRules,
            ephemeralKeyData.spendingLimit
        );

        // solium-disable-next-line security/no-low-level-calls
        executeStatus_ = _to.call(_data);

        BrandedToken(brandedToken).approve(tokenRules, 0);

        emit RuleExecuted(messageHash, _nonce, executeStatus_);
    }

    function redeem (
        address _to,
        bytes _data,
        uint256 _nonce,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    )
        public
        payable
        returns (bool redeemStatus_)
    {
        require (
            _to == coGateway,
            "Executable transaction should call coGateway."
        );

        bytes32 messageHash = bytes32(0);
        address ephemeralKey = address(0);
        (messageHash, ephemeralKey) = processExecutableTransaction (
            REDEEM_PREFIX,
            _to,
            _data,
            _nonce,
            _v,
            _r,
            _s
        );

        EphemeralKeyData storage ephemeralKeyData = ephemeralKeys[ephemeralKey];

        BrandedToken(brandedToken).approve (
            coGateway,
            ephemeralKeyData.spendingLimit
        );

        // solium-disable-next-line security/no-call-value
        redeemStatus_ = coGateway.call.value(msg.value)(_data);

        BrandedToken(brandedToken).approve(coGateway, 0);

        emit RuleExecuted(messageHash, _nonce, redeemStatus_);
    }

    /**
     * @notice Checks if the specified key is authorized and non-expired.
     *
     * @param _ephemeralKey Key to check.
     *
     * @return True if the key is currently authorized and has not expired,
     *         otherwise false.
     */
    function isEphemeralKeyActive(address _ephemeralKey)
        public
        view
        returns (bool)
    {
        return isEphemeralKeyAuthorized(_ephemeralKey) == true &&
            hasEphemeralKeyExpired(_ephemeralKey) == false;
    }

    /**
     * @notice Returns true if the ephemeral key is currently authorized.
     *
     * @param _ephemeralKey Key to check.
     *
     * @dev Function returns true even if the key has expired.
     *
     * @return True if the key is currently authorized, otherwise false.s
     */
    function isEphemeralKeyAuthorized(address _ephemeralKey)
        public
        view
        returns (bool)
    {
        return ephemeralKeys[_ephemeralKey].status ==
            EphemeralKeyStatus.AUTHORIZED;
    }

    /**
     * @notice Checks if the specified key has expired.
     *
     * @param _ephemeralKey Key to check.
     *
     * @dev Function requires:
     *          - The ephemeral key was (is) authorized.
     *
     * @return True if the key has expired, otherwise false.
     */
    function hasEphemeralKeyExpired(address _ephemeralKey)
        public
        view
        returns (bool)
    {
        require (
            wasEphemeralKeyAuthorized(_ephemeralKey) == true,
            "Ephemeral key is (was) not authorized."
        );

        return ephemeralKeys[_ephemeralKey].expirationHeight <= block.number;
    }

    /**
     * @notice Returns true if the ephemeral key was (or is) authorized.
     *
     * @param _ephemeralKey Key to check.
     *
     * @dev Function returns true if the key is authorized or was previously
     *      authorized and revoked.
     *      Function does not take into consideration the expiration height.
     *
     * @return True in case if the key was authorized, otherwise false.
     */
    function wasEphemeralKeyAuthorized(address _ephemeralKey)
        public
        view
        returns (bool)
    {
        return ephemeralKeys[_ephemeralKey].status !=
            EphemeralKeyStatus.NON_AUTHORIZED;
    }


    /* Private Functions */

    function processExecutableTransaction (
        bytes4 _callPrefix,
        address _to,
        bytes _data,
        uint256 _nonce,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    )
        private
        returns (bytes32 messageHash_, address key_)
    {
        messageHash_ = getMessageHash (
            _callPrefix,
            _to,
            keccak256(_data),
            _nonce
        );

        key_ = recoverKey (
            messageHash_,
            _v,
            _r,
            _s
        );

        require (
            isEphemeralKeyActive(key_),
            "Ephemeral key is not active."
        );

        EphemeralKeyData storage keyData = ephemeralKeys[key_];

        require (
            _nonce == keyData.nonce,
            "Nonce is not equal to the current nonce."
        );

        keyData.nonce = keyData.nonce.add(1);
    }

    function recoverKey (
        bytes32 _messageHash,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    )
        private
        pure
        returns (address key_)
    {
        key_ = ecrecover(_messageHash, _v, _r, _s);
    }

    function getMessageHash (
        bytes4 _callPrefix,
        address _to,
        bytes32 _dataHash,
        uint256 _nonce
    )
        private
        view
        returns (bytes32 messageHash_)
    {
        messageHash_ = keccak256 (
            abi.encodePacked  (
                byte(0x19), // Starting a transaction with byte(0x19) ensure
                            // the signed data from being a valid ethereum
                            // transaction.
                byte(0), // The version control byte.
                address(this), // The from field will always be the contract
                               // executing the code.
                _to,
                uint8(0), // The amount in ether to be sent.
                _dataHash,
                _nonce,
                uint8(0), // gasPrice
                uint8(0), // gasLimit
                uint8(0), // gasToken
                _callPrefix, // 4 byte standard call prefix of the
                             // function to be called in the 'from' contract.
                             // This guarantees that signed message can
                             // be only executed in a single instance.
                uint8(0), // 0 for a standard call, 1 for a DelegateCall and 2
                          // for a create opcode
                bytes32(0) // extraHash is always hashed at the end. This is
                           // done to increase future compatibility of the
                           // standard.
            )
        );
    }

}