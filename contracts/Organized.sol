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

import "./OrganizationInterface.sol";


/**
 * @title Organized contract.
 *
 * @notice The Organized contract facilitates integration of
 *         organization administration keys with different contracts like
 *         TokenRules, CustomRules etc. Entity has the
 *         flexibility to deploy separate Organization contract if
 *         administration keys are different for different contracts.
 */
contract Organized {

    /* Storage */

    /**
     * OrganizationInterface contract address holds all the keys
     * needed to administer the economy.
     */
    OrganizationInterface public organization;


    /* Modifiers */

    modifier onlyWorker()
    {
        require(
            organization.isWorker(msg.sender),
            "Only whitelisted worker is allowed to call."
        );
        _;
    }


    /* Special Functions */

    /**
     * @dev Constructor requires:
     *          - organization contract address is not null.
     *
     * @param _organization organization contract address containing
     *        different administration keys.
     */
    constructor(address _organization)
        public
    {
        require(
            _organization != address(0),
            "Organization contract address is null."
        );

        organization = OrganizationInterface(_organization);
    }

}