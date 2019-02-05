pragma solidity ^0.5.0;

// Copyright 2019 OpenST Ltd.
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

import "./EIP20TokenInterface.sol";
import "../proxies/MasterCopyNonUpgradable.sol";
import "../external/SafeMath.sol";
import "./TokenRules.sol";
import "./UtilityTokenRequiredInterface.sol";

/**
 * @title TokenHolder contract.
 *
 * @notice Implements executable transactions (EIP-1077) for users to interact
 *         with token rules. It enables users to authorise sessions for
 *         session keys that dapps and mainstream applications can use to
 *         generate token events on-chain.
 */
contract TokenHolder is MasterCopyNonUpgradable
{

    /* Usings */

    using SafeMath for uint256;


    /* Events */

    event SessionAuthorized(
        address _sessionKey
    );

    event SessionRevoked(
        address _sessionKey
    );

    event SessionsLoggedOut(
        uint256 _sessionWindow
    );

    /**
     * @param _messageHash Executed rule message hash according to EIP-1077.
     * @param _status Rule execution's status.
     */
    event RuleExecuted(
        bytes32 _messageHash,
        bool _status
    );

    /**
     * @param _messageHash Executed redemption request message hash according
     *                 to EIP-1077.
     * @param _status Redemption execution's status.
     */
    event RedemptionExecuted(
        bytes32 _messageHash,
        bool _status
    );


    /* Enums */

    enum AuthorizationStatus {
        NOT_AUTHORIZED,
        REVOKED
    }


    /* Structs */

    /** expirationHeight is the block number at which sessionKey expires. */
    struct SessionKeyData {
        uint256 spendingLimit;
        uint256 expirationHeight;
        uint256 nonce;
        uint256 session;
    }


    /* Constants */

    bytes4 public constant EXECUTE_RULE_CALLPREFIX = bytes4(
        keccak256(
            "executeRule(address,bytes,uint256,uint8,bytes32,bytes32)"
        )
    );

    bytes4 public constant EXECUTE_REDEMPTION_CALLPREFIX = bytes4(
        keccak256(
            "executeRedemption(address,bytes,uint256,uint8,bytes32,bytes32)"
        )
    );


    /* Storage */

    EIP20TokenInterface public token;

    uint256 public sessionWindow;

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
        require(
            sessionKeys[_key].session > uint256(AuthorizationStatus.REVOKED),
            "Key is not authorized."
        );
        _;
    }

    /** Requires that key was not authorized. */
    modifier keyDoesNotExist(address _key)
    {
        require(
            sessionKeys[_key].session == uint256(
                AuthorizationStatus.NOT_AUTHORIZED
            ),
            "Key exists."
        );
        _;
    }


    /* External Functions */

    /**
     * @notice Setups an already deployed contract.
     *
     * @dev The function acts as a "constructor" to the contract and initializes
     *      the proxy's storage layout.
     *
     *      Function requires:
     *          - It can be called only once for this contract.
     *          - Token address is not null.
     *          - Token rules address is not null.
     *          - Owner address is not null.
     *          - Session key addresses, spending limits and expiration height
     *            arrays lengths are equal.
     *
     * @param _token EIP20 token contract address deployed for an economy.
     * @param _tokenRules Token rules contract address.
     * @param _owner The contract's owner address.
     * @param _sessionKeys Session key addresses to authorize.
     * @param _sessionKeysSpendingLimits Session keys' spending limits.
     * @param _sessionKeysExpirationHeights Session keys' expiration heights.
     */
    function setup(
        EIP20TokenInterface _token,
        address _tokenRules,
        address _owner,
        address[] calldata _sessionKeys,
        uint256[] calldata _sessionKeysSpendingLimits,
        uint256[] calldata _sessionKeysExpirationHeights
    )
        external
    {
        // Assures that function can be called only once.
        require(
            address(token) == address(0) &&
            address(owner) == address(0) &&
            address(tokenRules) == address(0),
            "Contract has been already setup."
        );

        require(
            address(_token) != address(0),
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

        require(
            _sessionKeys.length == _sessionKeysSpendingLimits.length,
            "Session keys and spending limits arrays lengths are different."
        );

        require(
            _sessionKeys.length == _sessionKeysExpirationHeights.length,
            "Session keys and expiration heights arrays lengths are different."
        );

        token = _token;
        tokenRules = _tokenRules;
        owner = _owner;

        sessionWindow = 2;

        for (uint256 i = 0; i < _sessionKeys.length; ++i) {
            _authorizeSession(
                _sessionKeys[i],
                _sessionKeysSpendingLimits[i],
                _sessionKeysExpirationHeights[i]
            );
        }
    }

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
    {
        _authorizeSession(_sessionKey, _spendingLimit, _expirationHeight);
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
        sessionKeys[_sessionKey].session = uint256(AuthorizationStatus.REVOKED);

        emit SessionRevoked(_sessionKey);
    }

    /**
     * @notice Logout all authorized sessions.
     *
     * @dev Function requires:
     *          - Only owner is allowed to call.
     */
    function logout()
        external
        onlyOwner
    {
        sessionWindow = sessionWindow.add(1);

        emit SessionsLoggedOut(sessionWindow.sub(1));
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
     *          - key used to sign data is authorized and have not expired.
     *          - nonce is equal to the stored nonce value.
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
        bytes calldata _data,
        uint256 _nonce,
        bytes32 _r,
        bytes32 _s,
        uint8 _v
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

        (bytes32 messageHash, address sessionKey) = verifyExecutableTransaction(
            EXECUTE_RULE_CALLPREFIX,
            _to,
            _data,
            _nonce,
            _r,
            _s,
            _v
        );

        SessionKeyData storage sessionKeyData = sessionKeys[sessionKey];

        TokenRules(tokenRules).allowTransfers();

        token.approve(
            tokenRules,
            sessionKeyData.spendingLimit
        );

        bytes memory returnData;
        // solium-disable-next-line security/no-call-value
        (executionStatus_, returnData) = _to.call.value(msg.value)(_data);

        token.approve(tokenRules, 0);

        TokenRules(tokenRules).disallowTransfers();

        emit RuleExecuted(
            messageHash,
            executionStatus_
        );
    }

    function executeRedemption(
        address _to,
        bytes calldata _data,
        uint256 _nonce,
        bytes32 _r,
        bytes32 _s,
        uint8 _v
    )
        external
        payable
        returns (bool executionStatus_)
    {
        address coGateway = UtilityTokenRequiredInterface(
            address(token)
        ).coGateway();

        require(_to == coGateway,"'to' address is not coGateway address.");

        (bytes32 messageHash, address sessionKey) = verifyExecutableTransaction(
            EXECUTE_REDEMPTION_CALLPREFIX,
            _to,
            _data,
            _nonce,
            _r,
            _s,
            _v
        );

        SessionKeyData storage sessionKeyData = sessionKeys[sessionKey];

        token.approve(_to, sessionKeyData.spendingLimit);

        bytes memory returnData;
        // solium-disable-next-line security/no-call-value
        (executionStatus_, returnData) = _to.call.value(msg.value)(_data);

        token.approve(_to, 0);

        emit RedemptionExecuted(
            messageHash,
            executionStatus_
        );
    }


    /* Private Functions */

    function _authorizeSession(
        address _sessionKey,
        uint256 _spendingLimit,
        uint256 _expirationHeight
    )
        private
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
        keyData.session = sessionWindow;

        emit SessionAuthorized(_sessionKey);
    }

    function verifyExecutableTransaction(
        bytes4 _callPrefix,
        address _to,
        bytes memory _data,
        uint256 _nonce,
        bytes32 _r,
        bytes32 _s,
        uint8 _v
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

        // The following checks appears here and not higher in the stack,
        // as session key is only retrieved here, after calculation
        // of message hash according EIP-1077 and retriving the key
        // from the signature (_r, _s, _v).
        require(
            keyData.session != 0,
            "Session key is not authorized."
        );

        require(
            keyData.session != 1,
            "Session key was revoked."
        );

        require(
            keyData.session == sessionWindow,
            "Session key was logged out."
        );

        require(
            keyData.expirationHeight > block.number,
            "Session key was expired."
        );

        require(
            _nonce == keyData.nonce,
            "Incorrect nonce is specified."
        );

        keyData.nonce = keyData.nonce.add(1);
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
