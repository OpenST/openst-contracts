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
// Utility Chain: PriceOracleInterface
//
// http://www.simpletoken.org/
//
// --------------------------
// This contract keeps in storage an updated baseCurrency/quoteCurrency price,
// which is updated in a particular duration.
// There is an expiry duration for a currency pair
//
contract PriceOracleInterface{

	/*
	*  Events
	*/

	/// @dev event emitted whenever price is updated
	/// @return _price
	/// @return _expirationHeight
	event PriceOracleUpdated(uint256 _price,
		uint256 _expirationHeight);

	/// @dev event emitted when price expires
	/// @return _expirationHeight
	event PriceExpired(uint256 _expirationHeight);

	/*
	* Functions
	*/

	/// @dev Price is stored as fixed point integer value similar as wei unit.
	/// Use this variable in case decimal value need to be evaluated
	/// @return TOKEN_DECIMALS
	function TOKEN_DECIMALS()
		public
		constant
		returns(
			uint8);

	/// @dev block height at which the price expires
	/// @return expirationHeight
	function expirationHeight()
		public
		view
		returns(
			uint256);

	/// @dev get baseCurrency bytes3 code
	/// @return base currency
	function baseCurrency()
		public
		view
		returns(
			bytes3);

	/// @dev returns quoteCurrency bytes3 code
	/// @return quote currency
	function quoteCurrency()
		public
		view
		returns(
			bytes3);

	/// @dev use this function to update oracle price
	/// @param _price price
	/// @return expirationHeight
	function setPrice(
		uint256 _price)
		external
		returns(
			uint256);

	/// @dev use this function to get price
	/// @return baseCurrency/quoteCurrency value
	function getPrice()
		public
		returns(
			uint256);

}