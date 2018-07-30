pragma solidity ^0.4.23;

contract MultiSigWallet {

    /*
    *  Events
    */
    event Confirmation(address indexed sender, uint indexed transactionId);
    event Revocation(address indexed sender, uint indexed transactionId);
    event Execution(uint indexed transactionId);
    event ExecutionFailure(uint indexed transactionId);
    event WalletAddition(address indexed wallet);
    event WalletRemoval(address indexed wallet);
    event RequirementChange(uint required);

    /*
     *  Constants
     */
    //uint constant public MAX_OWNER_COUNT = 50;

    /*
     *  Storage
     */
    //mapping (uint => Transaction) public transactions;//check this..remove it if possible
    mapping (bytes32 => mapping (address => bool)) public confirmations;
    mapping (address => bool) public isWallet;
    address[] public wallets;
    uint public required;

    // isExecuted mapping allows to check if a transaction (by hash) was already proposed and executed.
    // Values could be :-
    // 00 :- initial state/Not proposed.
    // 01 :- Proposed state.
    // 10 :- Failed state.
    // 11 :- Successfully executed state.
    mapping (bytes32 => uint8) public isExecuted;

    /*
     *  Modifiers
     */
    modifier onlyMultiSigWallet() {
        require(msg.sender == address(this),"Only wallet is allowed to do transaction for this operation");
        _;
    }

    modifier walletDoesNotExist(address wallet) {
        require(!isWallet[wallet],"Wallet address doesnt exist");
        _;
    }

    modifier walletExists(address wallet) {
        require(isWallet[wallet],"Wallet should be added to proceed for this transaction");
        _;
    }
    //seems to be not needed
    //    modifier transactionExists(uint transactionId) {//check this
    //        require(transactions[transactionId].destination != 0);
    //        _;
    //    }

    modifier confirmed(uint transactionId, address wallet) {
        require(confirmations[transactionId][wallet],"Transaction is not confirmed by this wallet");
        _;
    }

    modifier notConfirmed(uint transactionId, address wallet) {
        require(!confirmations[transactionId][wallet]);
        _;
    }

    modifier notExecuted(bytes32 transactionId) {
        require(!isExecuted[transactionId]);
        _;
    }

    modifier notNull(address _address) {
        require(_address != 0,"Wallet address should not be null");
        _;
    }

    modifier validRequirement(uint walletCount, uint _required) {
        require(//ownerCount <= MAX_OWNER_COUNT &&
            _required <= walletCount
        && _required != 0
        && walletCount != 0,"Required to be set is incorrect or not null");
        _;
    }

    /*
     * Public functions
     */
    /// @dev Contract constructor sets initial wallets and required number of confirmations.
    /// @param _wallets List of initial wallets.
    /// @param _required Number of required confirmations.
    constructor(address[] _wallets, uint _required)
    public
    validRequirement(_wallets.length, _required)
    {
        for (uint i=0; i<_wallets.length; i++) {
            require(!isWallet[_wallets[i]] && _wallets[i] != 0,"Wallet address is incorrect or duplicate");
            isWallet[_wallets[i]] = true;
        }
        wallets = _wallets;
        required = _required;
    }

    /// @dev Allows to add a new wallet. Transaction has to be sent by wallet.
    /// @param wallet Address of new wallet.
    function addWallet(address wallet)
    public
    onlyMultiSigWallet
    walletDoesNotExist(wallet)
    notNull(wallet)
    validRequirement(wallets.length + 1, required)
    {
        isWallet[wallet] = true;
        wallets.push(wallet);
        emit WalletAddition(wallet);
    }

    /// @dev Allows to remove an wallet. Transaction has to be sent by wallet.
    /// @param wallet Address of wallet.
    function removeWalletO(address wallet)
    public
    onlyMultiSigWallet
    walletExists(wallet)
    {
        isWallet[wallet] = false;
        for (uint i=0; i<wallets.length - 1; i++)
            if (wallets[i] == wallet) {
                wallets[i] = wallets[wallets.length - 1];
                break;
            }
        wallets.length -= 1;
        if (required > wallets.length)
            changeRequirement(wallets.length);
        emit WalletRemoval(wallet);
    }

    /// @dev Allows to replace an wallet with a new wallet. Transaction has to be sent by wallet.
    /// @param wallet Address of wallet to be replaced.
    /// @param newWallet Address of new wallet.
    function replaceWallet(address wallet, address newWallet)
    public
    onlyMultiSigWallet
    walletExists(wallet)
    walletDoesNotExist(newWallet)
    {
        for (uint i=0; i<wallets.length; i++)
            if (wallets[i] == wallet) {
                wallets[i] = newWallet;
                break;
            }
        isWallet[wallet] = false;
        isWallet[newWallet] = true;
        emit WalletRemoval(wallet);
        emit WalletAddition(newWallet);
    }

    /// @dev Allows to change the number of required confirmations. Transaction has to be sent by wallet.
    /// @param _required Number of required confirmations.
    function changeRequirement(uint _required)
    public
    onlyMultiSigWallet
    validRequirement(wallets.length, _required)
    {
        required = _required;
        emit RequirementChange(_required);
    }

    /// @dev Allows an wallet to submit and confirm a transaction.
    /// @param destination Transaction target address.
    /// @param value Transaction ether value.
    /// @param data Transaction data payload.
    /// @return Returns transaction ID.
    function proposeTransaction(
        address to,
        uint256 value,
        bytes data,
        Enum.Operation operation,// Change this
        uint256 nonce)
    public
    returns (bytes32 transactionId)
    {
        transactionId = getTransactionHash(to, value, data, operation, nonce);
        isExecuted[transactionId] = 01;
        confirmations[transactionId][msg.sender] = true;
        confirmTransaction(transactionId);
    }

    /// @dev Allows an wallet to confirm a transaction.
    /// @param transactionId Transaction ID.
    function confirmTransaction(
        address to,
        uint256 value,
        bytes data,
        Enum.Operation operation,// Change this
        uint256 nonce)
    public
    walletExists(msg.sender)
    notConfirmed(transactionId, msg.sender) //transactionExists(transactionId) check whether this is needed
    {
        bytes32 transactionId = getTransactionHash(to, value, data, operation, nonce);
        require(isExecuted[transactionId] == 00,"Please first propose the transaction");
        confirmations[transactionId][msg.sender] = true;
        emit Confirmation(msg.sender, transactionId);
        executeTransaction(transactionId);
        if((isExecuted[transactionId] == 01)){ //transaction is not executed,only proposed
            if (isConfirmed(transactionId)) {
                isExecuted[transactionId] = 11;
                if (execute(to, value, data, operation, gasleft()))
                    emit Execution(transactionId);
                else {
                    emit ExecutionFailure(transactionId);
                    isExecuted[transactionId] = 10;
                }
            }

        }

    }

    function execute(address to, uint256 value, bytes data, Enum.Operation operation, uint256 txGas)
    internal
    returns (bool success)
    {
        if (operation == Enum.Operation.Call){
            assembly {
                success := call(txGas, to, value, add(data, 0x20), mload(data), 0, 0)
            }
        }
        //        else if (operation == Enum.Operation.DelegateCall)
        //            success = executeDelegateCall(to, data, txGas);
        //        else {
        //            address newContract = executeCreate(data);
        //            success = newContract != 0;
        //            emit ContractCreation(newContract);
        //        }
    }

    /// @dev Allows an wallet to revoke a confirmation for a transaction.
    /// @param transactionId Transaction ID.
    function revokeConfirmation(bytes32 transactionId)
    public
    walletExists(msg.sender)
    confirmed(transactionId, msg.sender)
    notExecuted(transactionId)
    {
        confirmations[transactionId][msg.sender] = false;
        emit Revocation(msg.sender, transactionId);
    }

//    /// @dev Allows anyone to execute a confirmed transaction.
//    /// @param transactionId Transaction ID.
//    function executeTransaction(bytes32 transactionId)
//    public
//    walletExists(msg.sender)
//    confirmed(transactionId, msg.sender)
//    notExecuted(transactionId)
//    {
//        if (isConfirmed(transactionId)) {
//            //Transaction storage txn = transactions[transactionId];
//            //txn.executed = true;
//            isExecuted[transactionId] = true;
//            if (external_call(txn.destination, txn.value, txn.data.length, txn.data))
//                Execution(transactionId);
//            else {
//                ExecutionFailure(transactionId);
//                txn.executed = false;
//            }
//        }
//    }

    // call has been separated into its own function in order to take advantage
    // of the Solidity's code generator to produce a loop that copies tx.data into memory.
//    function external_call(address destination, uint value, uint dataLength, bytes data) private returns (bool) {
//        bool result;
//        assembly {
//            let x := mload(0x40)   // "Allocate" memory for output (0x40 is where "free memory" pointer is stored by convention)
//            let d := add(data, 32) // First 32 bytes are the padded length of data, so exclude that
//            result := call(
//            sub(gas, 34710),   // 34710 is the value that solidity is currently emitting
//            // It includes callGas (700) + callVeryLow (3, to pay for SUB) + callValueTransferGas (9000) +
//            // callNewAccountGas (25000, in case the destination address does not exist and needs creating)
//            destination,
//            value,
//            d,
//            dataLength,        // Size of the input (in bytes) - this is what fixes the padding problem
//            x,
//            0                  // Output is ignored, therefore the output size is zero
//            )
//        }
//        return result;
//    }

    /// @dev Returns the confirmation status of a transaction.
    /// @param transactionId Transaction ID.
    /// @return Confirmation status.
    function isConfirmed(bytes32 transactionId)
    public
    constant
    returns (bool)
    {
        uint count = 0;
        for (uint i=0; i<wallets.length; i++) {
            if (confirmations[transactionId][wallets[i]])
                count += 1;
            if (count == required)
                return true;
        }
    }

    /*
     * Web3 call functions
     */
    /// @dev Returns number of confirmations of a transaction.
    /// @param transactionId Transaction ID.
    /// @return Number of confirmations.
    function getConfirmationCount(bytes32 transactionId)
    public
    constant
    returns (uint count)
    {
        for (uint i=0; i<wallets.length; i++)
            if (confirmations[transactionId][wallets[i]])
                count += 1;
    }

    /// @dev Returns total number of transactions after filers are applied.
    /// @param pending Include pending transactions.
    /// @param executed Include executed transactions.
    /// @return Total number of transactions after filters are applied.
    function getTransactionCount(bool pending, bool executed)
    public
    constant
    returns (uint count)
    {
        for (uint i=0; i<transactionCount; i++)
            if (   pending && !transactions[i].executed
            || executed && transactions[i].executed)
                count += 1;
    }

    /// @dev Returns list of wallets.
    /// @return List of wallet addresses.
    function getWallets()
    public
    constant
    returns (address[])
    {
        return wallets;
    }

    /// @dev Returns array with wallet addresses, which confirmed transaction.
    /// @param transactionId Transaction ID.
    /// @return Returns array of wallet addresses.
    function getConfirmations(bytes32 transactionId)
    public
    constant
    returns (address[] _confirmations)
    {
        address[] memory confirmationsTemp = new address[](wallets.length);
        uint count = 0;
        uint i;
        for (i=0; i<wallets.length; i++)
            if (confirmations[transactionId][wallets[i]]) {
                confirmationsTemp[count] = wallets[i];
                count += 1;
            }
        _confirmations = new address[](count);
        for (i=0; i<count; i++)
            _confirmations[i] = confirmationsTemp[i];
    }

    /// @dev Returns list of transaction IDs in defined range.
    /// @param from Index start position of transaction array.
    /// @param to Index end position of transaction array.
    /// @param pending Include pending transactions.
    /// @param executed Include executed transactions.
    /// @return Returns array of transaction IDs.
    function getTransactionIds(uint from, uint to, bool pending, bool executed)
    public
    constant
    returns (uint[] _transactionIds)
    {
        uint[] memory transactionIdsTemp = new uint[](transactionCount);
        uint count = 0;
        uint i;
        for (i=0; i<transactionCount; i++)
            if (   pending && !transactions[i].executed
            || executed && transactions[i].executed)
            {
                transactionIdsTemp[count] = i;
                count += 1;
            }
        _transactionIds = new uint[](to - from);
        for (i=from; i<to; i++)
            _transactionIds[i - from] = transactionIdsTemp[i];
    }



    /// @dev Returns hash to be signed by wallets.
    /// @param to Destination address.
    /// @param value Ether value.
    /// @param data Data payload.
    /// @param operation Operation type.
    /// @param nonce Transaction nonce.
    /// @return Transaction hash.
    function getTransactionHash(
        address to,
        uint256 value,
        bytes data,
        Enum.Operation operation,
        uint256 nonce
    )
    public
    view
    returns (bytes32)
    {
        return keccak256(abi.encodePacked(byte(0x19), byte(0), this, to, value, data, operation, nonce));
    }

}