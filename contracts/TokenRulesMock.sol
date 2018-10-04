pragma solidity ^0.4.23;

contract TokenRulesMock {

    /* Storage */

    mapping (address => bool) public allowedTransfers;
    address public from;
    address[] public transferTo;
    uint256[] public transferAmount;


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

    function executeTransfers(
        address _from,
        address[] _transfersTo,
        uint256[] _transfersAmount
    )
        external
    {

        from = _from;
        transferTo = _transfersTo;
        transferAmount = _transfersAmount;

    }

}
