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
//
// ----------------------------------------------------------------------------
// Utility Chain: MultiSigWallet
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

import "./SafeMath.sol";


/**
 * @title Allows multiple parties to agree on transactions before execution.
 */
contract MultiSigWallet {

    /* Usings */

    using SafeMath for uint256;


    /* Events */

    event WalletAdditionSubmitted(
        uint256 indexed _transactionID,
        address _wallet
    );

    event WalletRemovalSubmitted(
        uint256 indexed _transactionID,
        address _wallet
    );

    event RequirementChangeSubmitted(
        uint256 indexed _transactionID,
        uint256 _required
    );

    event WalletReplacementSubmitted(
        uint256 indexed _transactionID,
        address _oldWallet,
        address _newWallet
    );

    event TransactionConfirmed(uint256 indexed _transactionID, address _wallet);

    event TransactionConfirmationRevoked(
        uint256 indexed _transactionID,
        address _wallet
    );

    event TransactionExecutionSucceeded(uint256 indexed _transactionID);

    event TransactionExecutionFailed(uint256 indexed _transactionID);


    /* Constants */

    bytes4 constant public ADD_WALLET_CALLPREFIX = bytes4(
        keccak256("addWallet(address)")
    );

    bytes4 constant public REMOVE_WALLET_CALLPREFIX = bytes4(
        keccak256("removeWallet(address)")
    );

    bytes4 constant public REPLACE_WALLET_CALLPREFIX = bytes4(
        keccak256("replaceWallet(address,address)")
    );

    bytes4 constant public CHANGE_REQUIREMENT_CALLPREFIX = bytes4(
        keccak256("changeRequirement(uint256)")
    );


    /* Structs */

    struct Transaction {
        address destination;
        bytes data;
        bool executed;
    }


    /* Storage */

    /**
     * Specifies the number of confirmations required for a proposed
     * transaction to be executed.
     */
    uint256 public required;

    /** Direct lookup to check existence of a wallet. */
    mapping (address => bool) public isWallet;

    address[] public wallets;

    /** Mapping from transaction ids to transaction confirmations status. */
    mapping (uint256 => mapping (address => bool)) public confirmations;

    /** Mapping from transaction ids to transactions. */
    mapping (uint256 => Transaction) public transactions;

    /** Submitted transaction count. */
    uint256 public transactionCount;


    /* Modifiers */

    /**
     * Checks that:
     *      - Number of confirmations (requirement) is less than or
     *        equal to the wallet numbers.
     *      - Requirement is not 0.
     *      - Wallet count is not 0.
     */
    modifier validRequirement(uint256 _walletCount, uint256 _required)
    {
        require(
            _required <= _walletCount &&
            _required != uint256(0) &&
            _walletCount != uint256(0),
            "Requirement validity not fulfilled."
        );
        _;
    }

    modifier onlyMultisig()
    {
        require(
            msg.sender == address(this),
            "Only multisig is allowed to call."
        );
        _;
    }

    modifier onlyWallet()
    {
        require(
            isWallet[msg.sender],
            "Only wallet is allowed to call."
        );
        _;
    }

    modifier walletExists(address _wallet)
    {
        require(
            isWallet[_wallet],
            "Wallet does not exist."
        );
        _;
    }

    modifier walletDoesNotExist(address _wallet)
    {
        require(
            !isWallet[_wallet],
            "Wallet exists."
        );
        _;
    }

    modifier transactionExists(uint256 _transactionID)
    {
        require(
            transactions[_transactionID].data.length != 0,
            "Transaction does not exist."
        );
        _;
    }

    modifier transactionIsConfirmedBy(uint256 _transactionID, address _wallet)
    {
        require(
            confirmations[_transactionID][_wallet],
            "Transaction is not confirmed by the wallet."
        );
        _;
    }

    modifier transactionIsNotConfirmedBy(
        uint256 _transactionID,
        address _wallet
    )
    {
        require(
            !confirmations[_transactionID][_wallet],
            "Transaction is confirmed by the wallet."
        );
        _;
    }

    modifier transactionIsNotExecuted(uint256 _transactionID)
    {
        require(
            !transactions[_transactionID].executed,
            "Transaction is executed."
        );
        _;
    }

    /**
     * Modifier is used as a replacement to require call as this check
     * should be done before calling other modifiers like validRequirement.
     */
    modifier walletIsNotNull(address _address)
    {
        require(
            _address != address(0),
            "Wallet address is null."
        );
        _;
    }


    /* Special Functions */

    /**
     * @dev Contract constructor sets initial wallets and required number of
     *      confirmations.
     *      Requires:
     *          - Requirement validity held.
     *          - No wallet address is null.
     *          - No duplicate wallet address in list.
     *
     * @param _wallets List of initial wallets.
     * @param _required Number of required confirmations.
     */
    constructor(address[] _wallets, uint256 _required)
        public
        validRequirement(_wallets.length, _required)
    {
        for (uint256 i = 0; i < _wallets.length; i++) {
            require(_wallets[i] != address(0), "Wallet address is 0.");
            require(!isWallet[_wallets[i]], "Duplicate wallet address.");
            isWallet[_wallets[i]] = true;
        }

        wallets = _wallets;
        required = _required;
    }


    /* External Functions */

    /**
     * @notice Submits a transaction for wallet addition.
     *
     * @dev Function requires:
     *          - Only registered wallet can call.
     *          - Wallet to add is not null.
     *          - Wallet to add does not exist.
     *          - Requirement validity held.
     *
     * @return Newly created transaction id.
     */
    function submitAddWallet(address _wallet)
        external
        onlyWallet
        walletIsNotNull(_wallet)
        walletDoesNotExist(_wallet)
        validRequirement(wallets.length.add(1), required)
        returns (uint256 transactionID_)
    {
        transactionID_ = addTransaction(
            address(this),
            abi.encodeWithSelector(ADD_WALLET_CALLPREFIX, _wallet)
        );

        emit WalletAdditionSubmitted(transactionID_, _wallet);

        confirmTransaction(transactionID_);
    }

    /**
     * @notice Submits a transaction for wallet removal.
     *
     * @dev Updates the requirement by setting equal to the registered wallets
     *      number if after wallet removal the requirement is bigger then
     *      the wallet number.
     *      Function requires:
     *          - Only registered wallet can call.
     *          - Wallet to remove exists.
     *
     * @return Newly created transaction id.
     */
    function submitRemoveWallet(address _wallet)
        external
        onlyWallet
        walletExists(_wallet)
        returns (uint256 transactionID_)
    {
        require(
            wallets.length > 1,
            "Last wallet cannot be submitted for removal."
        );

        transactionID_ = addTransaction(
            address(this),
            abi.encodeWithSelector(REMOVE_WALLET_CALLPREFIX, _wallet)
        );

        emit WalletRemovalSubmitted(transactionID_, _wallet);

        confirmTransaction(transactionID_);
    }

    /**
     * @notice Submits a transaction for a wallet replacement.
     *
     * @dev Function requires:
     *          - Only registered wallet can call.
     *          - Old wallet exists.
     *          - New wallet address is not null.
     *          - New wallet does not exist.
     *
     * @param _oldWallet Wallet to remove.
     * @param _newWallet Wallt to add.
     *
     * @return Newly created transaction id.
     */
    function submitReplaceWallet(address _oldWallet, address _newWallet)
        external
        onlyWallet
        walletExists(_oldWallet)
        walletIsNotNull(_newWallet)
        walletDoesNotExist(_newWallet)
        returns (uint256 transactionID_)
    {
        transactionID_ = addTransaction(
            address(this),
            abi.encodeWithSelector(
                REPLACE_WALLET_CALLPREFIX,
                _oldWallet,
                _newWallet
            )
        );

        emit WalletReplacementSubmitted(transactionID_, _oldWallet, _newWallet);

        confirmTransaction(transactionID_);
    }

    /**
     * @notice Submits a transaction for changing the requirement.
     *
     * @dev Function requires:
     *          - Only registered wallet can call.
     *          - Requirement validity held.
     *
     * @param _required The number of required confirmations.
     *
     * @return Newly created transaction id.
     */
    function submitRequirementChange(uint256 _required)
        external
        onlyWallet
        validRequirement(wallets.length, _required)
        returns (uint256 transactionID_)
    {
        transactionID_ = addTransaction(
            address(this),
            abi.encodeWithSelector(CHANGE_REQUIREMENT_CALLPREFIX, _required)
        );

        emit RequirementChangeSubmitted(transactionID_, _required);

        confirmTransaction(transactionID_);
    }


    /* Public Functions */

    /**
     * @notice Confirms the transaction by the caller.
     *
     * @dev After confirmation by the caller, function asks to execute
     *      transaction. If required number of confirmations were done
     *      execution happens.
     *      Function requires:
     *          - Only registered wallet can call.
     *          - Transaction exists.
     *          - Transaction was not confirmed by the caller.
     */
    function confirmTransaction(uint256 _transactionID)
        public
        onlyWallet
        transactionExists(_transactionID)
        transactionIsNotConfirmedBy(_transactionID, msg.sender)
    {
        confirmations[_transactionID][msg.sender] = true;

        emit TransactionConfirmed(_transactionID, msg.sender);

        executeTransaction(_transactionID);
    }

    /**
     * @notice Revokes confirmation made previously by the caller wallet.
     *
     * @dev Function requires:
     *          - Only registered wallet can call.
     *          - Transaction to revoke exists.
     *          - Transaction was confirmed previously be the caller.
     *          - Transaction was not executed.
     *
     * @param _transactionID Transaction id to revoke the previous confirmation.
     */
    function revokeConfirmation(uint256 _transactionID)
        public
        onlyWallet
        transactionExists(_transactionID)
        transactionIsConfirmedBy(_transactionID, msg.sender)
        transactionIsNotExecuted(_transactionID)
    {
        confirmations[_transactionID][msg.sender] = false;

        emit TransactionConfirmationRevoked(_transactionID, msg.sender);
    }

    /**
     * @dev Executes transaction if it is confirmed.
     *
     *      Marks stored transaction object's 'executed' field false if
     *      transaction failed otherwise true.
     *      Registered wallet could execute failed transaction again.
     *
     *      Function requires:
     *          - Only registered wallet can call.
     *          - Transaction exists.
     *          - Transaction is confirmed by the caller wallet.
     *          - Transaction is not executed.
     *
     * @param _transactionID Transaction ID to execute.
     */
    function executeTransaction(uint256 _transactionID)
        public
        onlyWallet
        transactionExists(_transactionID)
        transactionIsConfirmedBy(_transactionID, msg.sender)
        transactionIsNotExecuted(_transactionID)
    {
        if (isTransactionConfirmed(_transactionID)) {
            Transaction storage t = transactions[_transactionID];
            if (t.destination.call(t.data)) {
                t.executed = true;
                emit TransactionExecutionSucceeded(_transactionID);
            } else {
                t.executed = false;
                emit TransactionExecutionFailed(_transactionID);
            }
        }
    }

    /**
     * @notice Adds a new wallet.
     *
     * @dev Validity of requirement is going to be called in all
     *      functions that alter either wallets count or required confirmations
     *      count. This needs to make sure that imporant invariant always
     *      holds.
     *      Function requires:
     *          - Wallet address to add is not null.
     *          - Wallet to add does not exist.
     *          - Transaction is sent by multisig.
     *          - Requirement validity held.
     *
     * @param _wallet Wallet address to add.
     */
    function addWallet(address _wallet)
        public
        onlyMultisig
        walletIsNotNull(_wallet)
        walletDoesNotExist(_wallet)
        validRequirement(wallets.length.add(1), required)
    {
        isWallet[_wallet] = true;
        wallets.push(_wallet);
    }

   /**
     * @notice Remove the specified wallet.
     *
     * @dev Function requires:
     *          - Transaction is sent by multisig.
     *          - Wallet address to remove exists.
     *
     * @param _wallet Wallet address to remove.
     */
    function removeWallet(address _wallet)
        public
        onlyMultisig
        walletExists(_wallet)
    {
        delete isWallet[_wallet];

        for (uint256 i = 0; i < wallets.length - 1; i++) {
            if (wallets[i] == _wallet) {
                wallets[i] = wallets[wallets.length - 1];
                break;
            }
        }
        wallets.length = wallets.length.sub(1);
        if (required > wallets.length) {
            changeRequirement(wallets.length);
        }
    }

    /**
     * @notice Replace the wallet with a new one.
     *
     * @dev Function requires:
     *          - Only multisig can call.
     *          - Wallet to remove exists.
     *          - Wallet to add is not null.
     *          - Wallet to add does not exist.
     *
     * @param _oldWallet Wallet to remove.
     * @param _newWallet Wallet to add.
     */
    function replaceWallet(address _oldWallet, address _newWallet)
        public
        onlyMultisig
        walletExists(_oldWallet)
        walletIsNotNull(_newWallet)
        walletDoesNotExist(_newWallet)
    {
        for (uint256 i = 0; i < wallets.length; i++) {
            if (wallets[i] == _oldWallet) {
                wallets[i] = _newWallet;
                break;
            }
        }
        isWallet[_oldWallet] = false;
        isWallet[_newWallet] = true;
    }

    /**
     * @notice Changes requirement.
     *
     * @dev Function requires:
     *          - Transaction is sent by multisig.
     *          - Requirement validity held.
     *
     * @param _required The number of required confirmations.
     *
     * @return transactionId_ of the proposal.
     */
    function changeRequirement(
        uint256 _required
    )
        public
        onlyMultisig
        validRequirement(wallets.length, _required)
    {
        required = _required;
    }

    /** @notice Returns the number of registered wallets. */
    function walletCount()
        public
        view
        returns(uint256)
    {
        return wallets.length;
    }


    /* Internal Functions */

    /**
     * @notice Returns the confirmation status of a transaction.
     *
     * @dev Transaction is confirmed if wallets' count that confirmed
     *      the transaction is bigger or equal to required.
     *      Function checks confirmation condition based on current set of
     *      registered wallet.
     *      Function requires:
     *          - Transaction with the specified id exists.
     *
     * @param _transactionID Transaction id to check.
     *
     * @return Returns true in case if transaction confirmed, otherwise
     *         false.
     */
    function isTransactionConfirmed(uint256 _transactionID)
        internal
        view
        transactionExists(_transactionID)
        returns (bool)
    {
        uint256 count = 0;
        for (uint256 i = 0; i < wallets.length; i++) {
            if (confirmations[_transactionID][wallets[i]]) {
                count += 1;
            }
            if (count == required) {
                return true;
            }
        }

        return false;
    }

    /**
     * @dev Adds a new transaction into transactions mapping.
     *      Function requires:
     *          - Destination address is not null.
     *          - Data payload is not empty.
     *
     *
     * @param _destination Transaction destination address to execute against.
     * @param _data Transaction data payload.
     *
     * @return transactionID_ Returns newly created transaction id.
     */
    function addTransaction(address _destination, bytes _data)
        internal
        returns (uint256 transactionID_)
    {
        require(
            _destination != address(0),
            "Destination address is null."
        );
        require(
            _data.length != 0,
            "Payload data length is 0."
        );

        transactionID_ = transactionCount;

        transactions[transactionID_] = Transaction({
            destination: _destination,
            data: _data,
            executed: false
        });

        transactionCount = transactionCount.add(1);
    }

}