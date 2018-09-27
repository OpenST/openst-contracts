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

// Question: Should we rename Organized to OrgManaged/Operative/OrgAuthorized?
// Question: Do we need admin address?
// TODO Documentation and Styleguide changes
contract Organized {


    /* Events */

    event OperatorAddressUpdated(address _oldOperator, address _newOperator);

    Organization public organization;

    // Operator is authorized address operating on behalf of organization.
    address public operator;


    /* Modifiers */

    modifier onlyOrganization()
    {
        require(
            organization.isOrganization(msg.sender),
            "msg.sender is not organization address."
        );
        _;
    }

    modifier onlyOperator()
    {
        require(
            msg.sender == operator,
            "msg.sender is not operator address."
        );
        _;
    }

    modifier onlyAuthorized()
    {
        require(
            organization.isOrganization(msg.sender) ||
            (msg.sender == operator),
            "msg.sender is not authorized."
        );
        _;
    }


    /* Special functions */

    constructor(Organization _organization)
        public
    {
        require(
            _organization != address(0),
            "Organization contract address is 0."
        );

        organization = _organization;
    }


    /* External Functions */

    // Question: Should we allow reseting of operator?
    function setOperator(address _operator)
        external
        onlyOrganization
        returns (bool)
    {
        require(
            _operator != address(0),
            "Operator address is null."
        );

        require(
            !organization.isOrganization(_operator),
            "Operator address can't be organization address."
        );

        address oldOperator = operator;
        operator = _operator;

        emit OperatorAddressUpdated(oldOperator, _operator);

        return true;
    }

}