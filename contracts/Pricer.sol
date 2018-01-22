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
import "./ost-price-oracle/PriceOracleInterface.sol";
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

	///currency to Margin mapping, Absolute +/- range in currency in which the price point will be accepted
	mapping(bytes3 /* currency */ => uint64 /* margin */) private pricerAcceptedMargins;
	
	///currency to Price Oracles address mapping
	mapping(bytes3 /* currency */ => address /* price oracle address */) private pricerPriceOracles;

	/*
	 *  Events
	 */

	///Event for PaymentComplete
	event Payment(
		address _beneficiary,
		uint256 _transferAmount,		
		address _commissionBeneficiary,
		uint256 _commissionAmount,		
		bytes3 _currency,
		uint256 _intendedPricePoint,
		uint256 _actualPricePoint);
	
	///Event for priceOracles Updates for currency
	event PriceOracleSet(		
		bytes3 _currency,
		address _address);

	///Event for AcceptedMargin update for currency
	event AcceptedMargin(
		bytes3 _currency,		
		uint64 relativeIntendedPriceRange);
	
	/*
	 *  Public functions
	 */

	function Pricer(
		address _brandedToken)
		public
		OpsManaged()
	{
		pricerBrandedToken = _brandedToken;
	}

	/// @dev    Returns address of the branded token;
	///         Public;
	/// @return address    
	function brandedToken() 
		public 
		returns (address)
	{
		return pricerBrandedToken;
	}    

	/// @dev    Takes _currency; 
	///         Returns Acceptable margin for the given currency;
	///         Public;
	/// @param _currency currency
	/// @return uint64 margin
	function acceptedMargins(
		bytes3 _currency) 
		public 
		returns (uint64)
	{		
		return pricerAcceptedMargins[_currency];
	}

	/// @dev    Takes _currency; 
	///         Returns address of Price Oracle for the given currency;
	///         Public
	/// @param _currency currency
	/// @return address
	function priceOracles(
		bytes3 _currency) 
		public 
		returns (address)
	{	
		return pricerPriceOracles[_currency];
	}

	/// @dev	Takes _currency, _oracleAddress; 
	///				Updated the Price Oracle address for a given currency
	///				Emits PriceOracleSet Event;
	///				Only called by ops
	/// @param _currency currency
	/// @param _oracleAddress oracleAddress
	/// @return bool isSuccess
	function setPriceOracle(
		bytes3 _currency,
		address _oracleAddress)
		onlyOps
		public
		returns (bool /* success */)
	{
		require(_oracleAddress != address(0));
		require(_currency != "");
		pricerPriceOracles[_currency] = _oracleAddress;

		//Trigger PriceOracleSet event
		PriceOracleSet(_currency, _oracleAddress);
		return true;
	}

	/// @dev	Takes _currency, _acceptedMargin; 
	///				Updated the acceptable margin range for a given currency
	///				Emits AcceptedMargin Event;
	///				Only called by ops
	/// @param _currency currency
	/// @param _acceptedMargin acceptedMargin
	/// @return bool isSuccess
	function setAcceptedMargin(
		bytes3 _currency,
		uint64 _acceptedMargin)	 	
		onlyOps
		public
		returns (bool /* success */)
	{
		pricerAcceptedMargins[_currency] = _acceptedMargin;
		// Trigger Event for Intended Price Acceptable Range Update
		AcceptedMargin(_currency, _acceptedMargin);
		return true;
	}

	/// @dev	Takes _beneficiary, _transferAmount, _commissionBeneficiary, _commissionAmount, _currency, _intendedPricePoint; 
	///				Validates if the currentPrice from PriceOracle is in accepatble margin of _intendedPricePoint (If _ currency is not 0)
	///				If _currency is 0 then it transfer the Branded tokens equal to _transferAmount to _beneficiary and  Branded tokens equal to _commissionAmount to _commissionBeneficiary (Floating value transaction);
	///				If _currency is not 0 then it transfer the Branded tokens equivalant to _transferAmount in currency value to _beneficiary and  Branded tokens equivalant to _commissionAmount in currency value to _commissionBeneficiary (Fixed value transaction);  
	///				Emits Payment Event;
	///				Public method
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
		returns (bool /* success */)
	{
		require(_beneficiary != address(0));
		require(_transferAmount != 0);

		if(_commissionAmount > 0) {
			require(_commissionBeneficiary != address(0));
		}

		uint256 tokenAmount = _transferAmount;
		uint256 commissionTokenAmount = _commissionAmount;
		uint256 pricePoint = _intendedPricePoint;
		if(_currency != 0) {
			uint8 tokenDecimals = 0;
			(pricePoint, tokenDecimals) = getPricePoint(_currency);
			require(pricePoint > 0);			
			require(isPricePointInRange(_intendedPricePoint, pricePoint, pricerAcceptedMargins[_currency]));			
			(tokenAmount, commissionTokenAmount) = getBTAmountFromCurrencyValue(pricePoint, tokenDecimals, _transferAmount, _commissionAmount);
		}
		
		require(EIP20Interface(pricerBrandedToken).transferFrom(msg.sender, _beneficiary, tokenAmount));
		if(_commissionBeneficiary != address(0)) {
			require(EIP20Interface(pricerBrandedToken).transferFrom(msg.sender, _commissionBeneficiary, commissionTokenAmount));
		}
		
		//Trigger Event for PaymentComplete
		Payment(_beneficiary, _transferAmount, _commissionBeneficiary, _commissionAmount, _currency, _intendedPricePoint, pricePoint);		
		return true;
	}

	/// @dev	Takes _currency; 
	///				gets current price point and token decimal for the priceOracle for the give currency; 
	///				Public method
	/// @param _currency currency
	/// @return (currentPrice, TokenDecimals)
	function getPricePoint(
		bytes3 _currency)
		public
		returns (uint256 /* pricePoint */, uint8 /* TokenDecimal*/)
	{
		require(_currency != "");
		PriceOracleInterface  currentPriceOracle = PriceOracleInterface(pricerPriceOracles[_currency]);
		require(currentPriceOracle != address(0));
		return (currentPriceOracle.getPrice(), currentPriceOracle.TOKEN_DECIMALS());	
	}
	
	/// @dev	Takes _intendedPricePoint, _currentPricePoint, _acceptedMargin;
	///				Checks if the current price point is in the acceptable range of intendedPricePoint; 
	///				Private method
	/// @param _intendedPricePoint intendedPricePoint
	/// @param _currentPricePoint currentPricePoint
	/// @param _acceptedMargin acceptedMargin	
	/// @return bool isValid
	function isPricePointInRange(
		uint256 _intendedPricePoint,
		uint256 _currentPricePoint,
		uint64 _acceptedMargin)
		private
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
	

	/// @dev	Takes _pricePoint, _tokenDecimals, _transferAmount, _commissionAmount; 
	///				Calculated the number of branded token equivalant to the currency amount; 
	///				Private method
	/// @param _pricePoint pricePoint
	/// @param _tokenDecimals tokenDecimals
	/// @param _transferAmount transferAmount
	/// @param _commissionAmount commissionAmount
	/// @return (amountBT,commissionAmountBT)
	function getBTAmountFromCurrencyValue(uint256 _pricePoint,
		uint8 _tokenDecimals,
		uint256 _transferAmount,
		uint256 _commissionAmount)
		private
		returns (uint256 /* number of BT */, uint256 /*  number of commission BT */)
	{
		uint256 conversionRate = UtilityTokenInterface(pricerBrandedToken).conversionRate();
		require(conversionRate > 0);	
		uint256 adjConversionRate = SafeMath.mul(conversionRate, 10**uint256(_tokenDecimals));
		uint256 amountBT = SafeMath.div(SafeMath.mul(_transferAmount, adjConversionRate), _pricePoint);
		uint256 commissionAmountBT = SafeMath.div(SafeMath.mul(_commissionAmount, adjConversionRate), _pricePoint);
		return (amountBT, commissionAmountBT);
	}
}
