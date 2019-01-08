pragma solidity ^0.4.23;

// Copyright 2018 OpenST Ltd.
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

import "./SafeMath.sol";
import "./EIP20TokenInterface.sol";
import "./UtilityTokenRequiredInterface.sol";
import "./TokenRules.sol";


/**
 * @title TokenHolder contract.
 *
 * @notice Implements executable transactions (EIP-1077) for users to interact
 *         with token rules. It enables users to authorise sessions for
 *         session keys that dapps and mainstream applications can use to
 *         generate token events on-chain.
 */
contract TokenHolder {

    /* Usings */

    using SafeMath for uint256;


    /* Events */

    event SessionAuthorized(
        address _sessionKey
    );

    event SessionRevoked(
        address _sessionKey
    );

    event RuleExecuted(
        address indexed _to,
        bytes4 _functionSelector,
        address _sessionKey,
        uint256 _nonce,
        bytes32 _messageHash,
        bool _status
    );

    event RedeemExecuted(
        address indexed _to,
        bytes4 _functionSelector,
        address _sessionKey,
        uint256 _nonce,
        bytes32 _messageHash,
        bool _status
    );


    /* Enums */

    enum AuthorizationStatus {
        NOT_AUTHORIZED,
        AUTHORIZED,
        REVOKED
    }


    /* Structs */

    /** expirationHeight is the block number at which sessionKey expires. */
    struct SessionKeyData {
        uint256 spendingLimit;
        uint256 nonce;
        uint256 expirationHeight;
        AuthorizationStatus status;
    }


    /* Constants */

    bytes4 public constant EXECUTE_RULE_CALLPREFIX = bytes4(
        keccak256(
            "executeRule(address,bytes,uint256,uint8,bytes32,bytes32)"
        )
    );

    bytes4 public constant EXECUTE_REDEEM_CALLPREFIX = bytes4(
        keccak256(
            "executeRedeem(address,bytes,uint256,uint8,bytes32,bytes32)"
        )
    );

    bytes4 public constant COGATEWAY_REDEEM_CALLPREFIX = bytes4(
        keccak256(
            "redeem(uint256,address,uint256,uint256,uint256,bytes32)"
        )
    );


    /* Storage */

    EIP20TokenInterface public token;

    mapping(address /* key */ => SessionKeyData) public sessionKeys;

    address public tokenRules;

    address public owner;


    /* Modifiers */

    modifier onlyOwner()
    {
        require(msg.sender == owner, "Only owner is allowed to call.");

        _;
    }

    modifier keyIsNotNull(address _key)
    {
        require(_key != address(0), "Key address is null.");
        _;
    }

    /** Requires that key is in authorized state. */
    modifier keyIsAuthorized(address _key)
    {
        AuthorizationStatus status = sessionKeys[_key].status;
        require(
            status == AuthorizationStatus.AUTHORIZED,
            "Key is not authorized."
        );
        _;
    }

    /** Requires that key was not authorized. */
    modifier keyDoesNotExist(address _key)
    {
        AuthorizationStatus status = sessionKeys[_key].status;
        require(
            status == AuthorizationStatus.NOT_AUTHORIZED,
            "Key exists."
        );
        _;
    }


    /* Special Functions */

    /**
     * @dev Constructor requires:
     *          - EIP20 token address is not null.
     *          - Token rules address is not null.
     *          - Owner address is not null.
     *
     * @param _token EIP20 token contract address deployed for an economy.
     * @param _tokenRules Token rules contract address.
     * @param _owner The contract's owner address.
     */
    constructor(
        EIP20TokenInterface _token,
        address _tokenRules,
        address _owner
    )
        public
    {
        require(
            _token != address(0),
            "Token contract address is null."
        );
        require(
            _tokenRules != address(0),
            "TokenRules contract address is null."
        );
        require(
            _owner != address(0),
            "Owner address is null."
        );

        token = _token;
        tokenRules = _tokenRules;
        owner = _owner;
    }


    /* External Functions */

    /**
     * @notice Authorizes a session.
     *
     * @dev Function requires:
     *          - Only owner address can call.
     *          - The key is not null.
     *          - The key does not exist.
     *          - Expiration height is bigger than the current block height.
     *
     * @param _sessionKey Session key address to authorize.
     * @param _spendingLimit Spending limit of the session key.
     * @param _expirationHeight Expiration height of the session key.
     */
    function authorizeSession(
        address _sessionKey,
        uint256 _spendingLimit,
        uint256 _expirationHeight
    )
        external
        onlyOwner
        keyIsNotNull(_sessionKey)
        keyDoesNotExist(_sessionKey)
    {
        require(
            _expirationHeight > block.number,
            "Expiration height is lte to the current block height."
        );

        SessionKeyData storage keyData = sessionKeys[_sessionKey];

        keyData.spendingLimit = _spendingLimit;
        keyData.expirationHeight = _expirationHeight;
        keyData.nonce = 0;
        keyData.status = AuthorizationStatus.AUTHORIZED;

        emit SessionAuthorized(_sessionKey);
    }

    /**
     * @notice Revokes session for the specified session key.
     *
     * @dev Function revokes the key even if it has expired.
     *      Function requires:
     *          - Only owner can call.
     *          - The key is authorized.
     *
     * @param _sessionKey Session key to revoke.
     */
    function revokeSession(address _sessionKey)
        external
        onlyOwner
        keyIsAuthorized(_sessionKey)
    {
        sessionKeys[_sessionKey].status = AuthorizationStatus.REVOKED;

        emit SessionRevoked(_sessionKey);
    }

    /**
     * @notice Logout session of the msg.sender.
     *
     * @dev Function revokes the key even if it has expired.
     *      Function requires:
     *          - The session key (msg.sender) is authorized.
     */
    function logout()
        external
        keyIsAuthorized(msg.sender)
    {
        sessionKeys[msg.sender].status = AuthorizationStatus.REVOKED;

        emit SessionRevoked(msg.sender);
    }

    /**
     * @notice Evaluates executable transaction signed by a session key.
     *
     * @dev As a first step, function validates executable transaction by
     *      checking that the specified signature matches one of the
     *      authorized (non-expired) session keys.
     *
     *      On success, function executes transaction by calling:
     *          _to.call(_data);
     *
     *      Before execution, it approves the tokenRules as a spender
     *      for sessionKey.spendingLimit amount. This allowance is cleared
     *      after execution.
     *
     *      Function requires:
     *          - _to address cannot be EIP20 Token.
     *          - The key used to sign data is authorized and have not expired.
     *          - nonce matches the next available one (+1 of the last
     *            used one).
     *
     * @param _to The target contract address the transaction will be executed
     *            upon.
     * @param _data The payload of a function to be executed in the target
     *              contract.
     * @param _nonce The nonce of an session key that was used to sign
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
        external
        payable
        returns (bool executionStatus_)
    {
        require(
            _to != address(token),
            "'to' address is utility token address."
        );

        require(
            _to != address(this),
            "'to' address is TokenHolder address itself."
        );

        bytes32 messageHash = bytes32(0);
        address sessionKey = address(0);
        (messageHash, sessionKey) = verifyExecutableTransaction(
            EXECUTE_RULE_CALLPREFIX,
            _to,
            _data,
            _nonce,
            _v,
            _r,
            _s
        );

        SessionKeyData storage sessionKeyData = sessionKeys[sessionKey];

        TokenRules(tokenRules).allowTransfers();

        token.approve(
            tokenRules,
            sessionKeyData.spendingLimit
        );

        // solium-disable-next-line security/no-call-value
        executionStatus_ = _to.call.value(msg.value)(_data);

        token.approve(tokenRules, 0);

        TokenRules(tokenRules).disallowTransfers();

        bytes4 functionSelector = bytesToBytes4(_data);

        emit RuleExecuted(
            _to,
            functionSelector,
            sessionKey,
            _nonce,
            messageHash,
            executionStatus_
        );
    }

    function executeRedeem(
        address _to,
        bytes _data,
        uint256 _nonce,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    )
        external
        payable
        returns (bool executionStatus_)
    {
        address coGateway = UtilityTokenRequiredInterface(token).coGateway();

        require(_to == coGateway,"'to' address is not coGateway address.");

        bytes4 functionSelector = bytesToBytes4(_data);

        require(
            functionSelector == COGATEWAY_REDEEM_CALLPREFIX,
            "Retrieved function selector does not match to CoGateway::redeem."
        );

        bytes32 messageHash = bytes32(0);
        address sessionKey = address(0);
        (messageHash, sessionKey) = verifyExecutableTransaction(
            EXECUTE_REDEEM_CALLPREFIX,
            _to,
            _data,
            _nonce,
            _v,
            _r,
            _s
        );

        SessionKeyData storage sessionKeyData = sessionKeys[sessionKey];

        token.approve(_to, sessionKeyData.spendingLimit);

        // solium-disable-next-line security/no-call-value
        executionStatus_ = _to.call.value(msg.value)(_data);

        token.approve(_to, 0);

        emit RedeemExecuted(
            _to,
            functionSelector,
            sessionKey,
            _nonce,
            messageHash,
            executionStatus_
        );
    }


    /* Public Functions */

    /**
     * @dev Retrieves the first 4 bytes of input byte array into byte4.
     *      Function requires:
     *          - Input byte array's length is greater than or equal to 4.
     */
    function bytesToBytes4(bytes _input) public pure returns (bytes4 out_) {
        require(
            _input.length >= 4,
            "Input bytes length is less than 4."
        );

        for (uint8 i = 0; i < 4; i++) {
            out_ |= bytes4(_input[i] & 0xFF) >> (i * 8);
        }
    }


    /* Private Functions */

    function verifyExecutableTransaction(
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

        key_ = ecrecover(messageHash_, _v, _r, _s);

        SessionKeyData storage keyData = sessionKeys[key_];

        require(
            keyData.status == AuthorizationStatus.AUTHORIZED &&
            keyData.expirationHeight > block.number,
            "Session key is not active."
        );

        uint256 expectedNonce = keyData.nonce.add(1);

        require(
            _nonce == expectedNonce,
            "The next nonce is not provided."
        );

        keyData.nonce = expectedNonce;
    }

    /**
     * @notice The hashed message format is compliant with EIP-1077.
     *
     * @dev EIP-1077 enables user to sign messages to show intent of execution,
     *      but allows a third party relayer to execute them.
     *      https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1077.md
     */
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
