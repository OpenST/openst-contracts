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

/**
 * @title Contract contains the required, public interface by
 *        gnosis/safe-contracts/contracts/base/ModuleManager.sol
 *
 * @dev Instead of inheriting from
 *      gnosis/safe-contracts/contracts/base/ModuleManager.sol and pulling all
 *      needed contracts by Module.sol into openst-contracts building process,
 *      we define this contract, that contains only required, public interface
 *      of ModuleManager.sol.
 */
interface GnosisSafeModuleManagerInterface
{

    /* Enums */

    /**
     * @dev This enum mimics the "Operation" enum defined within:
     *          gnosis/safe-contracts/contract/common/Enum.sol
     */
    enum Operation {
        Call,
        DelegateCall,
        Create
    }


    /* External Functions */

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
        returns (bool success_);
}