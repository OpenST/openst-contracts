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
 * @notice Spy test double to catch inputs to verify.
 */
contract CoGatewaySpy {

    /* Storage */

    uint256 public recordedPayedAmount;

    uint256 public recordedAmount;

    address public recordedBeneficiary;

    uint256 public recordedGasPrice;

    uint256 public recordedGasLimit;

    uint256 public recordedNonce;

    bytes32 public recoerdedHashLock;

    /** @dev If true, redeem() function fails by throwing an exception */
    bool public failRedemption;


    /* External Functions */

    /**
     * @dev Calling this function makes mocked redeem() function to fail
     *      by throwing an exception.
     */
    function makeRedemptionToFail()
        external
    {
        failRedemption = true;
    }

    function redeem(
        uint256 _amount,
        address _beneficiary,
        uint256 _gasPrice,
        uint256 _gasLimit,
        uint256 _nonce,
        bytes32 _hashLock
    )
        external
        payable
        returns (bytes32)
    {
        if (failRedemption) {
            revert("Calls to redeem are made to fail.");
        }

        recordedPayedAmount = msg.value;

        recordedAmount = _amount;

        recordedBeneficiary = _beneficiary;

        recordedGasPrice = _gasPrice;

        recordedGasLimit = _gasLimit;

        recordedNonce = _nonce;

        recoerdedHashLock = _hashLock;

        return bytes32(0);
    }
}
