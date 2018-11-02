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

    /** Mocks CoGateway redeem function */
    function redeem(
        uint256 _amount,
        address _beneficiary,
        address _facilitator,
        uint256 _gasPrice,
        uint256 _gasLimit,
        uint256 _nonce,
        bytes32 _hashLock
    )
        public
        payable
        returns (bytes32)
    {
        receivedPayableAmount = msg.value;
        return keccak256(
            abi.encodePacked(
            _amount,
            _beneficiary,
            _facilitator,
            _gasPrice,
            _gasLimit,
            _nonce,
            _hashLock
            )
        );
    }
}
