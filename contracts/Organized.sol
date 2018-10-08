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


    /* Events */

    event OperatorAddressChanged(address _oldOperator, address _newOperator);

    Organization public organization;

    // Operator is authorized address operating on behalf of organization.
    address public operator;


    /* Modifiers */

    modifier onlyOrganization()
    {
        require(
            organization.isOwner(msg.sender),
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

    /**
    * It's needed for tokenrule
    */
    modifier onlyAuthorized()
    {
        require(
            organization.isOwner(msg.sender) ||
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
            "Organization contract address is null."
        );

        organization = _organization;
    }


    /* External Functions */

    // Allow address 0
    // Allow resetting of operator with address 0
    function setOperator(address _operator)
        external
        onlyOrganization
        returns (bool)
    {
        require(
            !organization.isOwner(_operator),
            "Operator address can't be organization address."
        );

        address oldOperator = operator;
        operator = _operator;

        emit OperatorAddressChanged(oldOperator, _operator);

        return true;
    }

}