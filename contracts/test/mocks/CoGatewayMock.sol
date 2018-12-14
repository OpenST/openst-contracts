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

/**
 * @notice Mocks CoGateway contract from mosaic-contracts for testing purposes.
 */
contract CoGatewayMock {

    /* Storage */

    /**
     * @dev Stores payable amount (msg.value) of the last call to mocked
     *      redeem() function.
     */
    uint256 public receivedPayableAmount;

    /**
     * @dev If true, mocked redeem() function fails by throwing an exception,
     *      otherwise passes.
     */
    bool public shouldFail;


    /* External Functions */

    /**
     * @dev Calling this function makes mocked redeem() function to fail
     *      by throwing an exception.
     */
    function makeRedeemToFail()
        external
    {
        shouldFail = true;
    }

    /**
     * @notice Mocks CoGateway redeem function.
     *
     * @dev Function stores msg.value into receivedPayableAmount
     *      storage variable.
     *      Function fails/passes based on shouldFail storage variable.
     *      Function always returns bytes32(0)
     */
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
