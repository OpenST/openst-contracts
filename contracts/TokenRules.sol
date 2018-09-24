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

import "./GlobalConstraintInterface.sol";
import "./SafeMath.sol";
import "./openst-protocol/EIP20Interface.sol";


/**
 * @notice Register of whitelisted rules that are allowed to initiate transfers
 *         from a token holder accounts.
 *
 * @dev TokenHolder.executeRule() function will execute any rule that are
 *      signed by an authorized and non-expired ephemeral key.
 *      However, only the rules, that are registered in TokenRules
 *      can initiate transfers of token from TokenHolder to other beneficiaries.
 *      TokenHolder is going to allow TokenRules as a spender before
 *      execution of the rule (amount is limited by spendingLimit registered
 *      during an authorizaiton of an ephemeral key.). TokenHolder will
 *      clear this allowance after execution.
 *      Before execution of transfers from TokenHolder, TokenRules will
 *      check that all global constraints are satisified.
 *      During a execution, rule can call TokenRules.executeTransfers()
 *      function only once. This allows global constraints to be checked
 *      on complete list of transfers.
 */
contract TokenRules {

     /* Usings */

    using SafeMath for uint256;


    /* Events */

    event RuleRegistered(
        string _ruleName,
        address _ruleAddress
    );

    event GlobalConstraintAdded(address _globalConstraintAddress);

    event GlobalConstraintRemoved(address _globalConstraintAddress);


    /* Structs */

    struct TokenRule {
        string ruleName;
        address ruleAddress;
        string ruleAbi;
    }


    /* Storage */

    /** Contains all registered rule in the order of registration. */
    TokenRule[] public rules;

    /** Mapping from a rule address to the index in the `rules` array. */
    mapping (address => uint256) public rulesByAddress;

    /** Mapping from a rule name hash to the index in the `rules` array. */
    mapping (bytes32 => uint256) public rulesByNameHash;

    /** Contains a list of all registered global constraints. */
    address[] public globalConstraints;

    address public organization;
    address public token;

    /**
     * TokenHolder contract before a rule execution will set the flag
     * on (true) for itself. TokenRules.executeTransfers will set the flag to
     * off (false) for _from (TokenHolder) after execution. This will restrict
     * a rule to make a call to TokenRules.executeTransfers only *once*.
     */
    mapping (address => bool) public allowedTransfers;


    /* Modifiers */

    modifier onlyOrganization {
        require(
            organization == msg.sender,
            "Only organization is allowed to call."
        );
        _;
    }

    modifier onlyRule {
        require(
            rules[rulesByAddress[msg.sender]].ruleAddress != address(0),
            "Only registered rule is allowed to call.");
        _;
    }


    /* Special Functions */

    /**
     * @dev Function requires:
     *          - Organization address is not null.
     *          - Token address is not null.
     */
    constructor(
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


    /* External Functions */

    /**
     * @dev Function requires:
     *          - Only organization can call.
     *          - Rule name is not empty.
     *          - Rule with the specified name does not exist.
     *          - Rule address is not null.
     *          - Rule with the specified address does not exist.
     *          - Rule abi is not empty.
     *
     * @param _ruleName The name of a rule to register.
     * @param _ruleAddress The address of a rule to register.
     * @param _ruleAbi The abi of the rule to register.
     */
    function registerRule(
        string _ruleName,
        address _ruleAddress,
        string _ruleAbi
    )
        external
        onlyOrganization
    {
        require(bytes(_ruleName).length != 0, "Rule name is empty.");
        require(_ruleAddress != address(0), "Rule address is null.");
        require(bytes(_ruleAbi).length != 0, "Rule ABI is empty.");

        bytes32 ruleNameHash = keccak256(abi.encodePacked(_ruleName));

        require(
            rules[rulesByNameHash[ruleNameHash]].ruleAddress == address(0),
            "Rule with the specified name already exists."
        );
        require(
            rules[rulesByAddress[_ruleAddress]].ruleAddress == address(0),
            "Rule with the specified address already exists."
        );

        TokenRule memory rule = TokenRule({
            ruleName: _ruleName,
            ruleAddress: _ruleAddress,
            ruleAbi: _ruleAbi
        });

        rulesByAddress[_ruleAddress] = rules.length;
        rulesByNameHash[ruleNameHash] = rules.length;
        rules.push(rule);

        emit RuleRegistered(_ruleName, _ruleAddress);
    }

    /** @dev See documentation for allowedTransfers storage variable. */
    function allowTransfers()
        external
    {
        allowedTransfers[msg.sender] = true;
    }

    /** @dev See documentation for allowedTransfers storage variable. */
    function disallowTransfers()
        external
    {
        allowedTransfers[msg.sender] = false;
    }

    /**
     * @dev Transfers from the specified account to all beneficiary
     *      accounts corresponding amounts.
     *      Function requires:
     *          - Only registered rule can call.
     *          - An account from which (_from) transfer will be done should
     *            allow this transfer by calling to TokenRules.allowTransfers().
     *            TokenRules will set this allowance back, hence, only
     *            one call is allowed per execution session.
     *          - _transfersTo and _transfersAmount arrays length should match.
     *          - All globally registered constraints should satisfy before
     *            execution.
     *
     * @param _from An address from which transfer is done.
     * @param _transfersTo List of addresses to transfer.
     * @param _transfersAmount List of amounts to transfer.
     */
    function executeTransfers(
        address _from,
        address[] _transfersTo,
        uint256[] _transfersAmount
    )
        external
        onlyRule
    {
        require(
            allowedTransfers[_from],
            "Transfers from the address are not allowed."
        );

        require(
            _transfersTo.length == _transfersAmount.length,
            "'to' and 'amount' transfer arrays' lengths are not equal."
        );

        require(
            checkGlobalConstraints(_from, _transfersTo, _transfersAmount),
            "Constraints not fullfilled."
        );

        for(uint256 i = 0; i < _transfersTo.length; ++i) {
            EIP20Interface(token).transferFrom(
                _from,
                _transfersTo[i],
                _transfersAmount[i]
            );
        }

        allowedTransfers[_from] = false;
    }

    /**
     * @notice Registers a constraint to check globally before
     *         executing transfers.
     *
     * @dev Function requires:
     *          - Only organization can call.
     *          - Constraint address is not null.
     *          - Constraint is not registered.
     */
    function addGlobalConstraint(
        address _globalConstraintAddress
    )
        external
        onlyOrganization
    {
        require(
            _globalConstraintAddress != address(0),
            "Constraint to add is null."
        );

        uint256 index = findGlobalConstraintIndex(_globalConstraintAddress);

        require(
            index == globalConstraints.length,
            "Constraint to add already exists."
        );

        globalConstraints.push(_globalConstraintAddress);

        emit GlobalConstraintAdded(_globalConstraintAddress);
    }

    /**
     * @dev Function requires:
     *          - Only organization can call.
     *          - Constraint address is not null.
     *          - Constraint exists.
     */
    function removeGlobalConstraint(
        address _globalConstraintAddress
    )
        external
        onlyOrganization
    {
        require(
            _globalConstraintAddress != address(0),
            "Constraint to remvoe is null."
        );

        uint256 index = findGlobalConstraintIndex(_globalConstraintAddress);

        require(
            index != globalConstraints.length,
            "Constraint to remove does not exist."
        );

        removeGlobalConstraintByIndex(index);
    }


    /* Public Functions */

    function globalConstraintCount()
        public
        view
        returns (uint256)
    {
        return globalConstraints.length;
    }

    /**
     * @return Returns true, if all registered global constraints
     *         are satisfied, otherwise false.
     */
    function checkGlobalConstraints(
        address _from,
        address[] _transfersTo,
        uint256[] _transfersAmount
    )
        public
        view
        returns (bool _passed)
    {
        _passed = true;

        for(uint256 i = 0; i < globalConstraints.length && _passed; ++i) {
            _passed = GlobalConstraintInterface(globalConstraints[i]).check(
                _from,
                _transfersTo,
                _transfersAmount
            );
        }
    }


    /* Private Functions */

    /**
     * @dev Finds index of constraint.
     *
     * @param _constraint Constraint to find in constraints array.
     *
     * @return index_ Returns index of the constraint if exists,
     *                otherwise returns constraints.length.
     */
    function findGlobalConstraintIndex(address _constraint)
        private
        view
        returns (uint256 index_)
    {
        index_ = 0;
        while(
            index_ < globalConstraints.length &&
            globalConstraints[index_] != _constraint
        )
        {
            ++index_;
        }
    }

    function removeGlobalConstraintByIndex(uint256 _index)
        private
    {
        require(_index < globalConstraints.length, "Index is out of range.");

        uint256 lastElementIndex = globalConstraints.length - 1;
        globalConstraints[_index] = globalConstraints[lastElementIndex];
        --globalConstraints.length;
    }
}
