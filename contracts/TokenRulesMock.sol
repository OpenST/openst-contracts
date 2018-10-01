pragma solidity ^0.4.23;

contract TokenRulesMock {

    /* Storage */

    mapping (address => bool) public allowedTransfers;


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

}
