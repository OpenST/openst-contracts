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

// TODO Documentation and styleguide changes.
contract Organization {

    /* Usings */

    using SafeMath for uint256;


    /* Events */

    event OwnershipTransferInitiated(address indexed _proposedOwner);

    event OwnershipTransferCompleted(
        address indexed _previousOwner,
        address indexed _newOwner
    );

    event AdminAddressChanged(address indexed _newAddress);

    event WorkerSet(
        address indexed _worker,
        uint256 indexed _deactivationHeight,
        uint256 _remainingHeight
    );

    event WorkerRemoved(
        address indexed _worker,
        bool _existed
    );


    /* Storage */

    address public owner;
    address public proposedOwner;
    address public admin;
    mapping(address => uint256 /* deactivation height */) public workers;


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

    modifier onlyOwnerOrAdmin()
    {
        require(
            msg.sender == owner || msg.sender == admin,
            "only owner or admin is allowed to call."
        );
        _;
    }


    /* External Functions */

    function initiateOwnershipTransfer(address _proposedOwner)
        external
        onlyOwner
        returns (bool)
    {
        require(
            _proposedOwner != owner,
            "proposedOwner address can't be owner address."
        );

        proposedOwner = _proposedOwner;

        emit OwnershipTransferInitiated(_proposedOwner);

        return true;
    }

    function completeOwnershipTransfer()
        external
        returns (bool)
    {
        require(
            msg.sender == proposedOwner,
            "msg.sender is not proposed owner address."
        );

        address oldOwner = owner;
        owner = proposedOwner;
        proposedOwner = address(0);

        emit OwnershipTransferCompleted(oldOwner, owner);

        return true;
    }

    function setAdmin(address _admin)
        external
        onlyOwnerOrAdmin
        returns (bool)
    {
        require(
            _admin != owner,
            "admin address can't be owner address."
        );

        admin = _admin;

        emit AdminAddressChanged(_admin);

        return true;
    }

    function setWorker(
        address _worker,
        uint256 _deactivationHeight)
        external
        onlyOwnerOrAdmin
        returns (uint256 _remainingHeight)
    {
        require(
            _worker != address(0),
            "Worker address is null."
        );
        require(
            _deactivationHeight > block.number,
            "Deactivation height has expired."
        );

        workers[_worker] = _deactivationHeight;
        _remainingHeight = _deactivationHeight.sub(block.number);

        emit WorkerSet(_worker, _deactivationHeight, _remainingHeight);

        return _remainingHeight;
    }

    function removeWorker(address _worker)
        external
        onlyOwnerOrAdmin
        returns (bool _existed)
    {
        _existed = (workers[_worker] > 0);

        delete workers[_worker];

        emit WorkerRemoved(_worker, _existed);

        return _existed;
    }

    function isWorker(address _worker) public view returns (bool)
    {
        return (workers[_worker] >= block.number);
    }

}