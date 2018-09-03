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


/**
 * @title MultiSigWallet Contract
 *
 * @notice Implement operations that require multiple confirmations.
 */
contract MultiSigWallet {

    /* Usings */

    using SafeMath for uint256;


    /* Events */

    event Proposed (
        bytes32 indexed _transactionId,
        address indexed _sender
    );

    event Confirmed (
        bytes32 indexed _transactionId,
        address indexed _sender
    );

    event Revoked (
        bytes32 indexed _transactionId,
        address indexed _sender
    );

    event WalletReplaced (
        address indexed _sender,
        address indexed _oldWallet,
        address indexed _newWallet
    );

    event WalletAdded (
        bytes32 indexed _transactionId,
        address indexed _wallet
    );

    event WalletRemoved (
        bytes32 indexed _transactionId,
        address indexed _wallet
    );

    event RequirementChanged (
        uint256 _required
    );


    /* Structs */

    /**
     * Specifies which wallet has confirmed the proposed transaction and
     * confirmation status for the transaction.
     *
     * Confirmation status values are:
     *      0 : Initial (not proposed) state.
     *      1 : Proposed state.
     *      2 : Executed state.
     */
    struct Confirmation {
        mapping(address => bool) isConfirmedBy;
        uint8 status;
    }


    /* Storage */

    /**
     * Specifies the number of confirmations required for a proposed
     * transaction to be executed.
     */
    uint256 public required;

    /** Confirmation status per transaction. */
    mapping (bytes32 /* transaction id */ => Confirmation) public confirmations;

    /** Direct lookup to check existence of a wallet. */
    mapping (address => bool) public isWallet;

    /** Registered wallets. */
    address[] public wallets;


    /* Modifiers */

    modifier onlyWallet() {
        require(
            isWallet[msg.sender],
            "Only registered wallet is allowed to call."
        );
        _;
    }

    /**
     * Checks that the number of confirmations (requirement) is less then or
     * equal to the wallet numbers.
     */
    modifier validRequirement (uint256 _walletCount, uint256 _required) {
        require(
            _required <= _walletCount && _required != 0 && _walletCount != 0,
            "Requirement validity not fulfilled."
        );
        _;
    }


    /* Special Functions */

    /**
     * @param _wallets List of initial wallets.
     * @param _required Number of required confirmations.
     */
    constructor (
        address[] _wallets,
        uint256 _required
    )
        public
        validRequirement(_wallets.length, _required)
    {
        for (uint256 i = 0; i < _wallets.length; i++) {
            require(_wallets[i] != address(0), "Wallet address is 0.");
            require(isWallet[_wallets[i]] == false, "Wallet already exists.");
            isWallet[_wallets[i]] = true;
        }

        wallets = _wallets;
        required = _required;
    }


    /* Public Functions */

    /**
     * @notice Submits a transaction for the wallet addition.
     *
     * @dev If the wallet is already proposed for an addition by
     *      other wallet, the function only confirms that proposal.
     *
     * @param _wallet Address of wallet to add.
     *
     * @return transactionId_ Transaction id of the proposal.
     */
    function addWallet(
        address _wallet
    )
        public
        onlyWallet
        validRequirement(wallets.length.add(1), required)
        returns (bytes32 transactionId_)
    {
        require(_wallet != address(0), "Wallet address is 0.");
        require(isWallet[_wallet] == false, "Wallet address already exists.");

        transactionId_ = keccak256(
            abi.encodePacked(_wallet, address(this), "addWallet")
        );

        submitTransaction(transactionId_);

        if (isTransactionExecuted(transactionId_) == true) {
            isWallet[_wallet] = true;
            wallets.push(_wallet);
            emit WalletAdded(transactionId_, _wallet);
        }
    }

    /**
     * @notice Submits a transaction for the wallet removal.
     *
     * @dev If the wallet is already proposed for a removal by other wallet,
     *      the function only confirms that proposal.
     *      Updates the requirement by setting equal to the registered wallets
     *      number if after wallet removal the requirement is bigger then
     *      the wallet number.
     *      Once removed, the wallet could not be added back, only replaced
     *      with other registered wallet.
     *
     * @param _wallet Address of wallet to remove.
     *
     * @return transactionId_ of the proposal.
     */
    function removeWallet (
        address _wallet
    )
        public
        onlyWallet
        validRequirement(wallets.length.sub(1), required)
        returns (bytes32 transactionId_)
    {
        require(_wallet != address(0), "Wallet address is 0.");
        require(isWallet[_wallet] == true, "Wallet address does not exist.");

        transactionId_ = keccak256(
            abi.encodePacked(_wallet, address(this), "removeWallet")
        );

        submitTransaction(transactionId_);

        // Removal of wallet is being done.
        if (isTransactionExecuted(transactionId_) == true) {
            delete isWallet[_wallet];
            for (uint256 i = 0; i < wallets.length.sub(1); i++) {
                if (wallets[i] == _wallet) {
                    wallets[i] = wallets[wallets.length.sub(1)];
                    wallets.length = wallets.length.sub(1);
                    break;
                }
            }

            // If after removal number of wallets are less than required
            // confirmations then set it to current number of wallets.
            if (required > wallets.length) {
                required = wallets.length;
                emit RequirementChanged(wallets.length);
            }

            emit WalletRemoved(transactionId_, _wallet);
        }
    }

    /**
     * @notice Submits a transaction for the wallet replacement.
     *
     * @dev If the wallet is already proposed for a resplacement by other
     *      wallet, the function only confirms that proposal.
     *
     * @param _oldWallet Address of a wallet to replace.
     * @param _newWallet Address of wallet to add.
     *
     * @return transactionId_ of the proposal.
     */
    function replaceWallet(
        address _oldWallet,
        address _newWallet
    )
        public
        onlyWallet
        returns(bytes32 transactionId_)
    {
        require(_oldWallet != address(0), "Wallet address is 0.");
        require(_newWallet != address(0), "Wallet address is 0.");

        require(isWallet[_oldWallet] == true, "Wallet address does not exist.");
        require(isWallet[_newWallet] == false, "Wallet address already exists.");

        transactionId_ = keccak256(
            abi.encodePacked (
                _oldWallet,
                _newWallet,
                address(this),
                "replaceWallet"
            )
        );

        submitTransaction(transactionId_);

        if (isTransactionExecuted(transactionId_) == true) {
            for (uint256 i = 0; i < wallets.length; i++) {
                if (wallets[i] == _oldWallet) {
                    wallets[i] = _newWallet;
                    break;
                }
            }

            delete isWallet[_oldWallet];
            isWallet[_newWallet] = true;

            emit WalletReplaced(msg.sender, _oldWallet, _newWallet);
        }
    }

    /**
     * @notice Submits a transaction for chaning the requirement.
     *
     * @dev If the requirement change was already proposed by other
     *      wallet, the function only confirms that proposal.
     *
     * @param _required The number of required confirmations.
     *
     * @return transactionId_ of the proposal.
     */
    function changeRequirement (
        uint256 _required
    )
        public
        onlyWallet
        validRequirement(wallets.length, _required)
        returns(bytes32 transactionId_)
    {
        transactionId_ = keccak256(
            abi.encodePacked(_required, address(this), "changeRequirement")
        );

        submitTransaction(transactionId_);

        if (isTransactionExecuted(transactionId_) == true) {
            required = _required;
            emit RequirementChanged(_required);
        }
    }

    /**
     * @notice Revokes confirmation made before by the caller wallet.
     *
     * @dev Function requires:
     *          - The transaction is not executed.
     *          - The transaction is confirmed by the caller.
     *
     * @param _transactionId Transaction id to revoke the previous confirmation.
     *
     * @return True in case of success otherwise false.
     */
    function revokeConfirmation (
        bytes32 _transactionId
    )
        public
        onlyWallet
        returns(bool)
    {
        require(
            isTransactionExecuted(_transactionId) == false,
            "Transaction is already executed."
        );
        require(
            isConfirmedBy(_transactionId, msg.sender) == true,
            "Transaction is not confirmed by the caller wallet."
        );

        confirmations[_transactionId].isConfirmedBy[msg.sender] = false;
        emit Revoked(_transactionId, msg.sender);

        return true;
    }

    /** @notice Returns true if requirement was achieved. */
    function isRequirementAchieved(
        bytes32 _transactionId
    )
        public
        view
        returns (bool)
    {
        uint256 count = 0;
        for (uint256 i = 0; i < wallets.length; i++) {
            if (isConfirmedBy(_transactionId, wallets[i]) == true) {
                count.add(1);
            }
            if (required == count) {
                return true;
            }
        }

        return false;
    }


    /* Internal functions */

    function submitTransaction(bytes32 _transactionId)
        internal
        returns (bool)
    {
        proposeTransaction(_transactionId);
        confirmTransaction(_transactionId);
    }

    /**
     * @dev Proposes a transaction with the specified id.
     *      If transaction was proposed, the function returns successfully.
     *      Function requires:
     *          - Transaction was not executed.
     *
     * @param _transactionId Transaction id to propose.
     *
     * @return True in case of success otherwise false.
     */
    function proposeTransaction(
        bytes32 _transactionId
    )
        internal
        onlyWallet
        returns (bool)
    {
        require(
            isTransactionExecuted(_transactionId) == false,
            "Transaction was executed."
        );

        if (isTransactionProposed(_transactionId)) {
            return true;
        }

        // Marking the transaction status as proposed.
        confirmations[_transactionId].status = 1;

        emit Proposed(_transactionId, msg.sender);

        return true;
    }

    /**
     * @notice Marks transaction as confirmed by the caller wallet.
     *
     * @dev Function requires:
     *          - The transaction is in proposed state.
     *          - The transaction was not confirmed by the caller wallet.
     *
     * @param _transactionId Transaction id to confirm.
     */
    function confirmTransaction(
        bytes32 _transactionId
    )
        internal
        onlyWallet
        returns (bool)
    {
        require(
            confirmations[_transactionId].status == 1,
            "The transaction is not in propose state."
        );
        require(
            isConfirmedBy(_transactionId, msg.sender) == false,
            "Transaction was confirmed by the caller wallet."
        );

        confirmations[_transactionId].isConfirmedBy[msg.sender] = true;

        emit Confirmed(_transactionId, msg.sender);

        if (isRequirementAchieved(_transactionId) == true) {
            confirmations[_transactionId].status = 2;
        }
    }

    /**
     * @dev Function returns true if and only if the transaction is in
     *      proposed state.
     */
    function isTransactionProposed (
        bytes32 _transactionId
    )
        internal
        view
        returns (bool)
    {
        return confirmations[_transactionId].status == 1;
    }

    /**
     * @dev Function returns true if and only if the transaction is in
     *      executed state.
     */
    function isTransactionExecuted(
        bytes32 _transactionId
    )
        internal
        view
        returns (bool)
    {
        return confirmations[_transactionId].status == 2;
    }

    function isConfirmedBy (bytes32 _transactionId, address wallet)
        internal
        view
        returns (bool)
    {
        confirmations[_transactionId].isConfirmedBy[wallet];
    }
}