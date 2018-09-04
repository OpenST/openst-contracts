pragma solidity ^0.4.23;

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

import "./TokenRulesTokenInterface.sol";
import "./ConstraintInterface.sol";
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


    /* Structs */

    struct TokenRule {
        string ruleName;
        address ruleAddress;
    }


    /* Variables */

    TokenRule[] public rules;
    mapping (address => TokenRule) public rulesByAddress;
    mapping (bytes32 => TokenRule) public rulesByNameHash;

    address[] public constraints;

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
        bytes32 ruleNameHash = keccak256(abi.encodePacked(_ruleName));
        require (
            rulesByNameHash[ruleNameHash].ruleAddress == address(0),
            "Rule name exists."
        );
        require (
            rulesByAddress[_ruleAddress].ruleAddress == address(0),
            "Rule address exists."
        );

        TokenRule memory rule;
        rule.ruleName = _ruleName;
        rule.ruleAddress = _ruleAddress;

        rulesByAddress[_ruleAddress] = rule;
        rulesByNameHash[ruleNameHash] = rule;
        rules.push(rule);

        emit RuleRegistered(msg.sender, _ruleName, _ruleAddress);

        return true;
    }

    function executeTransfers (
        address _from,
        address[] _transfersTo,
        uint256[] _transfersAmount
    )
        external
        onlyRule
        returns (bool)
    {
        require(
            _transfersTo.length == _transfersAmount.length,
            "'to' and 'amount' transfer arrays' lengths are not equal."
        );

        require (
            checkConstraints(_from, _transfersTo, _transfersAmount) == true,
            "Constraints not fullfilled."
        );

        for (uint256 i = 0; i < _transfersTo.length; ++i) {
            TokenRulesTokenInterface(token).transferFrom(
                _from,
                _transfersTo[i],
                _transfersAmount[i]
            );
        }

        TokenRulesTokenInterface(token).clearAllowance(_from);

        return true;
    }

    function checkConstraints (
        address _from,
        address[] _transfersTo,
        uint256[] _transfersAmount
    )
        public
        view
        returns (bool _passed)
    {
        _passed = true;

        for (uint256 i = 0; i < constraints.length && _passed; ++i) {
            _passed = ConstraintInterface(constraints[i]).check(
                _from,
                _transfersTo,
                _transfersAmount
            );
        }
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

        constraints.push(_constraintAddress);

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
            constraints[index_] != _constraint
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
        require (_index < constraints.length, "Index is out of range.");

        constraints[_index] = constraints[constraints.length - 1];
        --constraints.length;

        return true;
    }
}