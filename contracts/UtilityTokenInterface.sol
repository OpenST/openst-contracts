/* solhint-disable-next-line compiler-fixed */
pragma solidity ^0.4.23;

// Copyright 2017 OpenST Ltd.
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
//
// ----------------------------------------------------------------------------
// Auxiliary chain: UtilityTokenInterface
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

import "./EIP20TokenInterface.sol";


/**
 *  @title UtilityTokenInterface contract.
 *
 *  @notice Provides the interface to utility token contract. The interface
 *          has minimum required functions for bytecode optimizations.
 */
contract UtilityTokenInterface is EIP20TokenInterface {

    /* Public functions */

    /** @notice Returns coGateway address. */
    function coGateway()
        public
        view
    returns (address);
}