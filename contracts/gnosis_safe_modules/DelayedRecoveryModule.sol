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

import "./GnosisSafeModule.sol";
import "./GnosisSafeModuleManagerInterface.sol";

/**
 * @title Allows to replace an owner without Safe confirmations
 *        if the recovery owner and the recovery controller approves
 *        replacement.
 *
 * @dev The contract is a module for gnosis safe multisig contract.
 *      Gnosis safe multisig's modules assume a common interface which
 *      in the current gnosis safe implementation is inside Module.sol
 *      contract of Gnosis Safe. Instead of inheriting from this contract
 *      (not to include gnosis contracts into build process)
 *      GnosisSafeModule.sol and GnosisSafeModuleManagerInterface.sol contracts
 *      are introduced that contains the required public interfaces.
 */
contract DelayedRecoveryModule is GnosisSafeModule {

    /* Events */

    event RecoveryInitiated(
        address _prevOwner,
        address _oldOwner,
        address _newOwner
    );

    event RecoveryExecuted(
        address _prevOwner,
        address _oldOwner,
        address _newOwner
    );

    event RecoveryAborted(
        address _prevOwner,
        address _oldOwner,
        address _newOwner
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

    bytes32 public constant INITIATE_RECOVERY_STRUCT_TYPEHASH = keccak256(
        "InitiateRecoveryStruct(address prevOwner,address oldOwner,address newOwner)"
    );

    bytes32 public constant EXECUTE_RECOVERY_STRUCT_TYPEHASH = keccak256(
        "ExecuteRecoveryStruct(address prevOwner,address oldOwner,address newOwner)"
    );

    bytes32 public constant ABORT_RECOVERY_STRUCT_TYPEHASH = keccak256(
        "AbortRecoveryStruct(address prevOwner,address oldOwner,address newOwner)"
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
        bool initiated;
    }


    /* Storage */

    bytes32 public domainSeparator;

    address public recoveryController;

    address public recoveryOwner;

    uint256 public recoveryBlockDelay;

    RecoveryInfo public activeRecoveryInfo;


    /* Modifiers */

    modifier onlyRecoveryController()
    {
        require(
            msg.sender == recoveryController,
            "Only recovery controller is allowed to call."
        );

        _;
    }

    modifier activeRecovery()
    {
        require(
            activeRecoveryInfo.initiated,
            "There is no active recovery."
        );

        _;
    }

    modifier noActiveRecovery()
    {
        require(
            !activeRecoveryInfo.initiated,
            "There is an active recovery."
        );

        _;
    }

    modifier validRecovery(
        address _prevOwner,
        address _oldOwner,
        address _newOwner
    )
    {
        require(
            activeRecoveryInfo.prevOwner == _prevOwner
            && activeRecoveryInfo.oldOwner == _oldOwner
            && activeRecoveryInfo.newOwner == _newOwner,
            "The execution request's data does not match with the active one."
        );

        _;
    }


    /* External Functions */

    /**
     * @notice Setups the contract initial storage.
     *
     *      Function requires:
     *          - Function can be called only once. This is assured by
     *            checking domainSeparator not to be set previously (bytes32(0))
     *          - Recovery owner's address is not null.
     *          - Recovery controller's address is not null.
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

        domainSeparator = keccak256(
            abi.encode(
                DOMAIN_SEPARATOR_TYPEHASH,
                this
            )
        );

        manager = GnosisSafeModuleManagerInterface(msg.sender);

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
        bytes32 recoveryHash = hashInitiateRecovery(
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
            initiated: true
        });

        emit RecoveryInitiated(
            _prevOwner,
            _oldOwner,
            _newOwner
        );
    }

    /**
     * @notice Executes the initiated recovery.
     *
     * @dev Function requires:
     *          - Only recovery controller can call.
     *          - There is an initiated recovery with the same tuple of
     *            addresses (prevOwner, oldOwner, newOwner).
     *          - Recovery owner has signed execution message.
     *          - The required (delay) block numbers has been progressed.
     */
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
        activeRecovery
        validRecovery(_prevOwner, _oldOwner, _newOwner)
    {
        bytes32 recoveryHash = hashExecuteRecovery(
            _prevOwner,
            _oldOwner,
            _newOwner
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
            manager.execTransactionFromModule(
                address(manager),
                0,
                data,
                GnosisSafeModuleManagerInterface.Operation.Call
            ),
            "Recovery execution failed."
        );

        delete activeRecoveryInfo;

        emit RecoveryExecuted(
            _prevOwner,
            _oldOwner,
            _newOwner
        );
    }

    /**
     * @notice Aborts the initiated recovery.
     *
     * @dev Function requires:
     *          - There is an initiated recovery with the same tuple of
     *            addresses (prevOwner, oldOwner, newOwner).
     *          - Recovery owner has signed execution message.
     */
    function abortRecoveryByOwner(
        address _prevOwner,
        address _oldOwner,
        address _newOwner,
        bytes32 _r,
        bytes32 _s,
        uint8 _v
    )
        external
        activeRecovery
        validRecovery(_prevOwner, _oldOwner, _newOwner)
    {
        bytes32 recoveryHash = hashAbortRecovery(
            _prevOwner,
            _oldOwner,
            _newOwner
        );

        verify(recoveryHash, _r, _s, _v);

        delete activeRecoveryInfo;

        emit RecoveryAborted(
            _prevOwner,
            _oldOwner,
            _newOwner
        );
    }

    /**
     * @notice Aborts the initiated recovery.
     *
     * @dev Function requires:
     *          - Only recovery controller can call.
     *          - There is an initiated recovery with the same tuple of
     *            addresses (prevOwner, oldOwner, newOwner).
     */
    function abortRecoveryByController(
        address _prevOwner,
        address _oldOwner,
        address _newOwner
    )
        external
        onlyRecoveryController
        activeRecovery
        validRecovery(_prevOwner, _oldOwner, _newOwner)
    {
        delete activeRecoveryInfo;

        emit RecoveryAborted(
            _prevOwner,
            _oldOwner,
            _newOwner
        );
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
        require(
            _newRecoveryOwner != address(0),
            "New recovery owner's address is null."
        );

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
        bytes32 _structTypeHash,
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
                    _structTypeHash,
                    _prevOwner,
                    _oldOwner,
                    _newOwner
                )
            )
        );
    }

    function hashInitiateRecovery(
        address _prevOwner,
        address _oldOwner,
        address _newOwner
    )
        private
        view
        returns (bytes32 recoveryHash_ )
    {
        recoveryHash_ = hashRecovery(
            INITIATE_RECOVERY_STRUCT_TYPEHASH,
            _prevOwner,
            _oldOwner,
            _newOwner
        );
    }

    function hashExecuteRecovery(
        address _prevOwner,
        address _oldOwner,
        address _newOwner
    )
        private
        view
        returns (bytes32 recoveryHash_ )
    {
        recoveryHash_ = hashRecovery(
            EXECUTE_RECOVERY_STRUCT_TYPEHASH,
            _prevOwner,
            _oldOwner,
            _newOwner
        );
    }

    function hashAbortRecovery(
        address _prevOwner,
        address _oldOwner,
        address _newOwner
    )
        private
        view
        returns (bytes32 recoveryHash_ )
    {
        recoveryHash_ = hashRecovery(
            ABORT_RECOVERY_STRUCT_TYPEHASH,
            _prevOwner,
            _oldOwner,
            _newOwner
        );
    }

    function hashRecoveryStruct(
        bytes32 _structTypeHash,
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
                _structTypeHash,
                _prevOwner,
                _oldOwner,
                _newOwner
            )
        );
    }

    function hashInitiateRecoveryStruct(
        address _prevOwner,
        address _oldOwner,
        address _newOwner
    )
        private
        pure
        returns (bytes32 recoveryStructHash_)
    {
        recoveryStructHash_ = hashRecoveryStruct(
            INITIATE_RECOVERY_STRUCT_TYPEHASH,
            _prevOwner,
            _oldOwner,
            _newOwner
        );
    }

    function hashExecuteRecoveryStruct(
        address _prevOwner,
        address _oldOwner,
        address _newOwner
    )
        private
        pure
        returns (bytes32 recoveryStructHash_)
    {
        recoveryStructHash_ = hashRecoveryStruct(
            EXECUTE_RECOVERY_STRUCT_TYPEHASH,
            _prevOwner,
            _oldOwner,
            _newOwner
        );
    }

    function hashAbortRecoveryStruct(
        address _prevOwner,
        address _oldOwner,
        address _newOwner
    )
        private
        pure
        returns (bytes32 recoveryStructHash_)
    {
        recoveryStructHash_ = hashRecoveryStruct(
            ABORT_RECOVERY_STRUCT_TYPEHASH,
            _prevOwner,
            _oldOwner,
            _newOwner
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