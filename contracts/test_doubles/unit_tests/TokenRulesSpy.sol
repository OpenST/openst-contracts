pragma solidity ^0.5.0;

// Copyright 2019 OpenST Ltd.
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
