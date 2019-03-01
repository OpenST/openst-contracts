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

import "./PriceOracleInterface.sol";
import "../token/EIP20TokenInterface.sol";
import "../token/TokenRules.sol";
import "../external/SafeMath.sol";


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

    event AcceptanceMarginSet(
        bytes3 _quoteCurrencyCode,
        uint256 _acceptanceMargin
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
     * @dev Required decimals for price oracles.
     */
    uint8 public requiredPriceOracleDecimals;

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
     * @param _requiredPriceOracleDecimals Required decimals for price oracles.
     * @param _tokenRules The economy token rules address.
     */
    constructor(
        OrganizationInterface _organization,
        address _eip20Token,
        bytes3 _baseCurrencyCode,
        uint256 _conversionRate,
        uint8 _conversionRateDecimals,
        uint8 _requiredPriceOracleDecimals,
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

        requiredPriceOracleDecimals = _requiredPriceOracleDecimals;

        tokenRules = TokenRules(_tokenRules);
    }


    /* External Functions */

    /**
     * @notice Transfers from the msg.sender account to the specified addresses
     *         an amount of the economy tokens equivalent (after conversion) to
     *         the specified amounts in pay currency.
     *
     * @dev Function requires:
     *          - From address is not null.
     *          - The lengths of arrays of beneficiaries and amounts are equal.
     *          - The intended price of the base currency in the pay currency
     *            wrt the current price is in the registered acceptance margin.
     *
     * @param _payCurrencyCode Currency code of the specified amounts.
     * @param _baseCurrencyIntendedPrice The intended price of the base currency
     *                                   used during conversion within function.
     */
    function pay(
        address _from,
        address[] calldata _toList,
        uint256[] calldata _amountList,
        bytes3 _payCurrencyCode,
        uint256 _baseCurrencyIntendedPrice
    )
        external
    {
        require(
            _from != address(0),
            "From address is null."
        );

        require(
            _toList.length == _amountList.length,
            "'to' and 'amount' transfer arrays' lengths are not equal."
        );

        if (_toList.length == 0) {
            return;
        }

        uint256 baseCurrencyCurrentPrice = baseCurrencyPrice(
            _payCurrencyCode
        );

        require(
            baseCurrencyCurrentPrice != 0,
            "Base currency price in pay currency is 0."
        );

        require(
            isPriceInRange(
                _baseCurrencyIntendedPrice,
                baseCurrencyCurrentPrice,
                baseCurrencyPriceAcceptanceMargins[_payCurrencyCode]
            ),
            "Intended price is not in the acceptable margin wrt current price."
        );

        uint256[] memory convertedAmounts = new uint256[](_amountList.length);

        for(uint256 i = 0; i < _amountList.length; ++i) {
            convertedAmounts[i] = convertPayCurrencyToToken(
                baseCurrencyCurrentPrice,
                _amountList[i]
            );
        }

        tokenRules.executeTransfers(
            _from,
            _toList,
            convertedAmounts
        );
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
     *          - The proposed price oracle decimals number is equal to
     *            the contract required price oracle decimals number.
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
            address(_priceOracle) != address(0),
            "Price oracle address is null."
        );

        require(
            _priceOracle.decimals() == requiredPriceOracleDecimals,
            "Price oracle decimals number is difference from the required one."
        );

        bytes3 payCurrencyCode = _priceOracle.quoteCurrency();

        require(
            address(baseCurrencyPriceOracles[payCurrencyCode]) == address(0),
            "Price oracle already exists."
        );

        require(
            _priceOracle.baseCurrency() == baseCurrencyCode,
            "Price oracle's base currency code does not match."
        );

        baseCurrencyPriceOracles[payCurrencyCode] = _priceOracle;

        emit PriceOracleAdded(address(_priceOracle));
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
            address(priceOracle) != address(0),
            "Price oracle to remove does not exist."
        );

        delete baseCurrencyPriceOracles[_payCurrencyCode];

        emit PriceOracleRemoved(address(priceOracle));
    }

    /**
     * @notice Sets an acceptance margin for the base currency price per pay
     *         currency.
     *
     * @dev Function requires:
     *          - Only organization's workers are allowed to call the function.
     *          - The specified pay currency code is not null.
     */
    function setAcceptanceMargin(
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

        emit AcceptanceMarginSet(
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

    function baseCurrencyPrice(
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
            address(priceOracle) != address(0),
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
            .mul(
                10 ** uint256(requiredPriceOracleDecimals)
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