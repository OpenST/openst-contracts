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

import "../external/SafeMath.sol";
import "../token/TokenRules.sol";

contract CreditRule {

    /* Usings */

    using SafeMath for uint256;


    /* Struct */

    struct CreditInfo {
        uint256 amount;
        bool inProgress;
    }


    /* Storage */

    address public budgetHolder;

    TokenRules public tokenRules;

    mapping(address => CreditInfo) public credits;


    /* Modifiers */

    modifier onlyBudgetHolder()
    {
        require(
            msg.sender == budgetHolder,
            "Only budget holder is allowed to call."
        );

        _;
    }


    /* Special Functions */

    constructor(
        address _budgetHolder,
        address _tokenRules
    )
        public
    {
        require(
            _budgetHolder != address(0),
            "Budget holder's address is null."
        );

        require(
            _tokenRules != address(0),
            "Token rules's address is null."
        );

        budgetHolder = _budgetHolder;

        tokenRules = TokenRules(_tokenRules);
    }


    /* External Functions */

    function executeRule(
        uint256 _creditAmount,
        address _to, // token holder address
        bytes calldata _data // token holder execute rule data
    )
        external
        payable
        onlyBudgetHolder
        returns(bool executionStatus_)
    {
        require(_to != address(0));

        CreditInfo storage c = credits[_to];

        require(
            !c.inProgress,
            "Re-entrancy occured in crediting process."
        );

        c.inProgress = true;
        c.amount = _creditAmount;

        bytes memory returnData;
        // solium-disable-next-line security/no-call-value
        (executionStatus_, returnData) = address(_to).call.value(msg.value)(_data);

        c.amount = 0;
        c.inProgress = false;
    }

    function executeTransfers(
        address _from,
        address[] calldata _transfersTo,
        uint256[] calldata _transfersAmount
    )
        external
    {
        if (credits[_from].inProgress) {
            uint256 sumAmount = 0;

            for(uint256 i = 0; i < _transfersAmount.length; ++i) {
                sumAmount = sumAmount.add(_transfersAmount[i]);
            }

            uint256 creditAmount = credits[_from].amount;

            uint256 amountToTransferFromBudgetHolder = (
                sumAmount > creditAmount ? creditAmount : sumAmount
            );

            executeTransfer(
                budgetHolder,
                _from,
                amountToTransferFromBudgetHolder
            );
        }

        tokenRules.executeTransfers(
            _from,
            _transfersTo,
            _transfersAmount
        );
    }


    /* Private Functions */

    function executeTransfer(
        address _from,
        address _beneficiary,
        uint256 _amount
    )
        private
    {
        address[] memory transfersTo = new address[](1);
        transfersTo[0] = _beneficiary;

        uint256[] memory transfersAmount = new uint256[](1);
        transfersAmount[0] = _amount;

        tokenRules.executeTransfers(
            _from,
            transfersTo,
            transfersAmount
        );
    }

}
