pragma solidity ^0.5.0;

// Copyright 2019 OpenST Ltd.
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

import "./ModuleManagerInterface.sol";
import "../proxies/MasterCopyNonUpgradable.sol";

/**
 * @title Allows to replace an owner without Safe confirmations
 *        if the recovery owner and the recovery controller approves
 *        replacement.
 */
contract DelayedRecoveryModule is MasterCopyNonUpgradable {

    /* Events */

    event RecoveryInitiated(
        address _prevOwner,
        address _oldOwner,
        address _newOwner,
        bytes32 _recoveryHash
    );

    event RecoveryExecuted(
        bytes32 _recoveryHash
    );

    event RecoveryAborted(
        bytes32 _recoveryHash
    );

    event ResetRecoveryOwner(
        address _oldRecoveryOwner,
        address _newRecoveryOwner
    );


    /* Constants */

    string public constant NAME = "Delayed Recovery Module";

    string public constant VERSION = "0.1.0";

    bytes32 public constant DOMAIN_SEPARATOR_TYPEHASH = keccak256(
        "EIP712Domain(address delayedRecoveryModule)"
    );

    bytes32 public constant RECOVERY_STRUCT_TYPEHASH = keccak256(
        "RecoveryStruct(address prevOwner,address oldOwner,address newOwner)"
    );

    bytes32 public constant RESET_RECOVERY_OWNER_STRUCT_TYPEHASH = keccak256(
        "ResetRecoveryOwnerStruct(address oldRecoveryOwner,address newRecoveryOwner)"
    );


    /* Structs */

    struct RecoveryInfo {
        address prevOwner;
        address oldOwner;
        address newOwner;
        uint256 initiationBlockHeight;
        bytes32 recoveryHash;
    }


    /* Storage */

    bytes32 public domainSeparator;

    ModuleManagerInterface public moduleManager;

    address public recoveryController;

    address public recoveryOwner;

    uint256 public recoveryBlockDelay;

    RecoveryInfo public activeRecoveryInfo;


    /* Modifiers */

    modifier authorized() {
        require(
            msg.sender == address(moduleManager),
            "Only module manager is allowed to call."
        );

        _;
    }

    modifier onlyRecoveryController()
    {
        require(
            msg.sender == recoveryController,
            "Only recovery controller is allowed to call."
        );

        _;
    }

    modifier noActiveRecovery()
    {
        require(
            activeRecoveryInfo.recoveryHash == bytes32(0),
            "There is an active recovery process."
        );

        _;
    }


    /* External Functions */

    /**
     * @notice Setups the contract initial storage.
     *
     * @dev Function requires:
     *          - Function can be called only once. This is assured by
     *            checking domainSeparator not to be set previously (bytes32(0))
     *          - Recovery owner's address is not null.
     *          - Recovery controller's address is not null.
     *          - Required number of blocks before a recovery can be executed
     *            is greater than or equal to 4 * 84600.
     *
     * @param _recoveryOwner  An address that signs the "recovery
     *                        initiation/execution/abortion" and
     *                        "reset recovery owner" requests.
     * @param _recoveryController An address that relays signed requests of
     *                            different types.
     * @param _recoveryBlockDelay A required number of blocks to pass to
     *                            be able to execute a recovery request.
     */
    function setup(
        address _recoveryOwner,
        address _recoveryController,
        uint256 _recoveryBlockDelay
    )
        external
    {
        // This check assures that the setup function is called only once.
        require(
            domainSeparator == bytes32(0),
            "Domain separator was already set."
        );

        require(
            _recoveryOwner != address(0),
            "Recovery owner's address is null."
        );

        require(
            _recoveryController != address(0),
            "Recovery controller's address is null."
        );

        // @todo [Pro]: Enable this once figured out how to test!
        require(
            _recoveryBlockDelay >= 50,
            "Recovery block delay is less than 4 * 84600 blocks."
        );

        domainSeparator = keccak256(
            abi.encode(
                DOMAIN_SEPARATOR_TYPEHASH,
                this
            )
        );

        moduleManager = ModuleManagerInterface(msg.sender);

        recoveryOwner = _recoveryOwner;

        recoveryController = _recoveryController;

        recoveryBlockDelay = _recoveryBlockDelay;
    }

    /**
     * @notice Initiates a recovery procedural.
     *
     * @dev Function requires:
     *          - Only the recovery controller can call.
     *          - There is no active recovery procedural.
     *          - Recovery owner has signed message.
     *      Function emits:
     *          - RecoveryInitiated event on success.
     *
     * @param _prevOwner Owner that pointed to the owner to be replaced in the
     *                   linked list.
     * @param _oldOwner Owner address to replace.
     * @param _newOwner New owner address.
     */
    function initiateRecovery(
        address _prevOwner,
        address _oldOwner,
        address _newOwner,
        bytes32 _r,
        bytes32 _s,
        uint8 _v
    )
        external
        onlyRecoveryController
        noActiveRecovery
    {
        bytes32 recoveryHash = hashRecovery(
            _prevOwner,
            _oldOwner,
            _newOwner
        );

        verify(recoveryHash, _r, _s, _v);

        activeRecoveryInfo = RecoveryInfo({
            prevOwner: _prevOwner,
            oldOwner: _oldOwner,
            newOwner: _newOwner,
            initiationBlockHeight: block.number,
            recoveryHash: recoveryHash
        });

        emit RecoveryInitiated(
            _prevOwner,
            _oldOwner,
            _newOwner,
            recoveryHash
        );
    }

    function executeRecovery(
        address _prevOwner,
        address _oldOwner,
        address _newOwner,
        bytes32 _r,
        bytes32 _s,
        uint8 _v
    )
        external
        onlyRecoveryController
    {
        bytes32 recoveryHash = hashRecovery(
            _prevOwner,
            _oldOwner,
            _newOwner
        );

        require(
            recoveryHash == activeRecoveryInfo.recoveryHash,
            "Hash of recovery to execute does not match with active recovery's hash."
        );

        verify(recoveryHash, _r, _s, _v);

        require(
            activeRecoveryInfo.initiationBlockHeight +
                recoveryBlockDelay < block.number,
            "Required number of blocks to recover was not progressed."
        );

        bytes memory data = abi.encodeWithSignature(
            "swapOwner(address,address,address)",
            _prevOwner,
            _oldOwner,
            _newOwner
        );

        require(
            moduleManager.execTransactionFromModule(
                address(moduleManager),
                0,
                data,
                ModuleManagerInterface.Operation.Call
            ),
            "Recovery execution failed."
        );

        delete activeRecoveryInfo;

        emit RecoveryExecuted(recoveryHash);
    }

    function abortRecoveryByOwner(
        address _prevOwner,
        address _oldOwner,
        address _newOwner,
        bytes32 _r,
        bytes32 _s,
        uint8 _v
    )
        external
    {
        bytes32 recoveryHash = hashRecovery(
            _prevOwner,
            _oldOwner,
            _newOwner
        );

        require(
            recoveryHash == activeRecoveryInfo.recoveryHash,
            "Hash of recovery to abort does not match with active recovery's hash."
        );

        verify(recoveryHash, _r, _s, _v);

        delete activeRecoveryInfo;

        emit RecoveryAborted(recoveryHash);
    }


    function abortRecoveryByController(
        address _prevOwner,
        address _oldOwner,
        address _newOwner
    )
        external
        onlyRecoveryController
    {
        bytes32 recoveryHash = hashRecovery(
            _prevOwner,
            _oldOwner,
            _newOwner
        );

        require(
            recoveryHash == activeRecoveryInfo.recoveryHash,
            "Hash of recovery to abort does not match with active recovery's hash."
        );

        delete activeRecoveryInfo;

        emit RecoveryAborted(recoveryHash);
    }

    function resetRecoveryOwner(
        address _newRecoveryOwner,
        bytes32 _r,
        bytes32 _s,
        uint8 _v
    )
        external
        onlyRecoveryController
    {
        bytes32 resetRecoveryOwnerHash = hashResetRecoveryOwner(
            recoveryOwner,
            _newRecoveryOwner
        );

        verify(resetRecoveryOwnerHash, _r, _s, _v);

        address oldRecoveryOwner = recoveryOwner;

        recoveryOwner = _newRecoveryOwner;

        emit ResetRecoveryOwner(
            oldRecoveryOwner,
            recoveryOwner
        );
    }


    /* Private Functions */

    function verify(
        bytes32 _digest,
        bytes32 _r,
        bytes32 _s,
        uint8 _v
    )
        private
        view
    {
        require(
            ecrecover(_digest, _v, _r, _s) == recoveryOwner,
            "The recovery owner does not sign the message."
        );
    }

    function hashRecovery(
        address _prevOwner,
        address _oldOwner,
        address _newOwner
    )
        private
        view
        returns (bytes32 recoveryHash_ )
    {
        recoveryHash_ = keccak256(
            abi.encodePacked(
                "\x19",
                "\x01",
                domainSeparator,
                hashRecoveryStruct(
                    _prevOwner,
                    _oldOwner,
                    _newOwner
                )
            )
        );
    }

    function hashRecoveryStruct(
        address _prevOwner,
        address _oldOwner,
        address _newOwner
    )
        private
        pure
        returns (bytes32 recoveryStructHash_)
    {
        recoveryStructHash_ = keccak256(
            abi.encode(
                RECOVERY_STRUCT_TYPEHASH,
                _prevOwner,
                _oldOwner,
                _newOwner
            )
        );
    }

    function hashResetRecoveryOwner(
        address _oldRecoverySigner,
        address _newRecoverySigner
    )
        private
        view
        returns (bytes32 resetRecoveryOwnerHash_ )
    {
        resetRecoveryOwnerHash_ = keccak256(
            abi.encodePacked(
                "\x19",
                "\x01",
                domainSeparator,
                hashResetRecoveryOwnerStruct(
                    _oldRecoverySigner,
                    _newRecoverySigner
                )
            )
        );
    }

    function hashResetRecoveryOwnerStruct(
        address _oldRecoverySigner,
        address _newRecoverySigner
    )
        private
        pure
        returns (bytes32 resetRecoveryOwnerStructHash_)
    {
        resetRecoveryOwnerStructHash_ = keccak256(
            abi.encode(
                RESET_RECOVERY_OWNER_STRUCT_TYPEHASH,
                _oldRecoverySigner,
                _newRecoverySigner
            )
        );
    }
}