pragma solidity ^0.5.0;

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

import "../../../external/SafeMath.sol";
import "../../../rules/CreditRule.sol";

contract CustomRuleWithCredit {

    /* Usings */

    using SafeMath for uint256;

    event Pay(
        address _to,
        uint256 _amount
    );

    /* Storage */

    CreditRule public creditRule;

    bool public markedToFail;


    /* Special Functions */

    constructor(
        address _creditRule
    )
        public
    {
        require(
            address(_creditRule) != address(0),
            "Credit rule's address is null."
        );

        creditRule = CreditRule(_creditRule);
    }


    /* External Functions */

    function makeMeFail()
        external
    {
        markedToFail = true;
    }

    function pay(
        address _to,
        uint256 _amount
    )
        external
    {
        require(
            !markedToFail,
            "The function is marked to fail."
        );

        address[] memory transfersTo = new address[](1);
        transfersTo[0] = _to;

        uint256[] memory transfersAmount = new uint256[](1);
        transfersAmount[0] = _amount;

        creditRule.executeTransfers(
            msg.sender,
            transfersTo,
            transfersAmount
        );

        emit Pay(_to, _amount);
    }
}
