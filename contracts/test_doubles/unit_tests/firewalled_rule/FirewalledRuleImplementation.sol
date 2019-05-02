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

import "../../../rules/FirewalledRule.sol";

/**
 * @title Implementation that actually has a firewalled method.
 *
 * @notice As the firewall itself doesn't have any firewalled methods, another
 *         contract that provides a firewalled method is required in order to
 *         test the modifier.
 */
contract FirewalledRuleImplementation is FirewalledRule {

    /* Special Functions */

    constructor(
        OrganizationInterface _organization
    )
        FirewalledRule(_organization)
        public
    // solium-disable-next-line no-empty-blocks
    {}


    /* External Functions */


    // solium-disable-next-line no-empty-blocks
    function firewalledFn() external view firewalled {}
}
