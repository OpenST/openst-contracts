pragma solidity ^0.5.0;

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
 * @title Proxy contract that delegates calls to the master contract.
 *
 * @notice Allows to create a proxy from a master copy of any contract.
 *         An important requirement on a master contract is to have a reserved
 *         slot of an address type, within its storage, in a first position.
 *         For an example, please, see TokenHolder contract.
 */
contract Proxy {

    /**
     * @dev THIS STORAGE VARIABLE *MUST* BE ALWAYS THE FIRST STORAGE
     *      ELEMENT FOR THIS CONTRACT.
     */
    address public masterCopy;

    constructor(address _masterCopy)
        public
    {
        require(
            _masterCopy != address(0),
            "Master copy address is null."
        );

        masterCopy = _masterCopy;
    }

    /**
     * @dev Fallback function allowing to perform a delegatecall to the given
     *      implementation. The function will return whatever the
     *      implementation call returns.
     */
    function ()
        external
        payable
    {
        address mc = masterCopy;

        // solium-disable-next-line security/no-inline-assembly
        assembly {
            let ptr := mload(0x40)
            calldatacopy(ptr, 0, calldatasize)
            let result := delegatecall(gas, mc, ptr, calldatasize, 0, 0)
            let size := returndatasize
            returndatacopy(ptr, 0, size)

            switch result
            case 0 { revert(ptr, size) }
            default { return(ptr, size) }
        }
    }
}
