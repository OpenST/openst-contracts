pragma solidity ^0.4.24;
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

import "./BrandedToken.sol";
import "./SharedStructs.sol";
import "./SafeMath.sol";


contract TokenRules {

     /* Usings */

    using SafeMath for uint256;


    /* Events */

    event RuleAdded(address _sender, address _ruleAddress);

    event RuleRemoved(address _sender, address _ruleAddress);

    event ConstraintAdded(address _sender, address _constraintAddress);

    event ConstraintRemoved(address _sender, address _constraintAddress);


    /* Variables */

    mapping (address => SharedStructs.TokenRule) public rules;

    SharedStructs.TokenRuleConstraint[] public constraints;

    address public organization;
    BrandedToken public brandedToken;


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
            rules[msg.sender].ruleAddress != address(0),
            "Only registered rule is allowed to call");
        _;
    }


    /* Functions */

    constructor (
        address _organization,
        BrandedToken _brandedToken
    )
        public
    {
        organization = _organization;
        brandedToken = _brandedToken;
    }

    /**
     * @param _rule The address of rule to add.
     *
     * \pre Rule to add is not null.
     * \pre Rule to add does not exist.
     *
     * @return true in case of success, otherwise false.
     */
    function addRule (
        address _ruleAddress
    )
        external
        onlyOrganization
        returns (bool)
    {
        require(_ruleAddress != address(0), "Rule to add is null.");
        require (
            rules[_ruleAddress].ruleAddress == address(0),
            "Rule to add exists."
        );

        rules[_ruleAddress].ruleAddress = _ruleAddress;

        emit RuleAdded(msg.sender, _ruleAddress);

        return true;
    }

    function removeRule (
        address _ruleAddress
    )
        external
        onlyOrganization
        returns (bool)
    {
        require (
            rules[_ruleAddress].ruleAddress != address(0),
            "Rule to remove does not exist."
        );

        delete rules[_ruleAddress];

        emit RuleRemoved(msg.sender, _ruleAddress);

        return true;
    }


    function executeTransfers (
        address _from,
        SharedStructs.TokenRuleTransfer[] _transfers
    )
        external
        view
        onlyRule
        returns (bool)
    {
        if (0 == _transfers.length) {
            return true;
        }

        require (
            checkConstraints(_from, _transfers),
            "Constraints do not fullfilled."
        );

        for (uint256 i = 0; i < _transfers.length; ++i) {
            brandedToken.transferFrom(
                _from,
                _transfers[i].to,
                _transfers[i].amount
            );
        }

        brandedToken.clearAllowance(_from);

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