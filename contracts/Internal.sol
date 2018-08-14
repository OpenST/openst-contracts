pragma solidity ^0.4.23;

// Copyright 2017 OpenST Ltd.
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
//
// ----------------------------------------------------------------------------
// Utility Chain: Internal Contract
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------


/**
 * @title Internal contract
 *
 * @notice Implements properties and actions performed by an economy internal
 *         actors.
 *
 */
contract Internal {

    /* Storage */

    /** max accepted internal actors in registerInternalActor method */
    uint16 private constant MAX_INTERNAL_ACTORS = 100;
    /**
        organization/company address who will be deploying branded token
        contract
    */
    address private organization;
    /**
        stores internal actor and checks if internal actor exists or not.
        If actor is not present in isInternalActor, it returns false else
        returns true.
     */
    mapping (address /* internal actor */ => bool) public isInternalActor;


    /* Modifiers */

    /**
     * @notice Modifier onlyOrganization.
     *
     * @dev Checks if msg.sender is organization address or not.
     */
    modifier onlyOrganization() {
        require(organization == msg.sender);
        _;
    }


    /* Public functions */

    /**
     * @notice contract constructor.
     *
     * @dev it sets msg.sender as organization/company address.
     */
    constructor()
        public
    {
        organization = msg.sender;
    }

    /**
     * @notice public function registerInternalActor.
     *
     * @dev there is max limit on how many internal actors who can register
     *      at once.
     *
     * @param _internalActors Array of addresses of the internal actor which
     *         needs to be registered.
     *
     * @return uint256 total count of registered actors.
     */
    function registerInternalActor(
        address[] _internalActors
    )
        public
        onlyOrganization
        returns (uint16 /* Registered Count */)
    {
        require(_internalActors.length != 0, "Internal actors length is 0");

        require(_internalActors.length <= MAX_INTERNAL_ACTORS,
            "Internal actors max length exceeded!!!");

        for (uint16 i=0; i<_internalActors.length; i++) {
            // address 0 transfer is allowed in EIP20
            address actor = _internalActors[i];
            // If actor is not present in isInternalActor, returns false else
            // returns true
            if (isInternalActor[actor] == false){
                isInternalActor[actor] = true;
            }
        }

        return uint16(_internalActors.length);
    }

}