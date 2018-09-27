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

// TODO Documentation and styleguide changes.
contract Organization {

    address public organization;
    address public proposedOrganization;


    /* Events */

    event OrganizationTransferInitiated(
        address _currentOrganization,
        address _proposedOrganization
    );

    event OrganizationTransferCompleted(
        address _previousOrganization,
        address _newOrganization
    );


    /* Special Functions */

    constructor()
        public
    {
        require(
            msg.sender != address(0),
            "Organization address is null."
        );
        organization = msg.sender;
    }


    /* Modifiers */

    modifier onlyOrganization()
    {
        require(
            msg.sender == organization,
            "Only organization is allowed to call."
        );
        _;
    }


    /* External Functions */

    function isOrganization(address _address)
        external
        view
        returns (bool)
    {
        return (_address == organization);
    }


    /* Public Functions */

    function initiateOrganizationTransfer(address _proposedOrganization)
        public
        onlyOrganization
        returns (bool)
    {
        require(
            _proposedOrganization != address(0),
            "Proposed organization address is null."
        );

        require(
            _proposedOrganization != organization,
            "Proposed organization address can't be organization address."
        );

        proposedOrganization = _proposedOrganization;

        emit OrganizationTransferInitiated(organization, _proposedOrganization);

        return true;
    }

    function completeOrganizationTransfer()
        public
        returns (bool)
    {
        require(
            msg.sender == proposedOrganization,
            "msg.sender is not proposed organization address."
        );

        address oldOrganization = organization;
        organization = proposedOrganization;
        proposedOrganization = address(0);

        emit OrganizationTransferCompleted(oldOrganization, organization);

        return true;
    }

}