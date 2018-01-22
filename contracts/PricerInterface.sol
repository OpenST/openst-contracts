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

	event Payment(address _beneficiary, 
		uint256 _transferAmount, 
		address _commissionBeneficiary, 
		uint256 _commissionAmount, 
		bytes3 _currency, 
		uint256 _intendedPricePoint, 
		uint256 _actualPricePoint);

	event PriceOracleSet(
		bytes3 _currency, 
		address _address);
	
	event PriceOracleUnset(		
		bytes3 _currency);

	event AcceptedMargin(
		bytes3 _currency, 
		uint64 relativeIntendedPriceRange);

	/// @dev    Returns address of the branded token;
	///         Public;
	/// @return address    
	function brandedToken() 
		public 
		returns (address);    

	/// @dev    Takes _currency; 
	///         Returns Acceptable margin for the given currency;
	///         Public;
	/// @param _currency currency
	/// @return uint64 margin
	function acceptedMargins(
		bytes3 _currency) 
		public 
		returns (uint64);

	/// @dev    Takes _currency; 
	///         Returns address of Price Oracle for the given currency;
	///         Public
	/// @param _currency currency
	/// @return address
	function priceOracles(
		bytes3 _currency) 
		public 
		returns (address);

	/// @dev    Takes _currency, _oracleAddress; 
	///         Updated the Price Oracle address for a given currency;
	///         Emits PriceOracleSet Event;
	///         Only called by ops
	/// @param _currency currency
	/// @param _oracleAddress oracleAddress
	/// @return bool isSuccess
	function setPriceOracle(
		bytes3 _currency, 
		address _oracleAddress) 
		public 
		returns (bool);

	/// @dev	Takes _currency; 
	///				Removes the Price Oracle address for a given currency
	///				Emits PriceOracleUnSet Event;
	///				Only called by ops
	/// @param _currency currency	
	/// @return bool isSuccess
	function unsetPriceOracle(
		bytes3 _currency)		
		public
		returns (bool);
	

	/// @dev    Takes _currency, _acceptedMargin; 
	///         Updated the acceptable margin range for a given currency;
	///         Emits AcceptedMargin Event;
	///         Only called by ops
	/// @param _currency currency
	/// @param _acceptedMargin acceptedMargin
	/// @return bool isSuccess
	function setAcceptedMargin(
		bytes3 _currency, 
		uint64 _acceptedMargin) 
		public 
		returns (bool);     

	/// @dev    Takes _beneficiary, _transferAmount, _commissionBeneficiary, _commissionAmount, _currency, _intendedPricePoint; 
	///         Validates if the currentPrice from PriceOracle is in accepatble margin of _intendedPricePoint (If _ currency is not 0);
	///         If _currency is 0 then it transfer the Branded tokens equal to _transferAmount to _beneficiary and  Branded tokens equal to _commissionAmount to _commissionBeneficiary (Floating value transaction);
	///         If _currency is not 0 then it transfer the Branded tokens equivalant to _transferAmount in currecncy value to _beneficiary and  Branded tokens equivalant to _commissionAmount in currency value to _commissionBeneficiary (Fixed value transaction);  
	///         Emits Payment Event;
	///         Public method
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
	///             gets current price point and token decimal for the priceOracle for the give currency; 
	///             Public method
	/// @param _currency currency
	/// @return (currentPrice, TokenDecimals)
	function getPricePoint(
		bytes3 _currency) 
		public 
		returns (uint256, uint8);
    
    
}