pragma solidity ^0.4.23;

/**
 *  @title MultiSigWallet Contract
 *
 *  @notice Implement operations which require multiple confirmations.It is inherited by TokenHolder.sol
 *
 */
contract MultiSigWallet {

    /** Events */

    event Propose(address indexed sender,bytes32 transactionId);
    event ConfirmationDone(address indexed sender, bytes32 indexed transactionId);
    event Revocation(address indexed sender, bytes32 indexed transactionId);
    event Execution(address indexed sender, bytes32 indexed transactionId);
    event ReplaceWallet(address indexed sender,address _oldWallet, address _newWallet);
    event WalletAddition(address indexed sender, address indexed wallet);
    event WalletRemoval(address indexed sender, address indexed wallet);
    event RequirementChange(uint8 required);

    /**  Storage */

    /** It denotes the total number of confirmations required for an transaction to be executed. */
    uint8 public required;

    /** It denotes which wallet has confirmed and status for the transaction.
       Status values could be :-
       0 :- initial state/Not proposed.
       1 :- Proposed state.
       2 :- Successfully executed state.
    */
    struct Confirmation{
        mapping(address => bool) isConfirmedBy;
        uint8 status;
    }

    mapping(bytes32 => Confirmation) confirmations;
    /** It maps status for transactionId for a wallet.If it is true then that transaction is approved by the wallet address. */
    /** It helps to direct lookup whether an wallet is already present or not  */
    mapping(address => bool) public isWallet;
    /** It contains all the added wallets.*/
    address[] public wallets;

    /** Modifiers */

    /**
	 *  @notice Modifier onlyWallet.
	 *
	 *  @dev Allows only registered wallet to call multi-sig methods.
	 */
    modifier onlyWallet() {
        require(isWallet[msg.sender] == true, "Transaction should be done by valid wallet!");
        _;
    }

    /**
	 *  @notice Modifier walletDoesNotExist.
	 *
	 *  @dev Checks whether wallets doesn't exist.
	 */
    modifier walletDoesNotExist(
        address _wallet) {
        require(!isWallet[_wallet], "Wallet address doesnt exist");
        _;
    }


    /**
	 *  @notice Modifier walletExists.
	 *
	 *  @dev Checks whether wallet exists.
	 */
    modifier walletExists(
        address _wallet) {
        require(isWallet[_wallet], "Wallet should be added to proceed for this transaction");
        _;
    }


    /**
     *  @notice Modifier confirmed.
     *
     *  @dev It checks whether the transaction is confirmed by the wallet.
     */
    modifier confirmed(
        bytes32 _transactionId,
        address _wallet) {

        require(confirmations[_transactionId].isConfirmedBy[_wallet], "Transaction is not confirmed by this wallet");
        _;
    }

    /**
	 *  @notice Modifier notConfirmed.
	 *
	 *  @dev Checks whether transactions is not confirmed by wallet.
	 */
    modifier notConfirmed(
        bytes32 _transactionId,
        address _wallet) {

        require(!confirmations[_transactionId].isConfirmedBy[_wallet]);
        _;
    }

    /**
	 *  @notice Modifier onlyWallet.
	 *
	 *  @dev Checks whether transactions are successfully executed or not.
	 */
    modifier notSuccessfullyExecuted(
        bytes32 _transactionId) {
        /** Transaction should not be in success state */
        require(confirmations[_transactionId].status != 2);
        _;
    }

    /**
	 *  @notice Modifier notNull.
	 *
	 *  @dev Checks whether the wallet address is not null.
	 */
    modifier notNull(
        address _address) {

        require(_address != 0, "Wallet address should not be null");
        _;
    }

    /**
	 *  @notice Modifier validRequirement.
	 *
	 *  @dev It checks for total number of confirmations required should be equal or less than the number of wallets.
	 */
    modifier validRequirement(
        uint8 _walletCount,
        uint8 _required) {

        require(_required <= _walletCount
                && _required != 0
                && _walletCount != 0,
                "Requirement to be set is incorrect");
        _;
    }

    /**
      * @notice Contract constructor sets initial wallets and required number of confirmations.
      *
      * @param _wallets List of initial wallets.
      * @param _required Number of required confirmations.
      */
    constructor(
        address[] _wallets,
        uint8 _required)
        public
        validRequirement(uint8(_wallets.length), _required)
    {
        require(_wallets.length > 0,"Wallets cannot be empty");
        require(_required > 0,"Atleast one confirmation is required");
        require(_required <= uint8(_wallets.length),"Number of confirmations cannot be less than wallets");

        for (uint8 i = 0; i < _wallets.length; i++) {
            require(!isWallet[_wallets[i]] && _wallets[i] != 0, "Wallet address is incorrect or duplicate");
            isWallet[_wallets[i]] = true;
        }

        wallets = _wallets;
        required = _required;
    }

    /** Public functions */

    /**
      * @notice Allows to propose a new wallet or confirm an already proposed wallet.
      *
      * @param _wallet Address of wallet which is to be proposed or confirmed.
      * @param _proposeOrConfirm If true then transaction will be proposed otherwise confirmation is being done.
      *
      * @return bytes32 transactionId is unique for each request.
      */
    function proposeOrConfirmAddWallet(
        address _wallet,
        bool _proposeOrConfirm)
        onlyWallet
        notNull(_wallet)
        walletDoesNotExist(_wallet)
        validRequirement(uint8(wallets.length + 1), required)
        public
        returns (bytes32 transactionId)
    {
        /* _proposeOrConfirm is not used in encode to ensure we get same transactionId for same set of parameters in propose and confirm flow. */
        transactionId = keccak256(abi.encodePacked(_wallet, this, "addWallet"));
        if(_proposeOrConfirm) {
            require(isAlreadyProposedTransaction(transactionId) == false, "Transaction is already proposed!");
            performProposeTransaction(transactionId);
        }
        else {
            performConfirmTransaction(transactionId);
            /** add wallet is being done */
            if (isTransactionExecuted(transactionId)) {
                isWallet[_wallet] = true;
                wallets.push(_wallet);
                emit WalletAddition(msg.sender, _wallet);
            }
        }
        return transactionId;
    }

    /**
      * @notice Allows to propose removal of an wallet or confirm already proposed removal. Transaction has to be sent by wallet.
      *
      * @param _wallet Address of wallet.
      * @param _proposeOrConfirm If true then transaction will be proposed otherwise confirmation is being done.
      *
      * @return bytes32 transactionId is unique for each request.
      */
    function proposeOrConfirmRemoveWallet(
        address _wallet,
        bool _proposeOrConfirm)
        onlyWallet
        notNull(_wallet)
        walletExists(_wallet)
        validRequirement(uint8(wallets.length - 1), required)
        public
        returns (bytes32 transactionId)
    {
        /* _proposeOrConfirm is not used in encode to ensure we get same transactionId for same set of parameters in propose and confirm flow. */
        transactionId = keccak256(abi.encodePacked(_wallet, this, "removeWallet"));
        if(_proposeOrConfirm) {
            require(isAlreadyProposedTransaction(transactionId) == false, "Transaction is already proposed!");
            performProposeTransaction(transactionId);
        }
        else {
            performConfirmTransaction(transactionId);
            /** Removal of wallet is being done */
            if(isTransactionExecuted(transactionId)) {
                delete isWallet[_wallet];
                for (uint8 i = 0; i < wallets.length - 1; i++)
                    if (wallets[i] == _wallet) {
                        wallets[i] = wallets[wallets.length - 1];
                        break;
                    }
                wallets.length -= 1;
                /* If after removal number of wallets are less than required confirmations then set it to current number of wallets. */
                if (required > wallets.length){
                    required = uint8(wallets.length);
                    emit RequirementChange(uint8(wallets.length));
                }
                emit WalletRemoval(msg.sender, _wallet);
            }
        }
        return transactionId;
    }


    /**
      * @notice Allows to propose or confirmation intent to replace an wallet with a new wallet. Transaction has to be sent by wallet.
      *
      * @param _oldWallet Address of wallet to be replaced.
      * @param _newWallet Address of new wallet.
      * @param _proposeOrConfirm If true then transaction will be proposed otherwise confirmation is being done.
      *
      * @return bytes32 transactionId is unique for each request.
      */
    function _proposeOrConfirmReplaceWallet(
        address _oldWallet,
        address _newWallet,
        bool _proposeOrConfirm)
        public
        onlyWallet
        walletExists(_oldWallet)
        walletDoesNotExist(_newWallet)
        returns(bytes32 transactionId)
    {
        /* _proposeOrConfirm is not used in encode to ensure we get same transactionId for same set of parameters in propose and confirm flow. */
        transactionId = keccak256(abi.encodePacked(_oldWallet, _newWallet, this, "replaceWallet"));
        if(_proposeOrConfirm) {
            require(isAlreadyProposedTransaction(transactionId) == false, "Transaction is already proposed!");
            performProposeTransaction(transactionId);
        }
        else {
            performConfirmTransaction(transactionId);
            /** old wallet is deleted and new wallet entry is done */
            if(isTransactionExecuted(transactionId)){
                for (uint8 i = 0; i < wallets.length; i++)
                    if (wallets[i] == _oldWallet) {
                        wallets[i] = _newWallet;
                        break;
                    }
                //isWallet[wallet] = false;
                delete isWallet[_oldWallet];
                isWallet[_newWallet] = true;
                emit ReplaceWallet(msg.sender, _oldWallet, _newWallet);
            }
        }
        return transactionId;
    }

    /**
      * @notice Allows to propose or confirm intent for changing for the number of required confirmations.
      *         Transaction has to be sent by wallet.
      *
      * @param _required Number of required confirmations.
      * @param _proposeOrConfirm If true then transaction will be proposed otherwise confirmation is being done.
      *
      * @return bytes32 transactionId is unique for each unique request.
      */
    function _proposeOrConfirmChangeRequirement(
        uint8 _required,
        bool _proposeOrConfirm)
        public
        onlyWallet
        validRequirement(uint8(wallets.length), _required)
        returns(bytes32 transactionId)
    {
        /* _proposeOrConfirm is not used in encode to ensure we get same transactionId for same set of parameters in propose and confirm flow. */
        transactionId = keccak256(abi.encodePacked(_required, this, "changeRequirement"));
        if(_proposeOrConfirm) {
            require(isAlreadyProposedTransaction(transactionId) == false, "Transaction is already proposed!");
            performProposeTransaction(transactionId);
        }
        else {
            performConfirmTransaction(transactionId);
            if(isTransactionExecuted(transactionId)) {
                /** Old requirements i.e. number of required confirmations for an transaction to be executed is being changed */
                required = _required;
                emit RequirementChange(_required);
            }
        }
        return transactionId;
    }

    /**
      * @notice Allows to propose or confirm intent for wallet to be revoked for a transaction.
      *
      * @param _transactionId Transaction ID.
      * @param _proposeOrConfirm If true then transaction will be proposed otherwise confirmation is being done.
      *
      * @return bytes32 transactionId is unique for each unique request.
      */
    function proposeOrConfirmRevokeConfirmation(
        bytes32 _transactionId,
        bool _proposeOrConfirm)
        public
        onlyWallet
        confirmed(_transactionId, msg.sender)
        notSuccessfullyExecuted(_transactionId)
        returns(bytes32 transactionId)
    {
        if(_proposeOrConfirm) {
            require(isAlreadyProposedTransaction(_transactionId) == false, "Transaction is already proposed!");
            performProposeTransaction(_transactionId);
        }
        else {
            performConfirmTransaction(_transactionId);
            if(isTransactionExecuted(_transactionId)){
                confirmations[_transactionId].isConfirmedBy[msg.sender] = false;
                emit Revocation(msg.sender, _transactionId);
            }
        }
        return transactionId;
    }

    /** Internal functions */

    /**
      * @notice It is called whereever we need to propose transactions in multisig. The transaction status is in confirmed state for the wallet which has proposed it.`
      *
      * @param _transactionId It marks it in proposed state against the wallet which has sent the transaction.
      *
      */
    function performProposeTransaction(
        bytes32 _transactionId)
        internal
    {
        confirmations[_transactionId].status = 1;

        emit Propose(msg.sender, _transactionId);
    }

    /**
      * @notice It is used to send the transaction to confirmation state by the wallet who has sent the transaction.
      *
      * @param _transactionId It marks this transaction id as confirmed against the wallet which has sent the transaction.
      */
    function performConfirmTransaction(
        bytes32 _transactionId)
        internal
        notConfirmed(_transactionId, msg.sender)
    {
        require(confirmations[_transactionId].status == 0, "Please first propose the transaction");
        confirmations[_transactionId].isConfirmedBy[msg.sender] = true;
        emit ConfirmationDone(msg.sender, _transactionId);
        if (isAlreadyProposedTransaction(_transactionId)) {
            if (isConfirmed(_transactionId)) {
                confirmations[_transactionId].status = 2;
            }
        }
    }

    /**
      * @notice  It is used to check whether the transaction is in proposed state.
      *
      * @param _transactionId It denotes whose transaction status(Proposed state) is to be checked.
      *
      * @return bool If true then transaction is in proposed state.
      */
    function isAlreadyProposedTransaction(
        bytes32 _transactionId)
        internal
        view
        returns (bool /* success */)
    {
        return (confirmations[_transactionId].status == 1);
    }

    /**
      * @notice It check whether transaction is available for execution
      *
      * @param _transactionId  For which transaction execution status is required.
      *
      * @return bool executed status
      */
    function isTransactionExecuted(
        bytes32 _transactionId)
        internal
        view
        returns(bool /* success */)
    {
        return (confirmations[_transactionId].status == 2);
    }

    /**
      * @dev Returns the confirmation status of a transaction.
      *
      * @param _transactionId Transaction ID.
      *
      * @return bool Confirmation status.
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
    }

}