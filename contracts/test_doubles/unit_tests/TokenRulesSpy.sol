pragma solidity ^0.5.0;

import "../../EIP20TokenInterface.sol";

contract TokenRulesSpy {

    /* Structs */

    struct TransactionEntry {
        address from;
        address[] transfersTo;
        uint256[] transfersAmount;
    }


    /* Storage */

    EIP20TokenInterface public token;

    TransactionEntry[] public transactions;

    uint256 public transactionsLength;

    mapping (address => bool) public allowedTransfers;


    /* Special Functions */

    constructor(EIP20TokenInterface _token)
        public
    {
        require(address(_token) != address(0), "Token address is null.");

        token = _token;
    }


    /* External Functions */

    function allowTransfers()
        external
    {
        allowedTransfers[msg.sender] = true;
    }

    function disallowTransfers()
        external
    {
        allowedTransfers[msg.sender] = false;
    }

    function fromTransaction(uint256 index)
        external
        view
        returns (address)
    {
        return transactions[index].from;
    }

    function transfersToTransaction(uint256 index)
        external
        view
        returns (address[] memory)
    {
        return transactions[index].transfersTo;
    }

    function transfersAmountTransaction(uint256 index)
        external
        view
        returns (uint256[] memory)
    {
        return transactions[index].transfersAmount;
    }

    function executeTransfers(
        address _from,
        address[] calldata _transfersTo,
        uint256[] calldata _transfersAmount
    )
        external
    {
        TransactionEntry memory entry = TransactionEntry({
            from: _from,
            transfersTo: new address[](0),
            transfersAmount: new uint256[](0)
        });

        transactions.push(entry);

        for (uint256 i = 0; i < _transfersTo.length; ++i) {
            transactions[transactionsLength].transfersTo.push(_transfersTo[i]);
        }

        for (uint256 i = 0; i < _transfersAmount.length; ++i) {
            transactions[transactionsLength].transfersAmount.push(
                _transfersAmount[i]
            );
        }

        ++transactionsLength;
    }

}
