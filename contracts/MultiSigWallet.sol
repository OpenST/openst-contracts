pragma solidity ^0.4.23;

/**
 *  @title MultiSigWallet Contract
 *
 *  @notice Implement operations which require multiple confirmations.It is inherited by TokenHolder.sol
 *
 */
// TODO confirmations mapping POC
// TODO make addWallet, removeWallet etc separate private functions
// TODO reusable functions
// TODO uint should be changed to uint256
// TODO use @notice for all functions. @dev is optional
// TODO new line after comment start in functions
// TODO compile contracts
contract MultiSigWallet {

    /** Events */

    event Propose(address sender,bytes32 transactionId);
    event Confirmation(address indexed sender, bytes32 indexed transactionId);
    event Revocation(address indexed sender, bytes32 indexed transactionId);
    // TODO add sender in below event
    event Execution(bytes32 indexed transactionId);
    // TODO why its needed
    event ExecutionFailure(bytes32 indexed transactionId);
    event WalletAddition(address indexed wallet);
    event WalletRemoval(address indexed wallet);
    event RequirementChange(uint8 required);

    /**  Storage */

    /** It contains all the wallets added.*/
    // TODO Do we need this?
    address[] public wallets;
    /** It denotes the total number of confirmations required for an transaction to be executed. */
    uint8 public required;

    /** It maps status for transactionId for a wallet.If it is true then that transaction is approved by the wallet address. */
    mapping(bytes32 => mapping(address => bool)) public confirmations;
    /** It helps to direct lookup whether an wallet is already present or not  */
    mapping(address => bool) public isWallet;
    /** isExecuted mapping allows to check if a transaction (by hash) was already proposed and executed.
        Values could be :-
        00 :- initial state/Not proposed.
        01 :- Proposed state.
        11 :- Successfully executed state.
     */
    mapping(bytes32 => uint8) public isExecuted;

    /** Modifiers */

    modifier onlyWallet() {
        require(isWallet[msg.sender] == true, "Transaction should be done by valid wallet!");
        _;
    }

    modifier walletDoesNotExist(address wallet) {
        require(!isWallet[wallet], "Wallet address doesnt exist");
        _;
    }

    modifier walletExists(address wallet) {
        require(isWallet[wallet], "Wallet should be added to proceed for this transaction");
        _;
    }
    // TODO add comments
    modifier confirmed(
        uint transactionId, // TODO should be bytes32
        address wallet) {

        require(confirmations[transactionId][wallet], "Transaction is not confirmed by this wallet");
        _;
    }

    modifier notConfirmed(
        bytes32 transactionId,
        address wallet) {

        require(!confirmations[transactionId][wallet]);
        _;
     }

    modifier notSuccessfullyExecuted(bytes32 transactionId) {
        /** Transaction should not be success */
        require(isExecuted[transactionId] != 2);
        _;
    }

    modifier notNull(address _address) {

        require(_address != 0, "Wallet address should not be null");
        _;
    }

    // TODO add comments
    modifier validRequirement(
        uint walletCount, // TODO make walletCount uint8
        uint8 _required) {

        require(_required <= walletCount
                && _required != 0
                && walletCount != 0,
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
        validRequirement(_wallets.length, _required)
    {
        require(_wallets.length > 0,"Wallets cannot be empty");
        require(_required > 0,"Atleast one confirmation is required");
        require(_required <= _wallets,"Number of confirmations cannot be less than wallets");

        // TODO make it uint8
        for (uint i = 0; i < _wallets.length; i++) {
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
      * @return transactionId   It is unique for each request.
      */
    function proposeOrConfirmAddWallet(
        address _wallet,
        bool _proposeOrConfirm)
        onlyWallet
        notNull(_wallet)
        walletDoesNotExist(_wallet)
        validRequirement(wallets.length + 1, required)
        public
        returns (bytes32 transactionId)
    {
        transactionId = keccak256(abi.encodePacked(_wallet, this, "addWallet"));
        if(_proposeOrConfirm) {
            require(isAlreadyProposedTransaction(transactionId) == false, "Transaction is already proposed!");
            performProposeTransaction(transactionId);
        }
        else {
            performConfirmTransaction(transactionId);
            // TODO take out in separate internal method
            if (isExecuted[transactionId] == 11) {
                // TODO refactor to new private method addWallet
                isWallet[_wallet] = true;
                wallets.push(_wallet);
                emit WalletAddition(_wallet);
            }
        }
        return transactionId;
    }

    /**
      * @notice Allows to propose removal of an wallet or confirm already proposed removal. Transaction has to be sent by wallet.
      *
      * @param wallet Address of wallet.
      * @param _proposeOrConfirm If true then transaction will be proposed otherwise confirmation is being done.
      *
      * @return transactionId   It is unique for each request.
      */
    function proposeOrConfirmRemoveWallet(
        address _wallet,
        bool _proposeOrConfirm)
        onlyWallet
        notNull(_wallet)
        walletExists(_wallet)
        public
        returns (bytes32 transactionId)
    {

        transactionId = keccak256(abi.encodePacked(_wallet, this, "removeWallet"));
        if(_proposeOrConfirm) {
            require(isAlreadyProposedTransaction(transactionId) == false, "Transaction is already proposed!");
            performProposeTransaction(transactionId);
        }
        else {
            performConfirmTransaction(transactionId);
            // TODO refactor to new method
            if(isExecuted[transactionId] == 11) {
                // TODO delete from mapping
                isWallet[wallet] = false;
                for (uint i = 0; i < wallets.length - 1; i++)
                    if (wallets[i] == wallet) {
                        wallets[i] = wallets[wallets.length - 1];
                        break;
                    }
                wallets.length -= 1;
                // TODO do we need this or another approach
                if (required > wallets.length)
                    changeRequirement(wallets.length);
                emit WalletRemoval(wallet);
            }
        }
        return transactionId;
    }


    /**
      * @notice Allows to propose or confirmation intent to replace an wallet with a new wallet. Transaction has to be sent by wallet.
      *
      * @param wallet Address of wallet to be replaced.
      * @param newWallet Address of new wallet.
      * @param _proposeOrConfirm If true then transaction will be proposed otherwise confirmation is being done.
      *
      * @return transactionId   It is unique for each request.
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
        transactionId = keccak256(abi.encodePacked(_oldWallet,_newWallet,this, "replaceWallet"));
        if(_proposeOrConfirm) {
            require(isAlreadyProposedTransaction(transactionId) == false, "Transaction is already proposed!");
            performProposeTransaction(transactionId);
        }
        else {
            performConfirmTransaction(transactionId);
            // TODO refactor seprate methos
            if(isExecuted[transactionId] == 11 ){
                for (uint i = 0; i < wallets.length; i++)
                if (wallets[i] == wallet) {
                    wallets[i] = newWallet;
                    break;
                }
            // TODO delete instead of false
            isWallet[wallet] = false;
            isWallet[newWallet] = true;
            // TODO should we have single replace wallet event?
            emit WalletRemoval(wallet);
            emit WalletAddition(newWallet);
            }
        }
        return transactionId;
     }

    /**
      * @notice Allows to propose or confirm intent for changing for the number of required confirmations. Transaction has to be sent by wallet.
      *
      * @param _required Number of required confirmations.
      * @param _proposeOrConfirm If true then transaction will be proposed otherwise confirmation is being done.
      *
      * @return transactionId   It is unique for each unique request.
      */
    function _proposeOrConfirmChangeRequirement(
        uint8 _required,
        bool _proposeOrConfirm)
        public
        onlyWallet
        validRequirement(wallets.length, _required)
        returns(bytes32 transactionId)
    {
        transactionId = keccak256(abi.encodePacked(_required, _newWallet, this, "changeRequirement"));
        if(_proposeOrConfirm) {
            require(isAlreadyProposedTransaction(transactionId) == false, "Transaction is already proposed!");
            performProposeTransaction(transactionId);
        }
        else {
            performConfirmTransaction(transactionId);
            // TODO refactor to new method
            if(isExecuted[transactionId] == 11) {
                required = _required;
                emit RequirementChange(_required);
            }
        }
    }

    /** @notice Allows to propose or confirm intent for wallet to be revoked for a transaction.
      *
      * @param transactionId Transaction ID.
      * @param _proposeOrConfirm If true then transaction will be proposed otherwise confirmation is being done.
      *
      * @return transactionId   It is unique for each unique request.
      */
    function _proposeOrConfirmRevokeConfirmation(
        bytes32 transactionId, // TODO _transactionId
        bool _proposeOrConfirm)
        public
        onlyWallet
        confirmed(transactionId, msg.sender)
        notSuccessfullyExecuted(transactionId)
        returns(bytes32 transactionId)
    {
        if(_proposeOrConfirm) {
            require(isAlreadyProposedTransaction(transactionId) == false, "Transaction is already proposed!");
            performProposeTransaction(transactionId);
        }
        else {
            performConfirmTransaction(transactionId);
            if(isExecuted[transactionId] == 11){
                // TODO should we delete this
                confirmations[transactionId][msg.sender] = false;
                emit Revocation(msg.sender, transactionId);
            }
        }
        return transactionId;
    }

    /** Internal functions */

    /**  @notice It is called whereever we need to propose transactions in multisig. The transaction status is in confirmed state for the wallet which has proposed it.`
      *
      *  @param transactionId It marks it in proposed state against the wallet which has sent the transaction.
      *
      */
    function performProposeTransaction(
        bytes32 transactionId) // TODO _transactionId
        internal
    {
        isExecuted[transactionId] = 01;
        confirmations[transactionId][msg.sender] = true;

        emit Propose(msg.sender, transactionId);
    }

    /**  @notice It is used to send the transaction to confirmation state by the wallet who has sent the transaction.
      *
      *  @param transactionId It marks this transaction id as confirmed against the wallet which has sent the transaction.
      */
    function performConfirmTransaction(
        bytes32 transactionId) // TODO _transactionId
        internal
        notConfirmed(transactionId, msg.sender)
    {
        require(isExecuted[transactionId] == 00, "Please first propose the transaction");
        confirmations[transactionId][msg.sender] = true;
        emit Confirmation(msg.sender, transactionId);
        if ((isExecuted[transactionId] == 1)) {//transaction is not executed,only proposed
            if (isConfirmed(transactionId)) {
                isExecuted[transactionId] = 11;
            }

        }

    }

    /** @notice  It is used to check whether the transaction is in proposed state.
      *
      * @param transactionId It denotes whose transaction status(Proposed state) is to be checked.
      *
      * @bool  If true then transaction is in proposed state.
      */
    function isAlreadyProposedTransaction(
        bytes32 transactionId)
        internal
        returns (bool /* success */)
    {
        return isExecuted[transactionId] == 1;
    }

}