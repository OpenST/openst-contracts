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


/**
 * @title Organization contract.
 *
 * @notice The organization represents an entity that manages the
 *         economy and therefore the Organization.sol contract holds all
 *         the keys required to administer the economy.
 */
contract Organization {

    /* Usings */

    using SafeMath for uint256;


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

    event WorkerRemoved(
        address indexed _worker
    );


    /* Storage */

    /** Address for which private key will be owned by organization. */
    address public owner;

    /** proposedOwner is address proposed by owner for ownership transfer. */
    address public proposedOwner;

    /** admin address set by owner to facilitate operations of an economy. */
    address public admin;

    /**
     *  List of whitelisted workers active upto the expiration height.
     *  Expiration height 0 is a valid height.
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

    modifier onlyOrganization()
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
     * @param _proposedOwner worker address to be added.
     *
     * @return true on successful execution.
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
     * @return true on successful execution.
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
     * @param _admin admin address to be added.
     *
     * @return true on successful execution.
     */
    function setAdmin(address _admin) external onlyOrganization returns (bool)
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
     *          - expiration height should not be expired.
     *          - 0 expiration height is not allowed.
     *      Admin/Owner has the flexibility to extend/reduce worker expiration
     *      height. This way a worker activation/deactivation can be
     *      controlled without adding/removing new worker keys.
     *
     * @param _worker worker address to be added.
     * @param _expirationHeight expiration height of worker.
     *
     * @return Remaining height for which worker is active.
     */
    function setWorker(
        address _worker,
        uint256 _expirationHeight
    )
        external
        onlyOrganization
        returns (uint256 remainingHeight_)
    {
        require(
            _worker != address(0),
            "Worker address is null."
        );

        // expiration height with 0 block number is not allowed since the
        // minimum block number can be 0.
        require(
            _expirationHeight > block.number,
            "Expiration height is lte to the current block height."
        );

        workers[_worker] = _expirationHeight;
        remainingHeight_ = _expirationHeight.sub(block.number);

        emit WorkerSet(_worker, _expirationHeight, remainingHeight_);

        return remainingHeight_;
    }

    /**
     * @notice Removes a worker.
     *
     * @dev Requires:
     *          - Caller should be owner or admin.
     *          - Worker to be removed should be present.
     *
     * @param _worker address to be removed.
     *
     * @return true if the worker existed else returns false.
     */
    function removeWorker(address _worker)
        external
        onlyOrganization
        returns (bool)
    {
        require(
            workers[_worker] > 0,
            "Worker to be removed is not present."
        );

        delete workers[_worker];

        emit WorkerRemoved(_worker);

        return true;
    }


    /* Public Functions */

    /**
     * @notice Checks if the worker is valid or invalid.
     *
     * @param _worker address to check if whitelisted.
     *
     * @return true if the worker is already added and not expired
     *         else returns false.
     */
    function isWorker(address _worker) public view returns (bool)
    {
        return (workers[_worker] >= block.number);
    }

}
