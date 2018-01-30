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
// Utility chain: PricerInterface
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

contract PricerInterface {

    /*
     *  Events
     */
    ///Event for payment complete    
    event Payment(
        address _beneficiary,
        uint256 _transferAmount,
        address _commissionBeneficiary,
        uint256 _commissionAmount,      
        bytes3 _currency,
        uint256 _intendedPricePoint,
        uint256 _actualPricePoint);
    
    ///Event for price oracles updates for currency
    event PriceOracleSet(       
        bytes3 _currency,
        address _address);
    
    ///Event for price oracles delete
    event PriceOracleUnset(     
        bytes3 _currency);

    ///Event for accepted margin update for currency
    event AcceptedMarginSet(
        bytes3 _currency,       
        uint64 _acceptedMargin);

    /// @dev    Returns address of the branded token;
    ///         public method;
    /// @return address    
    function brandedToken() 
        public 
        returns (address);    

    /// @dev    Takes _currency; 
    ///         returns acceptable margin for the given currency;
    ///         public method;
    /// @param _currency currency
    /// @return uint64 margin
    function acceptedMargins(
        bytes3 _currency) 
        public 
        returns (uint64);

    /// @dev    Takes _currency; 
    ///         returns address of price oracle for the given currency;
    ///         public method;
    /// @param _currency currency
    /// @return address
    function priceOracles(
        bytes3 _currency) 
        public 
        returns (address);

    /// @dev    Returns address of the base currency;
    ///         public method;
    /// @return bytes3    
    function baseCurrency() 
        public
        returns (bytes3);

    /// @dev    Returns pricer decimal;
    ///         public method;
    /// @return bytes3    
    function decimals() 
        public
        returns (uint8);

    /// @dev    Returns conversion rate;
    ///         public method;
    /// @return bytes3    
    function conversionRate() 
        public
        returns (uint256);

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
        returns (bool);

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
        returns (bool);
    
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
        uint64 _acceptedMargin) 
        public 
        returns (bool);   

    /// @dev    Takes _transferAmount, _commissionAmount, _currency;
    ///         public method
    /// @param _transferAmount transferAmount
    /// @param _commissionAmount commissionAmount
    /// @param _currency currency
    /// @return (pricePoint, calculatedTransferAmount, calculatedCommissionAmount)
    function getPricePointAndCalculatedAmount(       
        uint256 _transferAmount,        
        uint256 _commissionAmount,      
        bytes3 _currency)
        public
        returns (uint256, uint256, uint256);  

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
    /// @return bool isSuccess
    function pay(
        address _beneficiary, 
        uint256 _transferAmount, 
        address _commissionBeneficiary, 
        uint256 _commissionAmount, 
        bytes3 _currency, 
        uint256 _intendedPricePoint) 
        public 
        returns (bool);

    /// @dev    Takes _currency; 
    ///         gets current price point for the price oracle for the give currency; 
    ///         public method;
    /// @param _currency currency
    /// @return (currentPrice)
    function getPricePoint(
        bytes3 _currency) 
        public 
        returns (uint256, uint8);
    
    
}