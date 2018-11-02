/* solhint-disable-next-line compiler-fixed */
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

import "./EIP20TokenMock.sol";


/**
 * @title EIP20TokenMock contract.
 *
 * @notice Provides EIP20Token with mock functionality to facilitate testing.
 */
contract UtilityTokenMock is EIP20TokenMock {

    address public coGateway;


    /* Special functions */

    /**
     *  @notice Contract constructor.
     *
     *  @param _conversionRate conversion rate of the token.
     *  @param _conversionRateDecimals conversion decimal of the token.
     *  @param _symbol Symbol of the token.
     *  @param _name Name of the token.
     *  @param _decimals Decimal places of the token.
     */
    constructor(
        uint256 _conversionRate,
        uint8 _conversionRateDecimals,
        string _symbol,
        string _name,
        uint8 _decimals
    )
        EIP20TokenMock(
            _conversionRate,
            _conversionRateDecimals,
            _symbol,
            _name,
            _decimals
        )
        public
    {
        conversionRate = _conversionRate;
        conversionRateDecimals = _conversionRateDecimals;
    }


    /* External functions */

    /** @notice Sets coGateway address. */
    function setCoGateway(address _coGateway)
        external
    {
        coGateway = _coGateway;
    }
}
