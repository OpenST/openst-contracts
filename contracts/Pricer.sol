/* solhint-disable-next-line compiler-fixed */
pragma solidity ^0.4.17;

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
// Utility chain: Pricer
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------


import "./openst-protocol/EIP20Interface.sol";
import "./openst-protocol/UtilityTokenInterface.sol";
import "./PriceOracleInterface.sol";
import "./OpsManaged.sol";
import "./SafeMath.sol";
import "./PricerInterface.sol";


contract Pricer is OpsManaged, PricerInterface {
    using SafeMath for uint256;

    /*
     *  Storage
     */
    ///BrandedToken address
    address private pricerBrandedToken;

    ///currency to accepted margin mapping, absolute +/- range in currency in which the price point will be accepted
    mapping(bytes3 /* currency */ => uint256 /* margin */) private pricerAcceptedMargins;
    
    ///currency to price oracles address mapping
    mapping(bytes3 /* currency */ => PriceOracleInterface /* price oracle address */) private pricerPriceOracles;

    /// specifies the base currency value e.g. "OST"
    bytes3 private pricerBaseCurrency;

    /// Pricer decimal
    uint8 private pricerDecimals;

    /// conversionRate
    uint256 private pricerConversionRate;

    /// conversionRateDecimals
    uint8 private pricerConversionRateDecimals;

    /*
     *  Public functions
     */
    /// @dev    Takes _brandedToken, _baseCurrency; 
    ///         constructor;
    ///         public method;
    /// @param _brandedToken Branded Token
    /// @param _baseCurrency Base Currency
    function Pricer(
        address _brandedToken,
        bytes3 _baseCurrency)
        public
        OpsManaged()
    {
        require(_brandedToken != address(0));
        require(_baseCurrency != "");
        pricerBrandedToken = _brandedToken;
        pricerBaseCurrency = _baseCurrency;
        pricerDecimals = EIP20Interface(pricerBrandedToken).decimals();
        pricerConversionRate = UtilityTokenInterface(_brandedToken).conversionRate();
        pricerConversionRateDecimals = UtilityTokenInterface(_brandedToken).conversionRateDecimals();
    }

    /*
     *  External functions
     */
    /// clean up or revoke airdrop contract
    function remove()
        external
        onlyAdminOrOps
    {
        Removed(msg.sender);
        selfdestruct(msg.sender);
    }

    /// @dev    Returns address of the branded token;
    ///         public method;
    /// @return address    
    function brandedToken() 
        public
        returns (address)
    {
        return pricerBrandedToken;
    }    

    /// @dev    Takes _currency; 
    ///         returns acceptable margin for the given currency;
    ///         public method;
    /// @param _currency currency
    /// @return uint256 margin
    function acceptedMargins(
        bytes3 _currency) 
        public
        returns (uint256)
    {       
        return pricerAcceptedMargins[_currency];
    }

    /// @dev    Takes _currency; 
    ///         returns address of price oracle for the given currency;
    ///         public method;
    /// @param _currency currency
    /// @return address
    function priceOracles(
        bytes3 _currency) 
        public
        returns (address)
    {   
        return pricerPriceOracles[_currency];
    }

    /// @dev    Returns address of the base currency;
    ///         public method;
    /// @return bytes3    
    function baseCurrency() 
        public
        returns (bytes3)
    {
        return pricerBaseCurrency;
    }

    /// @dev    Returns pricer decimal for branded token;
    ///         public method;
    /// @return uint8    
    function decimals() 
        public
        returns (uint8)
    {
        return pricerDecimals;
    }

    /// @dev    Returns conversion rate for branded token;
    ///         public method;
    /// @return uint256    
    function conversionRate() 
        public
        returns (uint256)
    {
        return pricerConversionRate;
    }

    /// @dev    Returns conversion rate decimals for branded token;
    ///         public method;
    /// @return uint8    
    function conversionRateDecimals() 
        public
        returns (uint8)
    {
        return pricerConversionRateDecimals;
    }

    /// @dev    Takes _currency, _oracleAddress; 
    ///         updates the price oracle address for a given currency;
    ///         emits PriceOracleSet event;
    ///         only called by ops;
    ///         public method;
    /// @param _currency currency
    /// @param _oracleAddress oracleAddress
    /// @return bool isSuccess
    function setPriceOracle(
        bytes3 _currency,
        address _oracleAddress)
        public  
        onlyOps     
        returns (bool /* success */)
    {
        require(_oracleAddress != address(0));
        require(_currency != "");
        require(PriceOracleInterface(_oracleAddress).baseCurrency() == pricerBaseCurrency);
        require(PriceOracleInterface(_oracleAddress).quoteCurrency() == _currency);
        require(PriceOracleInterface(_oracleAddress).decimals() == pricerDecimals);
        pricerPriceOracles[_currency] = PriceOracleInterface(_oracleAddress);

        //Trigger PriceOracleSet event
        PriceOracleSet(_currency, _oracleAddress);
        return true;
    }

    /// @dev    Takes _currency; 
    ///         removes the price oracle address for a given currency;
    ///         emits PriceOracleUnSet event;
    ///         only called by ops;
    ///         public method;
    /// @param _currency currency   
    /// @return bool isSuccess
    function unsetPriceOracle(
        bytes3 _currency)        
        public
        onlyOps
        returns (bool /* success */)
    {       
        require(pricerPriceOracles[_currency] != address(0));
        delete pricerPriceOracles[_currency];

        //Trigger PriceOracleUnset event
        PriceOracleUnset(_currency);
        return true;
    }

    /// @dev    Takes _currency, _acceptedMargin; 
    ///         updates the acceptable margin range for a given currency;
    ///         emits AcceptedMargin event;
    ///         only called by ops;
    ///         public method;
    /// @param _currency currency
    /// @param _acceptedMargin acceptedMargin
    /// @return bool isSuccess
    function setAcceptedMargin(
        bytes3 _currency,
        uint256 _acceptedMargin)             
        public
        onlyOps
        returns (bool /* success */)
    {
        pricerAcceptedMargins[_currency] = _acceptedMargin;
        // Trigger AcceptedMarginSet event 
        AcceptedMarginSet(_currency, _acceptedMargin);
        return true;
    }

    /// @dev    Takes _transferAmount, _commissionAmount, _currency;
    ///         public view method
    /// @param _transferAmount transferAmount
    /// @param _commissionAmount commissionAmount    
    /// @param _currency currency
    /// @return (pricePoint, calculatedTransferAmount, calculatedCommissionAmount)
    function getPricePointAndCalculatedAmounts(       
        uint256 _transferAmount,        
        uint256 _commissionAmount,      
        bytes3 _currency)
        public
        view
        returns (
            uint256 pricePoint,
            uint256 tokenAmount, 
            uint256 commissionTokenAmount)
    {
        require(_currency != 0);
        pricePoint = getPricePoint(_currency);
        require(pricePoint > 0);
        (tokenAmount, commissionTokenAmount) = getBTAmountFromCurrencyValue(pricePoint,
                _transferAmount, _commissionAmount);
        return (pricePoint, tokenAmount, commissionTokenAmount);
    }

    /// @dev    Takes _beneficiary, _transferAmount, _commissionBeneficiary, _commissionAmount, 
    ///         _currency, _intendedPricePoint;Validates if the currentPrice from price oracle is 
    ///         in accepatble margin of _intendedPricePoint (if _ currency is not 0) 
    ///         if _currency is 0 then it transfer the branded tokens equal to _transferAmount 
    ///         to _beneficiary and  branded tokens equal to _commissionAmount to _commissionBeneficiary 
    ///         (floating value transaction); if _currency is not 0 then it transfer the branded tokens 
    ///         equivalant to _transferAmount in currency value to _beneficiary and  branded tokens 
    ///         equivalant to _commissionAmount in currency value to _commissionBeneficiary 
    ///         (fixed value transaction); emits payment event;
    ///         public method
    /// @param _beneficiary beneficiary
    /// @param _transferAmount transferAmount
    /// @param _commissionBeneficiary commissionBeneficiary
    /// @param _commissionAmount commissionAmount
    /// @param _currency currency
    /// @param _intendedPricePoint _intendedPricePoint
    /// @return uint256 total paid
    function pay(       
        address _beneficiary,
        uint256 _transferAmount,        
        address _commissionBeneficiary,
        uint256 _commissionAmount,      
        bytes3 _currency,
        uint256 _intendedPricePoint)
        public
        returns (uint256 /* total paid */)
    {
        require(isValidBeneficiaryData(_beneficiary, _transferAmount,
            _commissionBeneficiary, _commissionAmount));

        uint256 tokenAmount = _transferAmount;
        uint256 commissionTokenAmount = _commissionAmount;
        uint256 pricePoint = _intendedPricePoint;

        // check Margin And Calculate BTAmount
        if (_currency != "") {
            (pricePoint, tokenAmount, commissionTokenAmount) = validateMarginAndCalculateBTAmount(_currency,
                _intendedPricePoint, _transferAmount, _commissionAmount);
        }

        require(performTransfers(msg.sender, _beneficiary, tokenAmount,
            _commissionBeneficiary, commissionTokenAmount));

        //Trigger Event for PaymentComplete
        Payment(_beneficiary, tokenAmount, _commissionBeneficiary,
            commissionTokenAmount, _currency, _intendedPricePoint, pricePoint);
        return (tokenAmount + commissionTokenAmount);
    }

    /// @dev    Takes _currency; 
    ///         gets current price point for the price oracle for the given currency; 
    ///         public method;
    /// @param _currency currency
    /// @return (pricePoint)
    function getPricePoint(
        bytes3 _currency)
        public
        view
        returns (uint256) /* pricePoint */
    {
        PriceOracleInterface currentPriceOracle = pricerPriceOracles[_currency];
        require(currentPriceOracle != address(0));
        return (currentPriceOracle.getPrice()); 
    }

    /*
     *  Internal functions
     */
    /// @dev    Takes _intendedPricePoint, _currentPricePoint, _acceptedMargin;
    ///         checks if the current price point is in the acceptable range of intendedPricePoint; 
    ///         internal method;
    /// @param _intendedPricePoint intendedPricePoint
    /// @param _currentPricePoint currentPricePoint
    /// @param _acceptedMargin acceptedMargin   
    /// @return bool isValid
    function isPricePointInRange(
        uint256 _intendedPricePoint,
        uint256 _currentPricePoint,
        uint256 _acceptedMargin)
        internal
        pure
        returns (bool /*isValid*/)
    {
        bool isValid = true;
        if (_intendedPricePoint >= _acceptedMargin) {
            isValid = SafeMath.sub(_intendedPricePoint, _acceptedMargin) <= _currentPricePoint;
        }
        if (isValid) {
            isValid = _currentPricePoint <= SafeMath.add(_intendedPricePoint, _acceptedMargin);
        }
        return isValid;     
    }
    
    /// @dev    Takes _pricePoint, _transferAmount, _commissionAmount; 
    ///         calculates the number of branded token equivalant to the currency amount; 
    ///         internal method;
    /// @param _pricePoint pricePoint
    /// @param _transferAmount transferAmount
    /// @param _commissionAmount commissionAmount
    /// @return (amountBT,commissionAmountBT)
    function getBTAmountFromCurrencyValue(
        uint256 _pricePoint,
        uint256 _transferAmount,
        uint256 _commissionAmount)
        internal
        view
        returns (uint256, uint256) /* number of BT ,number of commission BT */
    {
        uint256 adjConversionRate = SafeMath.div(SafeMath.mul(pricerConversionRate, 10**uint256(pricerDecimals)), 10**uint256(pricerConversionRateDecimals));
        uint256 amountBT = SafeMath.div(SafeMath.mul(_transferAmount, adjConversionRate), _pricePoint);
        uint256 commissionAmountBT = SafeMath.div(SafeMath.mul(_commissionAmount, adjConversionRate), _pricePoint);
        return (amountBT, commissionAmountBT);
    }

    /// @dev    Takes _beneficiary, _transferAmount, _commissionBeneficiary, _commissionAmount;
    ///         checks if the current price point is in the acceptable range of intendedPricePoint;
    ///         internal method;
    /// @param _beneficiary beneficiary
    /// @param _transferAmount transferAmount
    /// @param _commissionBeneficiary commissionBeneficiary
    /// @param _commissionAmount commissionAmount
    /// @return bool isValid
    function isValidBeneficiaryData(
        address _beneficiary,
        uint256 _transferAmount,
        address _commissionBeneficiary,
        uint256 _commissionAmount)
        internal
        returns (bool /*isValid*/)
    {
        require(_beneficiary != address(0));
        require(_transferAmount != 0);

        if (_commissionAmount > 0) {
            require(_commissionBeneficiary != address(0));
        }
        return true;
    }

    /// @dev    Takes _spender, _beneficiary, _tokenAmount, _commissionBeneficiary, _commissionTokenAmount;
    ///         Perform tokenAmount transfer
    ///         Perform commissionTokenAmount transfer
    ///         internal method;
    /// @param _spender spender
    /// @param _beneficiary beneficiary
    /// @param _tokenAmount tokenAmount
    /// @param _commissionBeneficiary commissionBeneficiary
    /// @param _commissionTokenAmount commissionTokenAmount
    /// @return (bool)
    function performTransfers(
        address _spender,
        address _beneficiary,
        uint256 _tokenAmount,
        address _commissionBeneficiary,
        uint256 _commissionTokenAmount)
        internal
        returns (
            bool /* boolean value */)
    {
        require(EIP20Interface(pricerBrandedToken).transferFrom(_spender, _beneficiary, _tokenAmount));

        if (_commissionBeneficiary != address(0)) {
            require(EIP20Interface(pricerBrandedToken).transferFrom(_spender,
            _commissionBeneficiary, _commissionTokenAmount));
        }
        return true;
    }

    /// @dev    Takes _currency, _intendedPricePoint, _transferAmount, _commissionAmount;
    ///         Validate accepted margin
    ///         Calculates tokenAmount and commissionTokenAmount
    ///         internal method
    /// @param _currency currency
    /// @param _intendedPricePoint intendedPricePoint
    /// @param _transferAmount transferAmount
    /// @param _commissionAmount commissionAmount
    /// @return (pricePoint, tokenAmount, commissionTokenAmount)
    function validateMarginAndCalculateBTAmount(
        bytes3 _currency,
        uint256 _intendedPricePoint,
        uint256 _transferAmount,
        uint256 _commissionAmount)
        internal
        returns (uint256, uint256, uint256) /* pricePoint, tokenAmount, commissionTokenAmount */
    {
        uint256 pricePoint = getPricePoint(_currency);
        require(pricePoint > 0);
        require(isPricePointInRange(_intendedPricePoint, pricePoint, acceptedMargins(_currency)));

        uint256 tokenAmount;
        uint256 commissionTokenAmount;
        (tokenAmount, commissionTokenAmount) = getBTAmountFromCurrencyValue(pricePoint, _transferAmount,
            _commissionAmount);

        return (pricePoint, tokenAmount, commissionTokenAmount);
    }

}
