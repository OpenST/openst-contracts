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

    event WorkerSet(
        address indexed _worker,
        uint256 _expirationHeight,
        uint256 _remainingHeight
    );

    event WorkerRemoved(address indexed _worker);


    /* External Functions */

    /**
     * @notice Initiates ownership transfer to proposed owner.
     *
     * @param _proposedOwner worker address to be added.
     *
     * @return true on successful execution.
     */
    function initiateOwnershipTransfer(address _proposedOwner)
        external
        returns (bool);

    /**
     * @notice Complete ownership transfer to proposed owner.
     *
     * @return true on successful execution.
     */
    function completeOwnershipTransfer() external returns (bool);

    /**
     * @notice Sets admin address.
     *
     * @param _admin admin address to be added.
     *
     * @return true on successful execution.
     */
    function setAdmin(address _admin) external returns (bool);

    /**
     * @notice Sets worker and its expiration height.
     *
     * @param _worker worker address to be added.
     * @param _expirationHeight expiration height of worker.
     *
     * @return Remaining height for which worker is active.
     */
    function setWorker(address _worker, uint256 _expirationHeight)
        external
        returns (uint256);

    /**
     * @notice Removes a worker.
     *
     * @param _worker address to be removed.
     *
     * @return true if the worker existed else returns false.
     */
    function removeWorker(address _worker) external returns (bool);


    /* Public Functions */

    /**
     * @notice Checks if the worker is valid or invalid.
     *
     * @param _worker address to check if whitelisted.
     *
     * @return true if the worker is already added and not expired
     *         else returns false.
     */
    function isWorker(address _worker) public view returns (bool);

}
