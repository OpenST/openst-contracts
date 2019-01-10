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

import "./SafeMath.sol";
import "./EIP20TokenInterface.sol";
import "./Organized.sol";


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
 *      Before execution of transfers from TokenHolder.
 *      During a execution, rule can call TokenRules.executeTransfers()
 *      function only once.
 */
contract TokenRules is Organized {

     /* Usings */

    using SafeMath for uint256;


    /* Events */

    event RuleRegistered(
        string _ruleName,
        address _ruleAddress
    );

    /* Structs */

    struct TokenRule {
        string ruleName;
        address ruleAddress;
        string ruleAbi;
    }

    /**
     * RuleIndex struct is going to be used in 'rulesByAddress' and
     * 'rulesByNameHash' mappings for pointing to the index with 'rules' array.
     * Simple usage of uint256 in those mappings does not work, because
     * for non existing rule name and address it defaults to 0 index,
     * which is obviously wrong. Before accessing 'rules' array by index
     * one should check 'exists' field of the struct.
     */
    struct RuleIndex {
        uint256 index;
        bool exists;
    }

    /* Storage */

    /** Contains all registered rule in the order of registration. */
    TokenRule[] public rules;

    /** Mapping from a rule address to the index in the `rules` array. */
    mapping (address => RuleIndex) public rulesByAddress;

    /** Mapping from a rule name hash to the index in the `rules` array. */
    mapping (bytes32 => RuleIndex) public rulesByNameHash;

    EIP20TokenInterface public token;

    /**
     * TokenHolder contract before a rule execution will set the flag
     * on (true) for itself. TokenRules.executeTransfers will set the flag to
     * off (false) for _from (TokenHolder) after execution. This will restrict
     * a rule to make a call to TokenRules.executeTransfers only *once*.
     */
    mapping (address => bool) public allowedTransfers;

    bool areDirectTransfersEnabled;


    /* Modifiers */


    modifier onlyRule {
        require(
            rulesByAddress[msg.sender].exists,
            "Only registered rule is allowed to call."
        );
        _;
    }

    modifier directTransfersAreEnabled {

        require(
            areDirectTransfersEnabled,
            "Direct transfers are not allowed."
        );

        _;
    }


    /* Special Functions */

    /**
     * @dev Function requires:
     *          - Token address is not null.
     */
    constructor(
        OrganizationIsWorkerInterface _organization,
        EIP20TokenInterface _token
    )
        Organized(_organization)
        public
    {
        require(_token != address(0), "Token address is null.");

        token = _token;

        areDirectTransfersEnabled = false;
    }


    /* External Functions */

    /**
     * @dev Function requires:
     *          - Only worker can call.
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
        onlyWorker
    {
        require(bytes(_ruleName).length != 0, "Rule name is empty.");
        require(_ruleAddress != address(0), "Rule address is null.");
        require(bytes(_ruleAbi).length != 0, "Rule ABI is empty.");

        bytes32 ruleNameHash = keccak256(abi.encodePacked(_ruleName));

        require(
            !rulesByNameHash[ruleNameHash].exists,
            "Rule with the specified name already exists."
        );
        require(
            !rulesByAddress[_ruleAddress].exists,
            "Rule with the specified address already exists."
        );

        TokenRule memory rule = TokenRule({
            ruleName: _ruleName,
            ruleAddress: _ruleAddress,
            ruleAbi: _ruleAbi
        });

        RuleIndex memory ruleIndex = RuleIndex({
            index: rules.length,
            exists: true
        });

        rulesByAddress[_ruleAddress] = ruleIndex;
        rulesByNameHash[ruleNameHash] = ruleIndex;
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
        _executeTransfers(_from, _transfersTo, _transfersAmount);
    }

    function enableDirectTransfers()
        external
        onlyWorker
    {
        areDirectTransfersEnabled = true;
    }

    function disableDirectTransfers()
        external
        onlyWorker
    {
        areDirectTransfersEnabled = false;
    }

    /**
     * @dev Transfers from the caller's account to all beneficiary
     *      accounts corresponding amounts.
     *      Function requires:
     *          - Direct transfers are enabled by organization.
     *
     * @param _transfersTo List of addresses to transfer.
     * @param _transfersAmount List of amounts to transfer.
     */
    function directTransfers(
        address[] _transfersTo,
        uint256[] _transfersAmount
    )
        external
        directTransfersAreEnabled
    {
        _executeTransfers(msg.sender, _transfersTo, _transfersAmount);
    }


    /* Private Functions */

    /**
     * @dev Transfers from the specified account to all beneficiary
     *      accounts corresponding amounts.
     *      Function requires:
     *          - An account from which (_from) transfer will be done should
     *            allow this transfer by calling to TokenRules.allowTransfers().
     *            TokenRules will set this allowance back, hence, only
     *            one call is allowed per execution session.
     *          - _transfersTo and _transfersAmount arrays length should match.
     *
     * @param _from An address from which transfer is done.
     * @param _transfersTo List of addresses to transfer.
     * @param _transfersAmount List of amounts to transfer.
     */
    function _executeTransfers(
        address _from,
        address[] _transfersTo,
        uint256[] _transfersAmount
    )
        private
    {
        require(
            allowedTransfers[_from],
            "Transfers from the address are not allowed."
        );

        require(
            _transfersTo.length == _transfersAmount.length,
            "'to' and 'amount' transfer arrays' lengths are not equal."
        );

        for(uint256 i = 0; i < _transfersTo.length; ++i) {
            token.transferFrom(
                _from,
                _transfersTo[i],
                _transfersAmount[i]
            );
        }

        allowedTransfers[_from] = false;
    }
}
