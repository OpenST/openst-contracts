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


contract PricerRule is Organized {

    /* Usings */

    using SafeMath for uint256;


    /* Events */

    event PriceOracleAdded(
        address _priceOracle
    );

    event PriceOracleRemoved(
        address _priceOracle
    );

    event AcceptanceMarginAdded(
        bytes3 _quoteCurrencyCode,
        uint256 acceptanceMargin
    );

    event AcceptanceMarginRemoved(
        bytes3 _quoteCurrencyCode
    );


    /* Storage */

    /**
     * @dev The code of the base currency of the economy.
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
    TokenRules public tokenRules;

    /**
     * @dev Mapping from pay-currency code to corresponding price oracle.
     *      The mapped price oracle's base currency code should be the economy
     *      base currency code (see baseCurrencyCode storage variable)
     *      and the quote currency code should be the corresponding pay-currency
     *      code.
     */
    mapping(bytes3 => PriceOracleInterface) public baseCurrencyPriceOracles;

    /**
     * @dev Mapping from pay-currency code to price difference accepatance
     *      margin. During a pay operation an intended price for
     *      pay-currency is presented, that is checked against current price of
     *      pay-currenency wrt stored acceptance margin.
     */
    mapping(bytes3 => uint256) public baseCurrencyPriceAcceptanceMargins;


    /* Special Functions */

    /**
     * @notice Constructs a new pricer object.
     *
     * @dev Function requires:
     *          - The economy token address is not null.
     *          - The base currency code is not empty.
     *          - Conversion rate from the base currency to the token is not 0.
     *          - The economy token rules address is not null.
     *
     * @param _organization Organization address.
     * @param _eip20Token The economy token address.
     * @param _baseCurrencyCode The economy base currency code.
     * @param _conversionRate The conversion rate from the economy base currency
     *                        to the token.
     * @param _conversionRateDecimals The conversion rate's decimals from the
     *                                economy base currency to the token.
     * @param _tokenRules The economy token rules address.
     */
    constructor(
        OrganizationInterface _organization,
        address _eip20Token,
        bytes3 _baseCurrencyCode,
        uint256 _conversionRate,
        uint8 _conversionRateDecimals,
        address _tokenRules
    )
        Organized(_organization)
        public
    {
        require(_eip20Token != address(0), "Token address is null.");

        require(
            _baseCurrencyCode != bytes3(0),
            "Base currency code is null."
        );

        require(
            _conversionRate != 0,
            "Conversion rate from the base currency to the token is 0."
        );

        require(
            _tokenRules != address(0),
            "Token rules address is null."
        );

        eip20Token = EIP20TokenInterface(_eip20Token);

        baseCurrencyCode = _baseCurrencyCode;

        conversionRateFromBaseCurrencyToToken = _conversionRate;

        conversionRateDecimalsFromBaseCurrencyToToken = _conversionRateDecimals;

        tokenRules = TokenRules(_tokenRules);
    }


    /* External Functions */

    /**
     * @notice Transfers from the msg.sender account to the specified addresses
     *         an amount of the economy tokens equivalent (after conversion) to
     *         the specified amounts in pay currency.
     *
     * @dev Function requires:
     *          - The lengths of arrays of beneficiaries and amounts are equal.
     *          - The intended price of the base currency in the pay currency
     *            wrt the current price is in the registered acceptance margin.
     *
     * @param _payCurrencyCode Currency code of the specified amounts.
     * @param _baseCurrencyIntendedPrice The intended price of the base currency
     *                                   used during conversion within function.
     */
    function pay(
        bytes3 _payCurrencyCode,
        uint256 _baseCurrencyIntendedPrice,
        address[] _toList,
        uint256[] _amountList
    )
        external
    {
        uint256 baseCurrencyCurrentPrice = getBaseCurrencyPrice(
            _payCurrencyCode
        );

        require(
            _toList.length == _amountList.length,
            "'to' and 'amount' transfer arrays' lengths are not equal."
        );

        require(
            isPriceInRange(
                _baseCurrencyIntendedPrice,
                baseCurrencyCurrentPrice,
                baseCurrencyPriceAcceptanceMargins[_payCurrencyCode]
            ),
            "Intended price is not in the accepted margin wrt current price."
        );

        for(uint256 i = 0; i < _toList.length; ++i) {

            eip20Token.transferFrom(
                msg.sender,
                _toList[i],
                convertPayCurrencyToToken(
                    _baseCurrencyIntendedPrice,
                    _amountList[i]
                )
            );
        }
    }

    /**
     * @notice Adds a new price oracle.
     *
     * @dev Function requires:
     *          - Only organization's workers are allowed to call the function.
     *          - The proposed price oracle's address is not null.
     *          - The proposed price oracle's base currency code is
     *            equal to the economy base currency code specified in this
     *            contract constructor.
     *          - The proposed price oracle does not exist.
     *
     * @param _priceOracle The proposed price oracle.
     */
    function addPriceOracle(
        PriceOracleInterface _priceOracle
    )
        external
        onlyWorker
    {
        require(
            _priceOracle != address(0),
            "Price oracle address is null."
        );

        bytes3 payCurrencyCode = _priceOracle.getQuoteCurrencyCode();

        require(
            baseCurrencyPriceOracles[payCurrencyCode] == address(0),
            "Price oracle already exists."
        );

        require(
            _priceOracle.getBaseCurrencyCode() == baseCurrencyCode,
            "Price oracle's base currency code does not match."
        );

        baseCurrencyPriceOracles[payCurrencyCode] = _priceOracle;

        emit PriceOracleAdded(_priceOracle);
    }

    /**
     * @notice Removes the price oracle for the specified pay currency code.
     *
     * @dev Function requires:
     *          - Only organization's workers are allowed to call the function.
     *          - Price oracle matching with the specified pay currency code
     *            exists.
     */
    function removePriceOracle(
        bytes3 _payCurrencyCode
    )
        external
        onlyWorker
    {
        PriceOracleInterface priceOracle = baseCurrencyPriceOracles[
            _payCurrencyCode
        ];

        require(
            priceOracle != address(0),
            "Price oracle to remove does not exist."
        );

        delete baseCurrencyPriceOracles[_payCurrencyCode];

        emit PriceOracleRemoved(priceOracle);
    }

    /**
     * @notice Adds an acceptance margin of the base currency price in the
     *         specified pay currency.
     *
     * @dev Function requires:
     *          - Only organization's workers are allowed to call the function.
     *          - The specified pay currency code is not null.
     */
    function addAcceptanceMargin(
        bytes3 _payCurrencyCode,
        uint256 _acceptanceMargin
    )
        external
        onlyWorker
    {
        require(
            _payCurrencyCode != bytes3(0),
            "Pay currency code is null."
        );

        baseCurrencyPriceAcceptanceMargins[_payCurrencyCode] = _acceptanceMargin;

        emit AcceptanceMarginAdded(
            _payCurrencyCode,
            _acceptanceMargin
        );
    }

    /**
     * @notice Removes an acceptance margin of the base currency price in the
     *         specified pay currency.
     *
     * @dev Function requires:
     *          - Only organization's workers are allowed to call the function.
     *          - The specified pay currency code is not null.
     */
    function removeAcceptanceMargin(
        bytes3 _payCurrencyCode
    )
        external
        onlyWorker
    {
        require(
            _payCurrencyCode != bytes3(0),
            "Pay currency code is null."
        );

        delete baseCurrencyPriceAcceptanceMargins[_payCurrencyCode];

        emit AcceptanceMarginRemoved(_payCurrencyCode);
    }


    /* Private Functions */

    function getBaseCurrencyPrice(
        bytes3 _payCurrencyCode
    )
        private
        view
        returns(uint256)
    {
        PriceOracleInterface priceOracle = baseCurrencyPriceOracles[
            _payCurrencyCode
        ];

        require(
            priceOracle != address(0),
            "Price oracle for the specified currency code does not exist."
        );

        return priceOracle.getPrice();
    }

    function convertPayCurrencyToToken(
        uint256 _baseCurrencyPriceInPayCurrency,
        uint256 _payCurrencyAmount
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