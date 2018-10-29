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

import "./SafeMath.sol";
import "./OrganizationInterface.sol";
import "./OrganizationIsWorkerInterface.sol";


/**
 * @title Organization contract.
 *
 * @notice The organization represents an entity that manages the
 *         economy and therefore the Organization.sol contract holds all
 *         the keys required to administer the economy.
 */
contract Organization is OrganizationInterface, OrganizationIsWorkerInterface {

    /* Usings */

    using SafeMath for uint256;


    /* Storage */

    /** Address for which private key will be owned by organization. */
    address public owner;

    /** Proposed Owner is address proposed by owner for ownership transfer. */
    address public proposedOwner;

    /** Admin address set by owner to facilitate operations of an economy. */
    address public admin;

    /**
     *  List of whitelisted workers active upto the expiration height.
     */
    mapping(address => uint256 /* expiration height */) public workers;


    /* Modifiers */

    modifier onlyOwner()
    {
        require(
            msg.sender == owner,
            "Only owner is allowed to call."
        );
        _;
    }

    modifier onlyOwnerOrAdmin()
    {
        require(
            (msg.sender == owner) || (msg.sender == admin),
            "Only owner/admin is allowed to call."
        );
        _;
    }


    /* Special Functions */

    constructor() public
    {
        owner = msg.sender;
    }


    /* External Functions */

    /**
     * @notice Initiates ownership transfer to proposed owner.
     *
     * @dev Requires:
     *          - msg.sender should be owner.
     *      Allows resetting of owner to 0x address.
     *
     * @param _proposedOwner Proposed owner address.
     *
     * @return True on successful execution.
     */
    function initiateOwnershipTransfer(address _proposedOwner)
        external
        onlyOwner
        returns (bool)
    {
        require(
            _proposedOwner != owner,
            "ProposedOwner address can't be current owner address."
        );

        proposedOwner = _proposedOwner;

        emit OwnershipTransferInitiated(_proposedOwner);

        return true;
    }

    /**
     * @notice Complete ownership transfer to proposed owner.
     *
     * @dev Requires:
     *          - msg.sender should be proposed owner.
     *
     * @return True on successful execution.
     */
    function completeOwnershipTransfer() external returns (bool)
    {
        require(
            msg.sender == proposedOwner,
            "Caller is not proposed owner address."
        );

        address oldOwner = owner;
        owner = proposedOwner;
        proposedOwner = address(0);

        emit OwnershipTransferCompleted(oldOwner, owner);

        return true;
    }

    /**
     * @notice Sets admin address.
     *
     * @dev Requires:
     *          - msg.sender should be owner or admin.
     *          - admin should not be same as owner.
     *      Allows resetting of admin address to 0x.
     *
     * @param _admin Admin address to be added.
     *
     * @return True on successful execution.
     */
    function setAdmin(address _admin) external onlyOwnerOrAdmin returns (bool)
    {
        require(
            _admin != owner,
            "Admin address can't be owner address."
        );

        admin = _admin;

        emit AdminAddressChanged(admin);

        return true;
    }

    /**
     * @notice Sets worker and its expiration height.
     *
     * @dev Requires:
     *          - Caller should be owner or admin.
     *          - worker address can't be null.
     *          - expiration height should be greater or equal to current
     *            block number.
     *      Admin/Owner has the flexibility to extend/reduce worker expiration
     *      height. This way a worker activation/deactivation can be
     *      controlled without adding/removing new worker keys.
     *
     * @param _worker Worker address to be added.
     * @param _expirationHeight Expiration height of worker.
     *
     * @return Remaining height for which worker is active.
     */
    function setWorker(
        address _worker,
        uint256 _expirationHeight
    )
        external
        onlyOwnerOrAdmin
        returns (uint256 remainingHeight_)
    {
        require(
            _worker != address(0),
            "Worker address is null."
        );

        require(
            _expirationHeight >= block.number,
            "Expiration height is less than current block number."
        );

        workers[_worker] = _expirationHeight;
        remainingHeight_ = _expirationHeight.sub(block.number);

        emit WorkerSet(_worker, _expirationHeight, remainingHeight_);

        return remainingHeight_;
    }

    /**
     * @notice Unsets/deactivates a worker.
     *
     * @dev Requires:
     *          - Caller should be owner or admin.
     *
     * @param _worker Worker address to unset/deactivate.
     *
     * @return True if the worker was set/existed else returns false.
     */
    function unsetWorker(address _worker)
        external
        onlyOwnerOrAdmin
        returns (bool wasSet_)
    {
        wasSet_ = (workers[_worker] > 0);

        delete workers[_worker];

        emit WorkerUnset(_worker, wasSet_);

        return wasSet_;
    }


    /* Public Functions */

    /**
     * @notice Returns whether the worker is expired.
     *
     * @param _worker Worker address to check.
     *
     * @return True if worker expiration height is more than or equal to
     *         current block number else returns false.
     */
    function isWorker(address _worker) public view returns (bool)
    {
        return (workers[_worker] >= block.number);
    }

}
