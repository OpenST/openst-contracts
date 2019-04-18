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


interface TransfersAgent {

    /**
     * @dev Transfers from the specified account to all beneficiary
     *      accounts corresponding amounts.
     *
     * @param _from An address from which transfer is done.
     * @param _transfersTo List of addresses to transfer.
     * @param _transfersAmount List of amounts to transfer.
     */
    function executeTransfers(
        address _from,
        address[] calldata _transfersTo,
        uint256[] calldata _transfersAmount
    )
        external;
}
