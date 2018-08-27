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


/**
 * @title MultiSigWallet Contract
 *
 * @notice Implement operations which require multiple confirmations.
 *         It is inherited by TokenHolder.sol.
 *
 */
contract MultiSigWalletV1 {

    /* Events */

    event Propose(
        bytes32 indexed _transactionId,
        address indexed _sender
    );

    event ConfirmationDone(
        bytes32 indexed _transactionId,
        address indexed _sender
    );

    event Revocation(
        bytes32 indexed _transactionId,
        address indexed _sender
    );

    event Execution(
        bytes32 indexed _transactionId,
        address indexed _sender
    );

    event ReplaceWallet(
        address indexed _sender,
        address indexed _oldWallet,
        address indexed _newWallet
    );

    event WalletAddition(
        bytes32 indexed _transactionId,
        address indexed _wallet
    );

    event WalletRemoval(
        bytes32 indexed _transactionId,
        address indexed _wallet
    );

    event RequirementChange(
        uint8 _required
    );

    /* Struct */

    /**
       It denotes which wallet has confirmed and status for the transaction.
       Status values could be :-
       0 :- initial state/Not proposed.
       1 :- Proposed state.
       2 :- Successfully executed state.
     */
    struct Confirmation{
        mapping(address => bool) isConfirmedBy;
        uint8 status;
    }


    /* Storage */

    /**
      It denotes the total number of confirmations required for an
      transaction to be executed.
     */
    uint8 public required;
    /** It maps status and who approved that transactionId. */
    mapping (bytes32 => Confirmation) public confirmations;
    /** It helps to direct lookup whether an wallet is already present or not */
    mapping (address => bool) public isWallet;
    /** It contains all the added wallets.*/
    address[] public wallets;


    /* Modifiers */

    /**
     * @notice Modifier onlyWallet.
     *
     * @dev Allows only registered wallet to call multi-sig methods.
     */
    modifier onlyWallet() {
        require(
            isWallet[msg.sender],
            "Transaction should be done by valid wallet!"
        );
        _;
    }

    /**
     * @notice Modifier validRequirement.
     *
     * @dev It checks for total number of confirmations required should be
     *       equal or less than the number of wallets.
     */
    modifier validRequirement(
        uint8 _walletCount,
        uint8 _required) {

        require(
            _required <= _walletCount &&
        _required != 0 &&
        _walletCount != 0,
            "Requirement to be set is incorrect"
        );
        _;
    }

    /**
     * @notice Contract constructor sets initial wallets and required number
     *          of confirmations.
     *
     * @param _wallets List of initial wallets.
     * @param _required Number of required confirmations.
     */
    constructor(
        address[] _wallets,
        uint8 _required
    )
        public
        validRequirement(uint8(_wallets.length), _required)
    {
        require(_wallets.length > 0,"Wallets cannot be empty");
        require(_required > 0,"Atleast one confirmation is required");
        require(
            _required <= uint8(_wallets.length),
            "Number of confirmations cannot be less than wallets"
        );

        for (uint8 i = 0; i < _wallets.length; i++) {
            require(
                !isWallet[_wallets[i]] && _wallets[i] != 0,
                "Wallet address is incorrect or duplicate"
            );
            isWallet[_wallets[i]] = true;
        }

        wallets = _wallets;
        required = _required;
    }


    /* Public functions */

    /**
     * @notice Allows to propose a new wallet or confirm an already proposed
     *         wallet.
     *
     * @param _wallet Address of wallet which is to be proposed or confirmed.
     * @param _proposeOrConfirm If true then transaction will be proposed
     *        otherwise confirmation is being done.
     *
     * @return transactionId_ which is unique for each request.
     */
    function proposeOrConfirmAddWallet(
        address _wallet,
        bool _proposeOrConfirm
    )
        onlyWallet
        validRequirement(uint8(wallets.length + 1), required)
        public
        returns (bytes32 transactionId_)
    {
        require(_wallet != 0, "Wallet address should not be null");
        require(!isWallet[_wallet], "Wallet address doesnt exist");

        // _proposeOrConfirm is not used in encode to ensure we get same
        //  transactionId for same set of parameters in propose and confirm flow.
        transactionId_ = keccak256(
            abi.encodePacked(_wallet, this, "addWallet")
        );

        if(_proposeOrConfirm) {
            require(
                isAlreadyProposedTransaction(transactionId_) == false,
                "Transaction is already proposed!"
            );
            performProposeTransaction(transactionId_);
        }
        else {
            performConfirmTransaction(transactionId_);
            // add wallet is being done
            if (isTransactionExecuted(transactionId_)) {
                isWallet[_wallet] = true;
                wallets.push(_wallet);
                emit WalletAddition(transactionId_, _wallet);
            }
        }
        return transactionId_;
    }

    /**
     * @notice Allows to propose removal of an wallet or confirm already
     *  proposed removal. Transaction has to be sent by wallet.
     *
     * @param _wallet Address of wallet.
     * @param _proposeOrConfirm If true then transaction will be proposed
     *        otherwise confirmation is being done.
     *
     * @return transactionId_ which is unique for each request.
     */
    function proposeOrConfirmRemoveWallet(
        address _wallet,
        bool _proposeOrConfirm
    )
        onlyWallet
        validRequirement(uint8(wallets.length - 1), required)
        public
        returns (bytes32 transactionId_)
    {
        require(_wallet != 0, "Wallet address should not be null");
        require(
            isWallet[_wallet],
            "Wallet should be added to proceed for this transaction"
        );

        // _proposeOrConfirm is not used in encode to ensure we get same
        //  transactionId_ for same set of parameters in propose and confirm flow.
        transactionId_ = keccak256(
            abi.encodePacked(_wallet, this, "removeWallet")
        );
        if(_proposeOrConfirm) {
            require(
                isAlreadyProposedTransaction(transactionId_) == false,
                "Transaction is already proposed!"
            );
            performProposeTransaction(transactionId_);
        }
        else {
            performConfirmTransaction(transactionId_);
            // Removal of wallet is being done.
            if(isTransactionExecuted(transactionId_)) {
                delete isWallet[_wallet];
                for (uint8 i = 0; i < wallets.length - 1; i++)
                    if (wallets[i] == _wallet) {
                        wallets[i] = wallets[wallets.length - 1];
                        break;
                    }
                wallets.length -= 1;
                // If after removal number of wallets are less than required
                // confirmations then set it to current number of wallets.
                if (required > wallets.length){
                    required = uint8(wallets.length);
                    emit RequirementChange(uint8(wallets.length));
                }
                emit WalletRemoval(transactionId_, _wallet);
            }
        }
        return transactionId_;
    }

    /**
     * @notice Allows to propose or confirmation intent to replace an wallet
     *         with a new wallet. Transaction has to be sent by wallet.
     *
     * @param _oldWallet Address of wallet to be replaced.
     * @param _newWallet Address of new wallet.
     * @param _proposeOrConfirm If true then transaction will be proposed
     *        otherwise confirmation is being done.
     *
     * @return transactionId_ which is unique for each request.
     */
    function _proposeOrConfirmReplaceWallet(
        address _oldWallet,
        address _newWallet,
        bool _proposeOrConfirm
    )
        public
        onlyWallet
        returns(bytes32 transactionId_)
    {
        require(!isWallet[_oldWallet], "Wallet address doesn't exist");

        // _proposeOrConfirm is not used in encode to ensure we get same
        // transactionId for same set of parameters in propose and confirm flow.
        transactionId_ = keccak256(
            abi.encodePacked(_oldWallet, _newWallet, this, "replaceWallet")
        );

        if(_proposeOrConfirm) {
            require(
                isAlreadyProposedTransaction(transactionId_) == false,
                "Transaction is already proposed!"
            );
            performProposeTransaction(transactionId_);
        }
        else {
            performConfirmTransaction(transactionId_);
            // old wallet is deleted and new wallet entry is done.
            if(isTransactionExecuted(transactionId_)){
                for (uint8 i = 0; i < wallets.length; i++)
                    if (wallets[i] == _oldWallet) {
                        wallets[i] = _newWallet;
                        break;
                    }
                delete isWallet[_oldWallet];
                isWallet[_newWallet] = true;
                emit ReplaceWallet(msg.sender, _oldWallet, _newWallet);
            }
        }
        return transactionId_;
    }

    /**
     * @notice Allows to propose or confirm intent for changing for the number
     *         of required confirmations.
     *         Transaction has to be sent by wallet.
     *
     * @param _required Number of required confirmations.
     * @param _proposeOrConfirm If true then transaction will be proposed
     *        otherwise confirmation is being done.
     *
     * @return transactionId_ which is unique for each unique request.
     */
    function _proposeOrConfirmChangeRequirement(
        uint8 _required,
        bool _proposeOrConfirm
    )
        public
        onlyWallet
        validRequirement(uint8(wallets.length), _required)
        returns(bytes32 transactionId_)
    {
        //_proposeOrConfirm is not used in encode to ensure we get same
        // transactionId_ for same set of parameters in propose and confirm flow.
        transactionId_ = keccak256(
            abi.encodePacked(_required, this, "changeRequirement")
        );
        if(_proposeOrConfirm) {
            require(
                isAlreadyProposedTransaction(transactionId_) == false,
                "Transaction is already proposed!"
            );
            performProposeTransaction(transactionId_);
        }
        else {
            performConfirmTransaction(transactionId_);
            if(isTransactionExecuted(transactionId_)) {
                // Old requirements i.e. number of required confirmations for
                // an transaction to be executed is being changed. */
                required = _required;
                emit RequirementChange(_required);
            }
        }
        return transactionId_;
    }

    /**
     * @notice Allows to propose or confirm intent for wallet to be revoked
     *         for a transaction.
     *
     * @param _transactionId Transaction ID.
     * @param _proposeOrConfirm If true then transaction will be proposed
     *        otherwise confirmation is being done.
     *
     * @return transactionId_ which is unique for each unique request.
     */
    function proposeOrConfirmRevokeConfirmation(
        bytes32 _transactionId,
        bool _proposeOrConfirm
    )
        public
        onlyWallet
        returns(bool /*success*/)
    {
        require(
            confirmations[_transactionId].status != 2,
            "Cannot revoke this transaction because it is already executed"
        );
        require(
            confirmations[_transactionId].isConfirmedBy[msg.sender],
            "Transaction is not confirmed by this wallet"
        );

        if(_proposeOrConfirm) {
            require(
                isAlreadyProposedTransaction(_transactionId) == false,
                "Transaction is already proposed!"
            );
            performProposeTransaction(_transactionId);
        }
        else {
            performConfirmTransaction(_transactionId);
            if(isTransactionExecuted(_transactionId)){
                confirmations[_transactionId].isConfirmedBy[msg.sender] = false;
                emit Revocation(
                    _transactionId,
                    msg.sender
                );
            }
        }
        return true;
    }

    /**
     * @dev Returns the confirmation status of a transaction.
     *
     * @param _transactionId Transaction ID.
     *
     * @return Confirmation status.
     */
    function isConfirmed(
        bytes32 _transactionId)
        public
        view
        returns (bool)
    {
        uint8 count = 0;
        for (uint8 i = 0; i < wallets.length; i++) {
            if (confirmations[_transactionId].isConfirmedBy[wallets[i]])
                count += 1;
            if (count == required)
                return true;
        }

        return false;
    }


    /* Internal functions */

    /**
     * @notice It is called whereever we need to propose transactions in
     *         multisig. The transaction status is in confirmed state for the
     *         wallet which has proposed it.
     *
     * @param _transactionId It marks it in proposed state against the wallet
     *         which has sent the transaction.
     */
    function performProposeTransaction(
        bytes32 _transactionId
    )
        internal
    {
        confirmations[_transactionId].status = 1;

        emit Propose(
            _transactionId,
            msg.sender
        );
    }

    /**
     * @notice It is used to send the transaction to confirmation state by the
     *         wallet who has sent the transaction.
     *
     * @param _transactionId It marks this transaction id as confirmed against
     *        the wallet which has sent the transaction.
     */
    function performConfirmTransaction(
        bytes32 _transactionId
    )
        internal
    {
        require(
            confirmations[_transactionId].status == 0,
            "Please first propose the transaction"
        );
        require(
            !confirmations[_transactionId].isConfirmedBy[msg.sender],
            "Transaction is already confirmed by this wallet"
        );

        confirmations[_transactionId].isConfirmedBy[msg.sender] = true;
        emit ConfirmationDone(
            _transactionId,
            msg.sender
        );
        if (isAlreadyProposedTransaction(_transactionId)) {
            if (isConfirmed(_transactionId)) {
                confirmations[_transactionId].status = 2;
            }
        }
    }

    /**
     * @notice  It is used to check whether the transaction is in proposed
     *          state.
     *
     * @param _transactionId It denotes whose transaction status
                (Proposed state) is to be checked.
     *
     * @return true if transaction is in proposed state.
     */
    function isAlreadyProposedTransaction(
        bytes32 _transactionId
    )
        internal
        view
        returns (bool /* success */)
    {
        return (confirmations[_transactionId].status == 1);
    }

    /**
     * @notice It check whether transaction is available for execution.
     *
     * @param _transactionId  For which transaction execution status is
     *        required.
     *
     * @return executed status.
     */
    function isTransactionExecuted(
        bytes32 _transactionId
    )
        internal
        view
        returns(bool /* success */)
    {
        return (confirmations[_transactionId].status == 2);
    }
}