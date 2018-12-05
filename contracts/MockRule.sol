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


contract MockRule {

    /* Constants */

    bytes4 constant public FAIL_CALLPREFIX = bytes4(
        keccak256("fail(address)")
    );

    bytes4 constant public PASS_CALLPREFIX = bytes4(
        keccak256("pass(address)")
    );

    uint256 constant public BOUNTY = 10;


    /* Storage */

    address public value;
    uint256 public receivedPayableAmount;


    /* Public Functions */

    function fail(
        address _value
    )
        public
    {
        value = _value;
        revert("The function should fail by throwing.");
    }

    function pass(
        address _value
    )
        public
    {
        require(_value != address(0), "Value is null.");
        value = _value;
    }

    function passPayable(
        address _value
    )
        public
        payable
    {
        require(_value != address(0), "Value is null.");
        value = _value;
        receivedPayableAmount = msg.value;
    }

    /**
     * @notice Mocks CoGateway redeem function. Function arguments are not
     *         named because of compilation warning for unused variables.
     *
     * @return bytes32 which is unique for each request.
     */
    function redeem(
        uint256,
        address,
        address,
        uint256,
        uint256,
        uint256,
        bytes32
    )
        public
        payable
        returns (bytes32)
    {
        // Below require is added to test execution failure.
        require(
            msg.value == BOUNTY,
            "msg.value must match the bounty amount"
        );

        receivedPayableAmount = msg.value;

        return bytes32(0);
    }
}
