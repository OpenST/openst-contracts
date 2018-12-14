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


contract CoGatewayMock
{

    /* Storage */

    uint256 public receivedPayableAmount;

    bool public shouldFail;


    /* External Functions */

    function makeRedeemToFail()
        external
    {
        shouldFail = true;
    }

    /** @notice Mocks CoGateway redeem function. */
    function redeem(
        uint256 /* _amount */,
        address /* _beneficiary */,
        uint256 /* _gasPrice */,
        uint256 /* _gasLimit */,
        uint256 /* _nonce */,
        bytes32 /* _hashLock */
    )
        public
        payable
        returns (bytes32)
    {
        require(
            shouldFail == false,
            "Calls to redeem are made to fail."
        );

        receivedPayableAmount = msg.value;

        return bytes32(0);
    }
}
