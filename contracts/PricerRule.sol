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

import "./PriceOracleInterface.sol";
import "./EIP20TokenInterface.sol";
import "./TokenRules.sol";
import "./SafeMath.sol";


contract PricerRule {

    /* Usings */

    using SafeMath for uint256;


    /* Storage */

    /**
     * @dev The code of the base of the economy.
     */
    bytes3 public baseCurrencyCode;

    /**
     * @dev EIP20 token address of the economy.
     */
    EIP20TokenInterface public eip20Token;

    /**
     * @dev Conversion rate from the base currency to the economy token.
     */
    uint256 public conversionRateFromBaseCurrencyToToken;

    /**
     * @dev Conversion rate decimals from the base currency to the
     *      economy token.
     */
    uint256 public conversionRateDecimalsFromBaseCurrencyToToken;

    /**
     * @dev Token rules address of the economy.
     */
    TokenRules private tokenRules;

    /**
     * @dev Mapping from all-uppercase pay-currency code (according ISO 4217)
     *      to corresponding price oracle.
     */
    mapping(bytes3 => PriceOracleInterface) private payCurrencyPriceOracles;

    /**
     * @dev Mapping from pay-currency code to price difference accepatance
     *      margin. During a pay operation an intended price for
     *      pay-currency is presented, that is checked against current price of
     *      pay-currenency wrt stored acceptance margin.
     */
    mapping(bytes3 => uint256) private payCurrencyPriceAcceptanceMargins;


    /* Special Functions */

    /**
     * @notice Constructs a new pricer object.
     *
     * @dev Function requires:
     *          - The economy token address is not null.
     *          - The base currency code is not empty.
     *          - Conversion rate from the base currency to the token is not 0.
     *          - Conversion rate's decimals from the base currency to the
     *            token is not 0.
     *          - The economy token rules address is not null.
     *
     * @param _eip20Token The economy token address.
     * @param _baseCurrencyCode The economy base currency code.
     * @param _conversionRate The conversion rate from the economy base currency
     *                        to the token.
     * @param _conversionRateDecimals The conversion rate's decimals from the
     *                                economy base currency to the token.
     * @param _tokenRules The economy token rules address.
     */
    constructor(
        address _eip20Token,
        bytes3 _baseCurrencyCode,
        uint256 _conversionRate,
        uint8 _conversionRateDecimals,
        address _tokenRules
    )
        public
    {
        require(_eip20Token != address(0), "EIP20 Token address is null.");

        require(
            _baseCurrencyCode != bytes3(0),
            "Base currency code is null."
        );

        require(
            _conversionRate != 0,
            "Conversion rate from the base currency to the token is 0."
        );

        require(
            _conversionRateDecimals != 0,
            "Conversion rate's decimals from the base currency to the token is 0."
        );

        require(
            _tokenRules != address(0),
            "Token rules address is null."
        );

        eip20Token = EIP20TokenInterface(_eip20Token);

        conversionRateDecimalsFromBaseCurrencyToToken = _conversionRate;

        conversionRateDecimalsFromBaseCurrencyToToken = _conversionRateDecimals;

        tokenRules = TokenRules(_tokenRules);
    }


    /* External Functions */

    function pay(
        bytes3 _payCurrencyCode,
        uint256 _baseCurrencyIntendedPrice,
        address[] _toList,
        uint256[] _amountList
    )
        external
    {
        uint256 _baseCurrencyCurrentPrice = getBaseCurrencyPrice(
            _payCurrencyCode
        );

        require(
            _toList.length == _amountList.length,
            "'to' and 'amount' transfer arrays' lengths are not equal."
        );

        require(
            isPriceInRange(
                _baseCurrencyIntendedPrice,
                _baseCurrencyCurrentPrice,
                payCurrencyPriceAcceptanceMargins[_payCurrencyCode]
            ),
            "Intended price is not in the accepted margin wrt current price."
        );

        for(uint256 i = 0; i < _toList.length; ++i) {

            eip20Token.transferFrom(
                msg.sender,
                _toList[i],
                convertPayCurrencyToToken(
                    _amountList[i],
                    _baseCurrencyIntendedPrice
                )
            );
        }
    }

    function addPriceOracle(
        bytes3 _payCurrencyCode,
        address _priceOracle
    )
        external
    {
        require(
            _payCurrencyCode != bytes3(0),
            "Pay currency code is null."
        );

        require(_priceOracle != address(0), "Price oracle address is null.");

        payCurrencyPriceOracles[
            _payCurrencyCode
        ] = PriceOracleInterface(_priceOracle);
    }

    function removePriceOracle(
        bytes3 _payCurrencyCode
    )
        external
    {
        PriceOracleInterface priceOracle = payCurrencyPriceOracles[
            _payCurrencyCode
        ];

        require(
            priceOracle != address(0),
            "Price oracle to remove does not exist."
        );

        delete payCurrencyPriceOracles[_payCurrencyCode];
    }

    function addAcceptanceMargin(
        bytes3 _payCurrencyCode,
        uint256 _acceptanceMargin
    )
        external
    {
        require(
            _payCurrencyCode != bytes3(0),
            "Pay currency code is null."
        );

        payCurrencyPriceAcceptanceMargins[_payCurrencyCode] = _acceptanceMargin;
    }

    function removeAcceptanceMargin(
        bytes3 _payCurrencyCode
    )
        external
    {
        delete payCurrencyPriceAcceptanceMargins[_payCurrencyCode];
    }


    /* Private Functions */

    function getBaseCurrencyPrice(
        bytes3 _payCurrencyCode
    )
        private
        view
        returns(uint256)
    {
        PriceOracleInterface priceOracle = payCurrencyPriceOracles[
            _payCurrencyCode
        ];

        require(
            priceOracle != address(0),
            "Price oracle for the specified currency code does not exist."
        );

        return priceOracle.getPrice();
    }

    function convertPayCurrencyToToken(
        uint256 _payCurrencyAmount,
        uint256 _baseCurrencyPriceInPayCurrency
    )
        private
        view
        returns (uint256)
    {
        return _payCurrencyAmount
            .mul(
                conversionRateFromBaseCurrencyToToken
            )
            .div(
                10 ** conversionRateDecimalsFromBaseCurrencyToToken
            )
            .div(
                _baseCurrencyPriceInPayCurrency
            );
    }

    function isPriceInRange(
        uint256 _intendedPrice,
        uint256 _currentPrice,
        uint256 _acceptanceMargin
    )
        private
        pure
        returns(bool isInRange)
    {
        uint256 diff = 0;
        if (_currentPrice > _intendedPrice) {
            diff = _currentPrice.sub(_intendedPrice);
        } else {
            diff = _intendedPrice.sub(_currentPrice);
        }

        return diff <= _acceptanceMargin;
    }

}