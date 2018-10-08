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
contract Owner {

    address public owner;
    address public proposedOwner;


    /* Events */

    event OwnerTransferInitiated(
        address _proposedOwner
    );

    event OwnerTransferCompleted(
        address _previousOwner,
        address _newOwner
    );


    /* Special Functions */

    constructor()
        public
    {
        require(
            msg.sender != address(0),
            "Owner address is null."
        );
        owner = msg.sender;
    }


    /* Modifiers */

    modifier onlyOwner()
    {
        require(
            msg.sender == owner,
            "Only owner is allowed to call."
        );
        _;
    }


    /* External Functions */

    function isOwner(address _address)
        external
        view
        returns (bool)
    {
        return (_address == owner);
    }


    /* Public Functions */

    function initiateOwnerTransfer(address _proposedOwner)
        public
        onlyOwner
        returns (bool)
    {
        require(
            _proposedOwner != owner,
            "ProposedOwner address can't be owner address."
        );

        proposedOwner = _proposedOwner;

        emit OwnerTransferInitiated(_proposedOwner);

        return true;
    }

    function completeOwnerTransfer()
        public
        returns (bool)
    {
        require(
            msg.sender == proposedOwner,
            "msg.sender is not proposed owner address."
        );

        address oldOwner = owner;
        owner = proposedOwner;
        proposedOwner = address(0);

        emit OwnerTransferCompleted(oldOwner, owner);

        return true;
    }

}