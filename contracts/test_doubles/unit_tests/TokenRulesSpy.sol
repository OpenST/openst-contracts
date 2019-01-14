pragma solidity ^0.5.0;

contract TokenRulesSpy {

    /* Storage */

    mapping (address => bool) public allowedTransfers;

    address public recordedFrom;

    address[] public recordedTransfersTo;
    uint256 public recordedTransfersToLength;

    uint256[] public recordedTransfersAmount;
    uint256 public recordedTransfersAmountLength;


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
        address[] calldata _transfersTo,
        uint256[] calldata _transfersAmount
    )
        external
    {
        recordedFrom = _from;

        recordedTransfersTo = _transfersTo;
        recordedTransfersToLength = _transfersTo.length;

        recordedTransfersAmount = _transfersAmount;
        recordedTransfersAmountLength = _transfersAmount.length;
    }

}
