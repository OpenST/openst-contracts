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

import "./Organization.sol";

// TODO Documentation and Styleguide changes
contract Organized {

    /* Storage */

    Organization public organization;


    /* Modifiers */

    modifier onlyWorker()
    {
        require(
            organization.isWorker(msg.sender),
            "Only whitelisted worker allowed to call."
        );
        _;
    }


    /* Special functions */

    constructor(Organization _organization)
        public
    {
        require(
            _organization != address(0),
            "Organization contract address is null."
        );

        organization = _organization;
    }

}