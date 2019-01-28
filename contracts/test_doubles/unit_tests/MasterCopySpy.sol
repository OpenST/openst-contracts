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

import "../../SafeMath.sol";

/**
 * @title A test double (spy) contract acting as a master copy for proxies
 *        during testing.
 *        Contract is a generic master copy implementation, that implements
 *        setup() function to initialize proxy's storage layout, records
 *        parameters, msg.value and msg.sender values once calling the pay()
 *        function to test validity afterwards.
 */
contract MasterCopySpy {

    /* Usings */

    using SafeMath for uint256;


    /* Events */

    event Payment(
        address _beneficiary,
        uint256 _amount
    );


    /* Storage */

    address public reservedStorageSlotForProxy;

    address public recordedMsgSender;

    address public recordedBeneficiary;

    uint8 public recordedCurrencyCode;

    uint256 public recordedMsgValue;

    uint256 public remainingBalance;

    bool public contractShouldFail;


    /* Special Functions */

    constructor(uint256 _initialBalance)
        public
    {
        setup(_initialBalance);
    }

    function setup(uint256 _initialBalance)
        public
    {
        remainingBalance = _initialBalance;
    }


    /* External Functions */

    function pay(uint8 _currencyCode, address _beneficiary)
        external
        payable
        returns (uint256)
    {
        if (contractShouldFail) {
            revert("Contract has been marked to fail.");
        }

        recordedMsgSender = msg.sender;

        recordedCurrencyCode = _currencyCode;

        recordedBeneficiary = _beneficiary;

        recordedMsgValue = msg.value;

        remainingBalance = remainingBalance.sub(msg.value);

        emit Payment(_beneficiary, msg.value);

        return remainingBalance;
    }
}