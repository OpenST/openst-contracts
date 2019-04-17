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
import "../token/TransfersAgent.sol";


/**
 * Credit rules allows a budget holder to credit a user with an amount
 * that the user can *only* spents in a token economy. A custom rule
 * is deployed with a CreditRule acting as a TransfersAgent to execute
 * transfers. CreditRule first transfers a minimum of credited amount and
 * needed transfer amount, afterwards delegate the transfer execution to
 * TransfersAgent itself.
 *
 * Steps to utilize CreditRule:
 *  - A custom rule is deployed by passing a CreditRule address to act as
 *    a transfers agent for the rule.
 *  - A token holder signs an executable transaction to execute the custom rule.
 *  - The budget holder signs an executable transaction to execute
 *    CreditRule::executeRule function with a credit amount, and the token
 *    holder's address and executeRule's function data as an argument.
 */
contract CreditRule is TransfersAgent {

    /* Usings */

    using SafeMath for uint256;


    /* Storage */

    address public budgetHolder;

    TransfersAgent public transfersAgent;

    mapping(address => uint256) public credits;


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
        address _transfersAgent
    )
        public
    {
        require(
            _budgetHolder != address(0),
            "Budget holder's address is null."
        );

        require(
            _transfersAgent != address(0),
            "Transfers agent's address is null."
        );

        budgetHolder = _budgetHolder;

        transfersAgent = TransfersAgent(_transfersAgent);
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
        returns(
            bool executionStatus_,
            bytes memory returnData_
        )
    {
        require(
            _creditAmount != 0,
            "Credit amount is 0."
        );

        require(
            _to != address(0),
            "To (token holder) address is null."
        );

        require(
            credits[_to] == 0,
            "Re-entrancy occured in crediting process."
        );

        credits[_to] = _creditAmount;

        // solium-disable-next-line security/no-call-value
        (executionStatus_, returnData_) = _to.call.value(msg.value)(_data);

        delete credits[_to];
    }

    function executeTransfers(
        address _from,
        address[] calldata _transfersTo,
        uint256[] calldata _transfersAmount
    )
        external
    {
        uint256 creditAmount = credits[_from];
        if (creditAmount > 0) {
            uint256 sumAmount = 0;

            for(uint256 i = 0; i < _transfersAmount.length; ++i) {
                sumAmount = sumAmount.add(_transfersAmount[i]);
            }

            uint256 amountToTransferFromBudgetHolder = (
                sumAmount > creditAmount ? creditAmount : sumAmount
            );

            executeTransfer(
                budgetHolder,
                _from,
                amountToTransferFromBudgetHolder
            );
        }

        transfersAgent.executeTransfers(
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

        transfersAgent.executeTransfers(
            _from,
            transfersTo,
            transfersAmount
        );
    }
}
