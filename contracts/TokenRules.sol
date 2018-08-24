pragma solidity ^0.4.23;
pragma experimental ABIEncoderV2;

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

import "./SharedStructs.sol";
import "./TokenRulesTokenInterface.sol";
import "./SafeMath.sol";


contract TokenRules {

     /* Usings */

    using SafeMath for uint256;


    /* Events */

    event RuleRegistered(
        address _sender,
        string _ruleName,
        address _ruleAddress
    );

    event ConstraintAdded(address _sender, address _constraintAddress);

    event ConstraintRemoved(address _sender, address _constraintAddress);


    /* Variables */

    SharedStructs.TokenRule[] public rules;
    mapping (string => SharedStructs.TokenRule) public rulesByName;
    mapping (address => SharedStructs.TokenRule) public rulesByAddress;

    SharedStructs.TokenRuleConstraint[] public constraints;

    address public organization;
    address public token;


    /* Modifiers */

    modifier onlyOrganization {
        require(
            organization == msg.sender,
            "Only organization is allowed to call."
        );
        _;
    }

    modifier onlyRule {
        require (
            rulesByAddress[msg.sender].ruleAddress != address(0),
            "Only registered rule is allowed to call");
        _;
    }


    /* Functions */

    constructor (
        address _organization,
        address _token
    )
        public
    {
        require(_organization != address(0), "Organization address is null.");
        require(_token != address(0), "Token address is null.");

        organization = _organization;
        token = _token;
    }

    /**
     * @param _ruleName The name of a rule to register.
     * @param _ruleAddress The address of a rule to register.
     *
     * @return true in case of success, otherwise false.
     */
    function registerRule (
        string _ruleName,
        address _ruleAddress
    )
        external
        onlyOrganization
        returns (bool)
    {
        require(bytes(_ruleName).length != 0, "Rule name is empty.");
        require(_ruleAddress != address(0), "Rule address is null.");
        require (
            rulesByName[_ruleName].ruleAddress == address(0),
            "Rule name exists."
        );
        require (
            rulesByAddress[_ruleAddress].ruleAddress == address(0),
            "Rule address exists."
        );

        SharedStructs.TokenRule memory rule;
        rule.ruleName = _ruleName;
        rule.ruleAddress = _ruleAddress;

        rulesByName[_ruleName] = rule;
        rulesByAddress[_ruleAddress] = rule;
        rules.push(rule);

        emit RuleRegistered(msg.sender, _ruleName, _ruleAddress);

        return true;
    }

    function executeTransfers (
        address _from,
        SharedStructs.TokenRuleTransfer[] _transfers
    )
        external
        onlyRule
        returns (bool)
    {
        if (0 == _transfers.length) {
            return true;
        }

        require (
            checkConstraints(_from, _transfers),
            "Constraints not fullfilled."
        );

        for (uint256 i = 0; i < _transfers.length; ++i) {
            TokenRulesTokenInterface(token).transferFrom(
                _from,
                _transfers[i].to,
                _transfers[i].amount
            );
        }

        TokenRulesTokenInterface(token).clearAllowance(_from);

        return true;
    }

    function addConstraint (
        address _constraintAddress
    )
        external
        onlyOrganization
        returns (bool)
    {
        require(_constraintAddress != address(0), "Constraint to add is null.");

        uint256 index = findConstraintIndex(_constraintAddress);

        require (
            index == constraints.length,
            "Constraint to add already exists."
        );

        constraints.push(
            SharedStructs.TokenRuleConstraint(
                {constraintAddress: _constraintAddress}
            )
        );

        emit ConstraintAdded(msg.sender, _constraintAddress);

        return true;
    }

    function removeConstraint (
        address _constraintAddress
    )
        external
        onlyOrganization
        returns (bool)
    {
        require (
            _constraintAddress != address(0),
            "Constraint to remvoe is null."
        );

        uint256 index = findConstraintIndex(_constraintAddress);

        require (
            index != constraints.length,
            "Constraint to remove does not exist."
        );

        removeConstraintByIndex(index);

        return true;
    }

    function checkConstraints (
        address _from,
        SharedStructs.TokenRuleTransfer[] _transfers
    )
        public
        view
        returns (bool)
    {
        return true;
    }

    /**
     * @dev Finds index of constraint.
     *
     * @param _constraint Constraint to find in constraints array.
     *
     * @return index_ Returns index of the constraint if exists,
     *                otherwise returns constraints.length.
     */
    function findConstraintIndex(address _constraint)
        private
        view
        returns (uint256 index_)
    {
        index_ = 0;
        while (
            index_ < constraints.length &&
            constraints[index_].constraintAddress != _constraint
        )
        {
            ++index_;
        }
    }

    // solium-disable-next-line security/no-assign-params
    function removeConstraintByIndex(uint256 _index)
        private
        returns (bool)
    {
        require (
            _index < 0 || _index >= constraints.length,
            "Index is out of range."
        );

        while ( _index < constraints.length - 1) {
            constraints[_index] = constraints[_index + 1];
            _index++;
        }

        --constraints.length;

        return true;
    }
}