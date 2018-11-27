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

import "../../../GlobalConstraintInterface.sol";


/**
 * @title LimitTransferGlobalConstraint contract.
 *
 * @notice It is used for testing TokenHolder's executeRule method integration
 *         test. It implements GlobalConstraintInterface. It checks that sum of
 *         all tokens should not be more than 'transferLimit'.
 */
contract LimitTransferGlobalConstraint is GlobalConstraintInterface {

    /* Storage */

    /** Total number of BTs that can be transferred. */
    uint256 public transferLimit;


    /* Special Functions */

    constructor(uint256 _transferLimit) {
        transferLimit = _transferLimit;
    }


    /* External Functions */

    /**
     * @notice It verifies whether sum of all the BTs transfers is less than the
     *         allowed limit.
     *
     * @param _from Address from which BTs are to be transferred.
     * @param _transfersTo Array of addresses to which BTs are to be transferred.
     * @param _transfersAmount Array of uint256 which specifies the number of
     *        BTs to be transferred to each respective '_transfersTo' address.
     *
     * @return True if sum of all BTs to be transferred is less than allowed
     *         limit.
     */
    function check(
        address _from,
        address[] _transfersTo,
        uint256[] _transfersAmount
    )
        external
        view
        returns (bool)
    {
        uint256 totalAmount = 0;
        bool isTransferWithinLimit;
        for(uint256 i = 0;i < _transfersAmount.length;  i++) {
            totalAmount = totalAmount + _transfersAmount[i];
            if(totalAmount <= transferLimit) {
                isTransferWithinLimit = true;
                break;
            }
        }

        return isTransferWithinLimit;
    }

}

