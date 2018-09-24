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

    event SessionAuthorizationSubmitted(
        uint256 indexed _transactionId,
        address _ephemeralKey,
        uint256 _spendingLimit,
        uint256 _expirationHeight
    );

    event SessionRevocationSubmitted(
        uint256 indexed transactionID_,
        address _ephemeralKey
    );

    event RuleExecuted(
        bytes32 _messageHash,
        uint256 _nonce,
        bool _status
    );


    /* Enums */

    enum AuthorizationStatus {
        NOT_AUTHORIZED,
        AUTHORIZED,
        REVOKED
    }


    /* Structs */

    /** expirationHeight is the block number at which ephemeralKey expires. */
    struct EphemeralKeyData {
        uint256 spendingLimit;
        uint256 nonce;
        uint256 expirationHeight;
        AuthorizationStatus status;
    }


    /* Constants */

    bytes4 constant public AUTHORIZE_SESSION_CALLPREFIX = bytes4(
        keccak256("authorizeSession(address,uint256,uint256)")
    );

    bytes4 constant public REVOKE_SESSION_CALLPREFIX = bytes4(
        keccak256("revokeSession(address)")
    );

    bytes4 public constant EXECUTE_RULE_CALLPREFIX = bytes4(
        keccak256(
            "executeRule(address,bytes,uint256,uint8,bytes32,bytes32)"
        )
    );

    bytes4 public constant REDEEM_CALLPREFIX = bytes4(
        keccak256(
            "redeem(address,bytes,uint256,uint8,bytes32,bytes32)"
        )
    );


    /* Storage */

    address public brandedToken;

    /** Co Gateway contract address for redeem functionality. */
    address public coGateway;

    mapping(address /* key */ => EphemeralKeyData) public ephemeralKeys;

    address private tokenRules;


    /* Modifiers */

    modifier keyIsNotNull(address _key)
    {
        require(_key != address(0), "Key address is null.");
        _;
    }

    /** Requires that key is in autorized state and non-expired. */
    modifier keyIsActive(address _key)
    {
        AuthorizationStatus status = ephemeralKeys[_key].status;
        uint256 expirationHeight = ephemeralKeys[_key].expirationHeight;
        require(
            status == AuthorizationStatus.AUTHORIZED &&
            expirationHeight <= block.number,
            "Key is not active."
        );
        _;
    }

    /** Requires that key is in authorized state. */
    modifier keyIsAuthorized(address _key)
    {
        AuthorizationStatus status = ephemeralKeys[_key].status;
        require(
            status == AuthorizationStatus.AUTHORIZED,
            "Key is not authorized."
        );
        _;
    }

    /**
     * Requires that key was authorized. Key might be in authorized or
     * revoked state.
     */
    modifier keyWasAuthorized(address _key)
    {
        AuthorizationStatus status = ephemeralKeys[_key].status;
        require(
            status != AuthorizationStatus.NOT_AUTHORIZED,
            "Key was not authorized."
        );
        _;
    }

    /** Requires that key was not authorized. */
    modifier keyWasNotAuthorized(address _key)
    {
        AuthorizationStatus status = ephemeralKeys[_key].status;
        require(
            status == AuthorizationStatus.NOT_AUTHORIZED,
            "Key is not authorized."
        );
        _;
    }

    /** Requires that key has not expired. */
    modifier keyHasNotExpired(address _key)
    {
        uint256 expirationHeight = ephemeralKeys[_key].expirationHeight;
        require(
            expirationHeight > block.number,
            "Expiration key has expired."
        );
        _;
    }


    /* Special Functions */

    /**
     * @param _brandedToken erc20 contract address this user is part of.
     * @param _coGateway utility chain gateway contract address.
     * @param _tokenRules Token rules contract address.
     * @param _required No of requirements for multi sig wallet.
     * @param _wallets array of wallet addresses.
     */
    constructor(
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


    /* External Functions */

    /**
     * @notice Submits a transaction for a session authorization with
     *         the specified ephemeral key.
     *
     * @dev If the session authorization with the specified key is already
     *      proposed by other wallet, the function only confirms that proposal.
     *      Function requires:
     *          - Only registered wallet can call.
     *          - The key is not null.
     *          - The key is not authorized.
     *          - Expiration height is bigger than the current block height.
     *
     * @param _ephemeralKey Ephemeral key to authorize.
     * @param _spendingLimit Spending limit of the key.
     * @param _expirationHeight Expiration height of the ephemeral key.
     *
     * @return transactionId_ Newly created transaction id.
     */
    function submitAuthorizeSession(
        address _ephemeralKey,
        uint256 _spendingLimit,
        uint256 _expirationHeight
    )
        public
        onlyWallet
        keyIsNotNull(_ephemeralKey)
        keyWasNotAuthorized(_ephemeralKey)
        returns (uint256 transactionID_)
    {
        require(
            _expirationHeight > block.number,
            "Expiration height is lte to the current block height."
        );

        transactionID_ = addTransaction(
            address(this),
            abi.encodeWithSelector(
                AUTHORIZE_SESSION_CALLPREFIX,
                _ephemeralKey,
                _spendingLimit,
                _expirationHeight
            )
        );

        emit SessionAuthorizationSubmitted(
            transactionID_,
            _ephemeralKey,
            _spendingLimit,
            _expirationHeight
        );

        confirmTransaction(transactionID_);
    }

    /**
     * @notice Submits a transaction for the session revocation for
     *         the specified ephemeral key.
     *
     * @dev Function revokes the key even if it has expired.
     *      Function requires:
     *          - Only registered wallet can call.
     *          - The key is not null.
     *          - The key is authorized.
     *
     * @param _ephemeralKey Ephemeral key to revoke.
     *
     * @return transactionID_ Newly created transaction id.
     */
    function submitRevokeSession(
        address _ephemeralKey
    )
        public
        onlyWallet
        keyIsNotNull(_ephemeralKey)
        keyIsAuthorized(_ephemeralKey)
        returns (uint256 transactionID_)
    {
        transactionID_ = addTransaction(
            address(this),
            abi.encodeWithSelector(
                REVOKE_SESSION_CALLPREFIX,
                _ephemeralKey
            )
        );

        emit SessionRevocationSubmitted(
            transactionID_,
            _ephemeralKey
        );

        confirmTransaction(transactionID_);
    }


    /* Public Functions */

    /**
     * @notice Evaluates executable transaction signed by an ephemeral key.
     *
     * @dev As a first step, function validates executable transaction by
     *      checking that the specified signature matches one of the
     *      authorized (non-expired) ephemeral keys.
     *
     *      On success, function executes transaction by calling:
     *          _to.call(_data);
     *
     *      Before execution, it approves the tokenRules as a spender
     *      for ephemeralKey.spendingLimit amount. This allowance is cleared
     *      after execution.
     *
     * @param _to The target contract address the transaction will be executed
     *            upon.
     * @param _data The payload of a function to be executed in the target
     *              contract.
     * @param _nonce The nonce of an ephemeral key that was used to sign
     *               the transaction.
     *
     * @return executeStatus_ True in case of successfull execution of the
     *                        executable transaction, otherwise, false.
     */
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
        (messageHash, ephemeralKey) = processExecutableTransaction(
            EXECUTE_RULE_CALLPREFIX,
            _to,
            _data,
            _nonce,
            _v,
            _r,
            _s
        );

        EphemeralKeyData storage ephemeralKeyData = ephemeralKeys[ephemeralKey];

        BrandedToken(brandedToken).approve(
            tokenRules,
            ephemeralKeyData.spendingLimit
        );

        // solium-disable-next-line security/no-low-level-calls
        executeStatus_ = _to.call(_data);

        BrandedToken(brandedToken).approve(tokenRules, 0);

        emit RuleExecuted(messageHash, _nonce, executeStatus_);
    }

    /**
     * @notice Redeems the amount (msg.value) to the beneficiary.
     *
     * @dev As a first step, function validates executable transaction by
     *      checking that the specified signature matches one of the
     *      authorized (non-expired) ephemeral keys.
     *
     *      On success, function executes transaction by calling:
     *          _to.call.value(msg.value)(_data);
     *
     *      Function requires:
     *          - The target contract should be coGateway address that was
     *            specified in constructor.
     *          - Data payload should be redeem function withon coGateway.
     *
     * @param _to The target contract address the transaction will be executed
     *            upon.
     * @param _data The payload of a function to be executed in the target
     *              contract.
     * @param _nonce The nonce of an ephemeral key that was used to sign
     *               the transaction.
     *
     * @return redeemStatus_ True in case of successfull execution of the
     *                       executable transaction, otherwise, false.
     */
    function redeem(
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
        require(
            _to == coGateway,
            "Executable transaction should call coGateway."
        );

        // TODO: Require that call prefix within _data is a redeem function
        //       selector from _coGateway.

        bytes32 messageHash = bytes32(0);
        address ephemeralKey = address(0);
        (messageHash, ephemeralKey) = processExecutableTransaction(
            REDEEM_CALLPREFIX,
            _to,
            _data,
            _nonce,
            _v,
            _r,
            _s
        );

        EphemeralKeyData storage ephemeralKeyData = ephemeralKeys[ephemeralKey];

        BrandedToken(brandedToken).approve(
            _to,
            ephemeralKeyData.spendingLimit
        );

        // solium-disable-next-line security/no-call-value
        redeemStatus_ = _to.call.value(msg.value)(_data);

        BrandedToken(brandedToken).approve(_to, 0);

        emit RuleExecuted(messageHash, _nonce, redeemStatus_);
    }

    function authorizeSession(
        address _ephemeralKey,
        uint256 _spendingLimit,
        uint256 _expirationHeight
    )
        public
        onlyMultisig
    {
        EphemeralKeyData storage keyData = ephemeralKeys[_ephemeralKey];

        keyData.spendingLimit = _spendingLimit;
        keyData.expirationHeight = _expirationHeight;
        keyData.nonce = 0;
        keyData.status = AuthorizationStatus.AUTHORIZED;
    }

    function revokeSession(
        address _ephemeralKey
    )
        public
        onlyMultisig
        keyIsNotNull(_ephemeralKey)
        keyIsAuthorized(_ephemeralKey)
    {
        ephemeralKeys[_ephemeralKey].status = AuthorizationStatus.REVOKED;
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
        EphemeralKeyData storage keyData = ephemeralKeys[_ephemeralKey];
        return keyData.status == AuthorizationStatus.AUTHORIZED &&
            keyData.expirationHeight > block.number;
    }


    /* Private Functions */

    function processExecutableTransaction(
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
        messageHash_ = getMessageHash(
            _callPrefix,
            _to,
            keccak256(_data),
            _nonce
        );

        key_ = recoverKey(
            messageHash_,
            _v,
            _r,
            _s
        );

        require(
            isEphemeralKeyActive(key_),
            "Ephemeral key is not active."
        );

        EphemeralKeyData storage keyData = ephemeralKeys[key_];

        require(
            _nonce == keyData.nonce,
            "Nonce is not equal to the current nonce."
        );

        keyData.nonce = keyData.nonce.add(1);
    }

    function recoverKey(
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

    function getMessageHash(
        bytes4 _callPrefix,
        address _to,
        bytes32 _dataHash,
        uint256 _nonce
    )
        private
        view
        returns (bytes32 messageHash_)
    {
        messageHash_ = keccak256(
            abi.encodePacked(
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