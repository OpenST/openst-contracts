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

import "../../../gnosis_safe_modules/GnosisSafeModuleManagerInterface.sol";
import "../../../gnosis_safe_modules/DelayedRecoveryModule.sol";

contract GnosisSafeModuleManagerSpy is GnosisSafeModuleManagerInterface
{
    /* Events */

    event DelayedRecoveryModuleCreated(address _contractAddress);


    /* Storage */

    bool shouldExecutionFail;

    address public recordedTo;

    uint256 public recordedValue;

    bytes public recordedData;

    Operation public recordedOperation;


    /* External Functions */

    function makeFail()
        external
    {
        shouldExecutionFail = true;
    }

    function createDelayedRecoveryModule(
        address _recoveryOwner,
        address _recoveryController,
        uint256 _recoveryBlockDelay
    )
        external
        returns (DelayedRecoveryModule)
    {
        DelayedRecoveryModule module = new DelayedRecoveryModule();
        module.setup(
            _recoveryOwner,
            _recoveryController,
            _recoveryBlockDelay
        );

        emit DelayedRecoveryModuleCreated(address(module));

        return module;
    }

    /**
     * @dev Allows a module to execute a Safe transaction without any
     *      further confirmations.
     *
     * @param _to Destination address of module transaction.
     * @param _value Ether value of module transaction.
     * @param _data Data payload of module transaction.
     * @param _operation Operation type of module transaction.
     */
    function execTransactionFromModule(
        address _to,
        uint256 _value,
        bytes calldata _data,
        Operation _operation
    )
        external
        returns (bool success_)
    {
        recordedTo = _to;
        recordedValue = _value;
        recordedData = _data;
        recordedOperation = _operation;

        return !shouldExecutionFail;
    }
}
