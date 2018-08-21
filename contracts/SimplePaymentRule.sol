pragma solidity ^0.4.24;


// Copyright 2018 OpenST Ltd.
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

import "./TokenRules.sol";
import "./SharedStructs.sol";

contract SimpleTransferRule {

    /* Variables */

    TokenRules tokenRules;


    /* Functions */

    constructor (
        TokenRules _tokenRules
    )
        public
    {
        tokenRules = _tokenRules;
    }

    function execute (
        address _from,
        address _to,
        uint256 _amount
    )
        public
        returns (bool)
    {
        SharedStructs.TokenRuleTransfer[] memory transfers = new
            SharedStructs.TokenRuleTransfer[](1);
        transfers[0].to = _to;
        transfers[0].amount = _amount;

        tokenRules.executeTransfers(_from, transfers);

        return true;
    }
}