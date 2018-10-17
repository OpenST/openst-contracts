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


/**
 *  @title OrganizationInterface
 *
 *  @notice Provides organization interface
 */
contract OrganizationInterface {

    /* Events */

    event OwnershipTransferInitiated(address indexed _proposedOwner);

    event OwnershipTransferCompleted(
        address indexed _previousOwner,
        address indexed _newOwner
    );

    event AdminAddressChanged(address indexed _newAddress);

    event WorkerAdded(
        address indexed _worker,
        uint256 _expirationHeight,
        uint256 _remainingHeight
    );

    event WorkerRemoved(address indexed _worker, bool _existed);


    /* External Functions */

    function initiateOwnershipTransfer(address _proposedOwner)
        external
        returns (bool);

    function completeOwnershipTransfer() external returns (bool);

    function setAdmin(address _admin) external returns (bool);

    function setWorker(address _worker, uint256 _expirationHeight)
        external
        returns (uint256);

    function removeWorker(address _worker) external returns (bool);


    /* Public Functions */

    function isWorker(address _worker) public view returns (bool);

}