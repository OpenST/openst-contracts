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

interface PriceOracleInterface {

    /** External Functions */

    /**
     * @notice Returns base currency code.
     *
     * @dev Base currency code is not according to ISO 4217 or other standard.
     */
    function getBaseCurrencyCode()
        external
        view
        returns (bytes3);

    /**
     * @notice Returns quote currency code.
     *
     * @dev Quote currency code is not according to ISO 4217 or other standard.
     */
    function getQuoteCurrencyCode()
        external
        view
        returns (bytes3);

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
        returns(uint256);
}