pragma solidity ^0.4.17;

// Copyright 2017 OST.com Ltd.
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
// Utility Chain: PriceOracle
//
// http://www.simpletoken.org/
//
// --------------------------

import "../OpsManaged.sol";
import "./PriceOracleInterface.sol";


/// @title PriceOracle - Accepts and exposes a price for a certain base currency in a certain quote currency.
contract PriceOracle is OpsManaged, PriceOracleInterface {

    /*
     *  Constants
     */
    /// Block expiry duration private constant variable
    // The constant value is set in block numbers which is equivalent number of blocks estimated in hours.
    uint256 private constant PRICE_VALIDITY_DURATION = 18000; // 25 hours at 5 seconds per block

    /// Use this variable in case decimal value need to be evaluated
    uint8 private constant TOKEN_DECIMALS = 18;


    /*
     *  Storage
     */
    /// Private variable price
    uint256 private price;
    /// blockheight at which the price expires
    uint256 private oracleExpirationHeight;
    /// specifies the base currency value e.g. "OST"
    bytes3 private oracleBaseCurrency;
    /// specifies the quote Currency value "USD", "EUR", "ETH", "BTC"
    bytes3 private oracleQuoteCurrency;

    /*
     *  Public functions
     */
    /// @dev constructor function
    /// @param _baseCurrency baseCurrency
    /// @param _quoteCurrency quoteCurrency
    function PriceOracle(
        bytes3 _baseCurrency,
        bytes3 _quoteCurrency
        )
        public
        OpsManaged()
    {
        // base Currency and quote Currency should not be same
        require(_baseCurrency != _quoteCurrency);
        // Initialize quote currency
        oracleQuoteCurrency = _quoteCurrency;
        // Initialize base currency
        oracleBaseCurrency = _baseCurrency;
    }

    /// @dev use this method to set price
    /// @param _price price
    /// @return expirationHeight
    function setPrice(
        uint256 _price)
        external
        onlyOps
        returns(
        uint256 /* expirationHeight */)
    {
        // Validate if _price is greater than 0
        require(_price > 0);

        // Assign the new value
        price = _price;

        // update the expiration height
        oracleExpirationHeight = block.number + PRICE_VALIDITY_DURATION;

        // Event Emitted
        PriceUpdated(_price, oracleExpirationHeight);

        // Return
        return (oracleExpirationHeight);
    }

    /// @dev use this function to get quoteCurrency/baseCurrency value
    /// @return price (Return 0 in case price expired so that call of this method can handle the error case)
    function getPrice()
        public
        returns (
        uint256 /* price */  )
    {
        // Current Block Number should be less than expiration height
        // Emit an event if Price has expired
        if (block.number > oracleExpirationHeight) {
            // Emit invalid price event
            PriceExpired(oracleExpirationHeight);

            return (0);
        }

        // Return current price
        return (price);
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

    /// @dev use this function to get price validity duration
    /// @return price validity duration
    function priceValidityDuration()
        public
        view
        returns(
        uint256 /* price validity duration */)
    {
        return PRICE_VALIDITY_DURATION;
    }

    /// @dev block height at which the price expires
    /// @return oracleExpirationHeight
    function expirationHeight()
        public
        view
        returns(
        uint256 /* oracleExpirationHeight */)
    {
        return oracleExpirationHeight;
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
