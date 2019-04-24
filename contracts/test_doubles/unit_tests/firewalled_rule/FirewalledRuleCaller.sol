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

import "./FirewalledRuleImplementation.sol";

/**
 * @title A contract that calls a method that is firewalled.
 *
 * @notice The firewalled method explicitly checks for `tx.origin` as opposed to
 *         `msg.sender`. In order to test the desired behavior, an indirection
 *         is required. This contract provides exactly that indirection. It
 *         calls a firewalled method to assert that the firewall works on
 *         `tx.origin` and not `msg.sender`, as `msg.sender` is this contract.
 */
contract FirewalledRuleCaller {

    /* Storage */

    FirewalledRuleImplementation rule;


    /* Special Functions */

    constructor(FirewalledRuleImplementation _rule) public {
        rule = _rule;
    }


    /* External Functions */

    function callFirewalledFn() external view {
        rule.firewalledFn();
    }
}
