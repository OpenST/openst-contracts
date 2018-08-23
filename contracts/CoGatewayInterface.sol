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
//
// ----------------------------------------------------------------------------
// Utility Chain: GatewayInterface
//
// http://www.simpletoken.org/
//
// --------------------------


contract GatewayInterface {

    function redeem(
        uint256,  // _amount
        address, // _beneficiary
        address, // _facilitator // Internal actor which pays bounty in STPrime
        uint256, // _gasPrice
        uint256, // _gasLimit
        uint256, // _nonce
        bytes32 // _hashLock
    )
        public
        payable
        returns (bool /* success */)
    {}

}