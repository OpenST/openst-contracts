pragma solidity ^0.5.0;

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

import "../../../PriceOracleInterface.sol";

contract PriceOracleFake is PriceOracleInterface {

    /* Storage */

    bytes3 baseCurrencyCode;

    bytes3 quoteCurrencyCode;

    uint256 price;

    uint256 expirationHeight;

    uint8 quoteCurrencyDecimals;


    /* Special */

    constructor(
        bytes3 _baseCurrencyCode,
        bytes3 _quoteCurrencyCode,
        uint8 _quoteCurrencyDecimals,
        uint256 _initialPrice,
        uint256 _expirationHeight
    )
        public
    {
        require(
            _baseCurrencyCode != bytes3(0),
            "Base currency code is empty."
        );

        require(
            _quoteCurrencyCode != bytes3(0),
            "Quote currency code is empty."
        );

        baseCurrencyCode = _baseCurrencyCode;

        quoteCurrencyCode = _quoteCurrencyCode;

        quoteCurrencyDecimals = _quoteCurrencyDecimals;

        setPrice(_initialPrice, _expirationHeight);
    }


    /* External Functions */

    /**
     * @notice Returns base currency code.
     *
     * @dev Base currency code is not according to ISO 4217 or other standard.
     */
    function baseCurrency()
        external
        view
        returns (bytes3)
    {
        return baseCurrencyCode;
    }

    /**
     * @notice Returns quote currency code.
     *
     * @dev Quote currency code is not according to ISO 4217 or other standard.
     */
    function quoteCurrency()
        external
        view
        returns (bytes3)
    {
        return quoteCurrencyCode;
    }

    /**
     * @notice Returns quote currency decimals.
     */
    function decimals()
        external
        view
        returns(uint8)
    {
        return quoteCurrencyDecimals;
    }

    /**
     * @notice Returns an amount of the quote currency needed to purchase
     *         one unit of the base currency.
     *
     * @dev Function throws an exception if the price is invalid, for example,
     *      was not set, or became outdated, etc.
     *
     * @return An amount of the quote currency needed to purchase one unit of
     *         the base base currency.
     */
    function getPrice()
        external
        view
        returns (uint256)
    {
        require(
            expirationHeight > block.number,
            "Price expiration height is lte to the current block height."
        );

        return price;
    }


    /* Public Functions */

    function setPrice(
        uint256 _price,
        uint256 _expirationHeight
    )
        public
    {
        require(
            _expirationHeight > block.number,
            "Price expiration height is lte to the current block height."
        );

        price = _price;

        expirationHeight = _expirationHeight;

        emit PriceUpdated(price);
    }
}