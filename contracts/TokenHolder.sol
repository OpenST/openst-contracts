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
import "./MultiSigWallet.sol";
import "./TokenRules.sol";


/**
 * @title TokenHolder contract.
 *
 * @notice Implements executable transactions (EIP-1077) for users to interact
 *         with token rules. It enables users to authorise sessions for
 *         ephemeral keys that dapps and mainstream applications can use to
 *         generate token events on-chain.
 */
contract TokenHolder is MultiSigWallet {

    /* Usings */

    using SafeMath for uint256;


    /* Events */

    event SessionAuthorizationSubmitted(
        uint256 indexed _transactionID,
        address _ephemeralKey,
        uint256 _spendingLimit,
        uint256 _expirationHeight
    );

    event SessionRevoked(
        address _ephemeralKey
    );

    event RuleExecuted(
        address indexed _to,
        bytes4 _functionSelector,
        address _ephemeralKey,
        uint256 _nonce,
        bytes32 _messageHash,
        bool _status
    );

    event RedeemInitiated(
        address _beneficiary,
        uint256 _amount,
        uint256 _redeemerNonce,
        address _ephemeralKey,
        bool _executionStatus
    );

    event RevertRedemptionInitiated(
        bytes32 _redeemMessageHash,
        address _ephemeralKey,
        bool _executionStatus
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

    bytes4 public constant EXECUTE_RULE_CALLPREFIX = bytes4(
        keccak256(
            "executeRule(address,bytes,uint256,uint8,bytes32,bytes32)"
        )
    );

    /**
     *  TH redeem function call prefix needed to verify signed data as per
     *  EIP1077 proposal.
     */
    bytes4 public constant REDEEM_RULE_CALLPREFIX = bytes4(
        keccak256(
            "redeem(uint256,address,uint256,uint256,uint256,bytes32,uint256,uint8,bytes32,bytes32)"
        )
    );

    /**
     *  Using COGATEWAY_REDEEM_SELECTOR CoGateway.Redeem executable calldata is
     *  constructed.
     */
    bytes4 public constant COGATEWAY_REDEEM_SELECTOR = bytes4(
        keccak256(
            "redeem(uint256,address,address,uint256,uint256,uint256,bytes32)"
        )
    );

    /**
     *  TH revertRedemption function rule call prefix needed to verify signed
     *  data as per EIP1077 proposal.
     */
    bytes4 public constant REVERT_REDEMPTION_RULE_CALLPREFIX = bytes4(
        keccak256(
            "revertRedemption(bytes32,uint256,uint8,bytes32,bytes32)"
        )
    );

    /**
     *  Using COGATEWAY_REVERT_REDEMPTION_SELECTOR CoGateway.RevertRedemption
     *  executable data is constructed and called.
     */
    bytes4 public constant COGATEWAY_REVERT_REDEMPTION_SELECTOR = bytes4(
        keccak256(
            "revertRedemption(bytes32)"
        )
    );


    /* Storage */

    EIP20TokenInterface public token;

    mapping(address /* key */ => EphemeralKeyData) public ephemeralKeys;

    address public tokenRules;


    /* Modifiers */

    modifier keyIsNotNull(address _key)
    {
        require(_key != address(0), "Key address is null.");
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

    /** Requires that key was not authorized. */
    modifier keyDoesNotExist(address _key)
    {
        AuthorizationStatus status = ephemeralKeys[_key].status;
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
     *
     * @param _token EIP20 token contract address deployed for an economy.
     * @param _tokenRules Token rules contract address.
     * @param _wallets array of wallet addresses.
     * @param _required No of requirements for multi sig wallet.
     */
    constructor(
        EIP20TokenInterface _token,
        address _tokenRules,
        address[] _wallets,
        uint256 _required
    )
        public
        MultiSigWallet(_wallets, _required)
    {
        require(
            _token != address(0),
            "Token contract address is null."
        );
        require(
            _tokenRules != address(0),
            "TokenRules contract address is null."
        );

        token = _token;
        tokenRules = _tokenRules;
    }


    /* External Functions */

    /**
     * @notice Submits a transaction for a session authorization with
     *         the specified ephemeral key.
     *
     * @dev Function requires:
     *          - Only registered wallet can call.
     *          - The key is not null.
     *          - The key does not exist.
     *          - Expiration height is bigger than the current block height.
     *
     * @param _ephemeralKey Ephemeral key to authorize.
     * @param _spendingLimit Spending limit of the key.
     * @param _expirationHeight Expiration height of the ephemeral key.
     *
     * @return transactionID_ Newly created transaction id.
     */
    function submitAuthorizeSession(
        address _ephemeralKey,
        uint256 _spendingLimit,
        uint256 _expirationHeight
    )
        public
        onlyWallet
        keyIsNotNull(_ephemeralKey)
        keyDoesNotExist(_ephemeralKey)
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
     * @notice Revokes session for the specified ephemeral key.
     *
     * @dev Function revokes the key even if it has expired.
     *      Function requires:
     *          - Only registered wallet can call.
     *          - The key is authorized.
     *
     * @param _ephemeralKey Ephemeral key to revoke.
     */
    function revokeSession(address _ephemeralKey)
        external
        onlyWallet
        keyIsAuthorized(_ephemeralKey)
    {
        ephemeralKeys[_ephemeralKey].status = AuthorizationStatus.REVOKED;

        emit SessionRevoked(_ephemeralKey);
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
        payable
        returns (bool executionStatus_)
    {
        require(_to != address(token),"to address can't be EIP20 token.");
        require(
            _to != address(this),
            "to address can't be TokenHolder itself."
        );

        bytes32 messageHash = bytes32(0);
        address ephemeralKey = address(0);
        (messageHash, ephemeralKey) = verifyExecutableTransaction(
            EXECUTE_RULE_CALLPREFIX,
            _to,
            _data,
            _nonce,
            _v,
            _r,
            _s
        );

        EphemeralKeyData storage ephemeralKeyData = ephemeralKeys[ephemeralKey];

        TokenRules(tokenRules).allowTransfers();

        token.approve(
            tokenRules,
            ephemeralKeyData.spendingLimit
        );

        // solium-disable-next-line security/no-call-value
        executionStatus_ = _to.call.value(msg.value)(_data);

        token.approve(tokenRules, 0);

        TokenRules(tokenRules).disallowTransfers();

        bytes4 functionSelector = bytesToBytes4(_data);

        emit RuleExecuted(
            _to,
            functionSelector,
            ephemeralKey,
            _nonce,
            messageHash,
            executionStatus_
        );
    }

    /**
     * @notice Redeems the amount to the beneficiary.
     *
     * @dev Function validates executable signed data by checking that the
     *      specified signature matches one of the
     *      authorized (non-expired) ephemeral keys.
     *
     *      HashLock and facilitator is not part of data which ephemeral key
     *      is signing. User signs the data and facilitator calls redeem.
     *      Facilitator calling redeem should provide his HashLock.
     *
     *      In order to redeem, tokenholder needs to approve CoGateway
     *      contract for the redemption limit. Redeem is a payable
     *      function. The bounty is transferred in base token.
     *
     *      Function requires:
     *          - Ephemeral key is authorized.
     *          - Ephemeral key nonce is valid.
     *          - Redemption limit is more or equal to amount to redeem.
     *
     *      Update redeem signature after _facilitator argument is removed
     *      from CoGateway.redeem() in mosaic-contracts.
     *
     *      CoGateway contract address is needed for redeem functionality.
     *      It's fetched from UtilityToken. As per requirement TokenHolder
     *      should not be tightly integrated with utility token.
     *
     *      Reason for using .call is to consume(increment) ephemeral key
     *      nonce in case CoGateway.redeem fails.
     *
     * @param _amount Redeem amount that will be transferred from tokenholder
     *                account to beneficiary.
     * @param _beneficiary The address in the origin chain where the tokens
     *                     will be released.
     * @param _gasPrice Gas price that tokenholder is ready to pay to get the
     *                  redemption process done.
     * @param _gasLimit Gas limit that tokenholder is ready to pay.
     * @param _redeemerNonce redeemerNonce is nonce of this(current)
     *                       TokenHolder. It's stored in coGateway contract.
     * @param _hashLock Hash Lock provided by the facilitator.
     * @param _nonce The nonce of an ephemeral key that was used to sign
     *               the transaction.
     * @param _v V of the signature.
     * @param _r R of the signature.
     * @param _s S of the signature.
     *
     * @return executionStatus_ which is bool status of coGateway.redeem.
     */
    function redeem(
        uint256 _amount,
        address _beneficiary,
        uint256 _gasPrice,
        uint256 _gasLimit,
        uint256 _redeemerNonce,
        bytes32 _hashLock,
        uint256 _nonce,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    )
        public
        payable
        returns (bool executionStatus_)
    {
        address coGateway = getCoGateway();

        address ephemeralKey = verifyRedeemExecutableTransaction(
            _amount,
            _beneficiary,
            _gasPrice,
            _gasLimit,
            _redeemerNonce,
            coGateway,
            _nonce,
            _v,
            _r,
            _s
        );

        require(
            _amount <= ephemeralKeys[ephemeralKey].spendingLimit,
            "Amount to redeem should be lte to spending limit."
        );

        executionStatus_ = executeRedeem(
            coGateway,
            _amount,
            _beneficiary,
            _gasPrice,
            _gasLimit,
            _redeemerNonce,
            _hashLock
        );

        emit RedeemInitiated(
            _beneficiary,
            _amount,
            _redeemerNonce,
            ephemeralKey,
            executionStatus_
        );
    }

    /**
     * @notice Revert redemption to stop the redeem process.
     *
     * @dev Function validates executable signed data by checking that the
     *      specified signature matches one of the
     *      authorized (non-expired) ephemeral keys.
     *
     *      Reason for using .call is to consume(increment) ephemeral key
     *      nonce in case CoGateway.revertRedemption fails.
     *
     *      Function requires:
     *          - Ephemeral key is authorized.
     *          - Ephemeral key nonce is valid.
     *
     * @param _redeemMessageHash Message hash was returned while submitting
     *        redeem request.
     * @param _nonce The nonce of an ephemeral key that was used to sign
     *               the transaction.
     * @param _v V of the signature.
     * @param _r R of the signature.
     * @param _s S of the signature.
     *
     * @return executionStatus_ which is bool execution status of
     *         coGateway.revertRedemption.
     */
    function revertRedemption(
        bytes32 _redeemMessageHash,
        uint256 _nonce,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    )
        public
        payable
        returns (bool executionStatus_)
    {
        address coGateway = getCoGateway();

        bytes memory data = abi.encodeWithSelector(
            COGATEWAY_REVERT_REDEMPTION_SELECTOR,
            _redeemMessageHash
        );

        address ephemeralKey = address(0);
        (, ephemeralKey) = verifyExecutableTransaction(
            REVERT_REDEMPTION_RULE_CALLPREFIX,
            coGateway,
            data,
            _nonce,
            _v,
            _r,
            _s
        );

        // solium-disable-next-line security/no-call-value
        executionStatus_ = coGateway.call.value(msg.value)(data);

        emit RevertRedemptionInitiated(
            _redeemMessageHash,
            ephemeralKey,
            executionStatus_
        );
    }

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

    function authorizeSession(
        address _ephemeralKey,
        uint256 _spendingLimit,
        uint256 _expirationHeight
    )
        public
        onlyMultisig
        keyIsNotNull(_ephemeralKey)
        keyDoesNotExist(_ephemeralKey)
    {
        require(
            _expirationHeight > block.number,
            "Expiration height is lte to the current block height."
        );

        EphemeralKeyData storage keyData = ephemeralKeys[_ephemeralKey];

        keyData.spendingLimit = _spendingLimit;
        keyData.expirationHeight = _expirationHeight;
        keyData.nonce = 0;
        keyData.status = AuthorizationStatus.AUTHORIZED;
    }

    /**
     * @notice Fetches CoGateway Address from UtilityToken.
     *
     * @dev Using this public method user can know coGateway address which is
     *      needed for signing data in redeem and revertRedemption.
     *
     * @return CoGateway Address.
     */
    function getCoGateway()
        public
        view
        returns (address)
    {
        return UtilityTokenRequiredInterface(token).coGateway();
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

        EphemeralKeyData storage keyData = ephemeralKeys[key_];

        require(
            keyData.status == AuthorizationStatus.AUTHORIZED &&
            keyData.expirationHeight > block.number,
            "Ephemeral key is not active."
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

    /**
     * @notice Constructs data and performs verification of ephemeral key.
     *
     * @dev redeemData doesn't include all coGateway.redeem parameters.
     *  HashLock and facilitator are not part of data which ephemeral key is
     *  signing as this information is not known by the user at the time of
     *  signing. redeemData is needed to recover the ephemeral key.
     *
     * @param _amount Redeem amount that will be transferred from tokenholder
     *                account.
     * @param _beneficiary The address in the origin chain where the tokens
     *                     will be released.
     * @param _gasPrice Gas price that tokenholder is ready to pay to get the
     *                  redemption process done.
     * @param _gasLimit Gas limit that tokenholder is ready to pay.
     * @param _redeemerNonce Nonce of the redeemer address.
     * @param _coGateway CoGateway contract address.
     * @param _nonce The nonce of an ephemeral key that was used to sign
     *               the transaction.
     * @param _v V of the signature.
     * @param _r R of the signature.
     * @param _s S of the signature.
     *
     * @return ephemeralKey_ which is bool execution status of
     *         coGateway.redeem.
     */
    function verifyRedeemExecutableTransaction(
        uint256 _amount,
        address _beneficiary,
        uint256 _gasPrice,
        uint256 _gasLimit,
        uint256 _redeemerNonce,
        address _coGateway,
        uint256 _nonce,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    )
        private
        returns (address ephemeralKey_)
    {
        bytes memory redeemData = abi.encode(
            _amount,
            _beneficiary,
            _gasPrice,
            _gasLimit,
            _redeemerNonce
        );

        (, ephemeralKey_) = verifyExecutableTransaction(
            REDEEM_RULE_CALLPREFIX,
            _coGateway,
            redeemData,
            _nonce,
            _v,
            _r,
            _s
        );
    }

    /**
     * @notice Executes CoGateway redeem after approving amount to CoGateway.
     *
     * @param _coGateway CoGateway contract address.
     * @param _amount Redeem amount that will be transferred from tokenholder
     *                account.
     * @param _beneficiary The address in the origin chain where the tokens
     *                     will be released.
     * @param _gasPrice Gas price that tokenholder is ready to pay to get the
     *                  redemption process done.
     * @param _gasLimit Gas limit that tokenholder is ready to pay.
     * @param _redeemerNonce Nonce of the redeemer address.
     * @param _hashLock Hash Lock provided by the facilitator.
     *
     * @return executionStatus_ which is bool execution status of
     *         coGateway.redeem.
     */
    function executeRedeem(
        address _coGateway,
        uint256 _amount,
        address _beneficiary,
        uint256 _gasPrice,
        uint256 _gasLimit,
        uint256 _redeemerNonce,
        bytes32 _hashLock
    )
        private
        returns (bool executionStatus_)
    {
        token.approve(_coGateway, _amount);

        bytes memory data = abi.encodeWithSelector(
            COGATEWAY_REDEEM_SELECTOR,
            _amount,
            _beneficiary,
            msg.sender,
            _gasPrice,
            _gasLimit,
            _redeemerNonce,
            _hashLock
        );

        // solium-disable-next-line security/no-call-value
        executionStatus_ = _coGateway.call.value(msg.value)(data);

        token.approve(_coGateway, 0);
    }

}
