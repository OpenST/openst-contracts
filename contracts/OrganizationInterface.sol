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
 *  @title OrganizationInterface.
 *
 *  @notice Provides organization interface.
 */
interface OrganizationInterface {

    /* Events */

    event OwnershipTransferInitiated(address indexed _proposedOwner);

    event OwnershipTransferCompleted(
        address indexed _previousOwner,
        address indexed _newOwner
    );

    event AdminAddressChanged(address indexed _newAdmin);

    event WorkerSet(
        address indexed _worker,
        uint256 _expirationHeight,
        uint256 _remainingHeight
    );

    event WorkerUnset(address indexed _worker, bool _wasSet);


    /* External Functions */

    /**
     * @notice Initiates ownership transfer to proposed owner.
     *
     * @param _proposedOwner Proposed owner address.
     *
     * @return True on successful execution.
     */
    function initiateOwnershipTransfer(address _proposedOwner)
        external
        returns (bool);

    /**
     * @notice Complete ownership transfer to proposed owner.
     *
     * @return True on successful execution.
     */
    function completeOwnershipTransfer() external returns (bool);

    /**
     * @notice Sets admin address.
     *
     * @param _admin Admin address to be added.
     *
     * @return True on successful execution.
     */
    function setAdmin(address _admin) external returns (bool);

    /**
     * @notice Sets worker and its expiration height.
     *
     * @param _worker Worker address to be added.
     * @param _expirationHeight Expiration height of worker.
     *
     * @return Remaining height for which worker is active.
     */
    function setWorker(address _worker, uint256 _expirationHeight)
        external
        returns (uint256);

    /**
     * @notice Removes a worker.
     *
     * @param _worker Worker address to be removed.
     *
     * @return True if the worker existed else returns false.
     */
    function unsetWorker(address _worker) external returns (bool);
}
