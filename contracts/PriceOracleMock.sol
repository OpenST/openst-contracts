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
//
// ----------------------------------------------------------------------------
// Utility Chain: PriceOracleMock
//
// http://www.simpletoken.org/
//
// --------------------------

import "./PriceOracleInterface.sol";


/// @title PriceOracleMock - Basic implementation of the PriceOracleInterface to aid testing Pricer
contract PriceOracleMock is PriceOracleInterface {

    /*
     *  Constants
     */
    /// Use this variable in case decimal value need to be evaluated
    uint8 private constant TOKEN_DECIMALS = 18;

    /*
     *  Storage
     */
    /// Private variable price
    uint256 private price;
    bytes3 private oracleBaseCurrency;
    bytes3 private oracleQuoteCurrency;

    /*
     *  Public functions
     */
    /// @dev constructor function
    /// @param _baseCurrency baseCurrency
    /// @param _quoteCurrency quoteCurrency
    constructor(
        bytes3 _baseCurrency,
        bytes3 _quoteCurrency,
        uint256 _price
        )
        public
    {
        // Initialize quote currency
        oracleQuoteCurrency = _quoteCurrency;
        // Initialize base currency
        oracleBaseCurrency = _baseCurrency;
        price = _price;
    }

    /// @dev gets price
    /// @return price
    function getPrice()
        public
        view
        returns (
        uint256 /* price */  )
    {
        return price;
    }

    /// @dev use this function to get token decimals value
    /// @return TOKEN_DECIMALS
    function decimals()
        public
        view
        returns(
        uint8 /* token decimals */)
    {
        return TOKEN_DECIMALS;
    }

    /// @dev returns 0
    function priceValidityDuration()
        public
        view
        returns(
        uint256)
    {
        return 0;
    }

    /// @dev returns 0
    function expirationHeight()
        public
        view
        returns(
        uint256)
    {
        return 0;
    }

    /// @dev get baseCurrency bytes3 code
    /// @return baseCurrency
    function baseCurrency()
        public
        view
        returns(
        bytes3 /* oracleBaseCurrency */)
    {
        return oracleBaseCurrency;
    }

    /// @dev returns quoteCurrency bytes3 code
    /// @return quoteCurrency
    function quoteCurrency()
        public
        view
        returns(
        bytes3 /* oracleQuoteCurrency */)
    {
        return oracleQuoteCurrency;
    }
}
