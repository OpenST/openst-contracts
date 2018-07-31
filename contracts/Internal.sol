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
 *  @title Internal contract
 *
 *  @notice Implements properties and actions performed by an economy internal actors.
 *
 */
contract Internal {

    /** Storage */

    /** max accepted internal actors in registerInternalActor method */
    uint16 private constant MAX_INTERNAL_ACTORS = 100;

    mapping (address /* internal actor */ => bool) public isInternalActor;

    /**
     *  @notice Contract constructor
     */
    constructor()
    {}

    /**
	 *  @notice public function registerInternalActor
	 *
	 *  @dev there is max limit on how many internal actors who can register at once
	 *
	 *  @param _internalActors Array of addresses of the internal actor which needs to be registered
	 *
	 *  @return bool
	 */
    function registerInternalActor(
        address[] _internalActors)
        public
        onlyOwner() // TODO onlyOrganization in internal.sol
        returns (bool /* success */)
    {
        require(_internalActors.length != 0, "Internal actors length is 0");

        require(_internalActors.length <= MAX_INTERNAL_ACTORS, "Internal actors max length exceeded!");

        for (uint16 i=0; i<_internalActors.length; i++) {
            address actor = _internalActors[i];
            internalActors[actor] = true;
        }

        return true;
    }

}