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
// Utility chain: Airdrop
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------


// look to replace with interface
import "./Workers.sol";


contract Airdrop is Pricer {
	// SafeMath for uint256 is declared in Pricer.sol

	/*
	 *  Storage
	 */
	Workers public workers;
	address public airdropBudget;

	 /*
	  *  Public functions
	  */
	function Airdrop(
		address _brandedToken,
		Workers _workers,
		address _airdropBudget)
		public
		Pricer(_brandedToken)
		OpsManaged()
	{
		require(_workers != address(0));
		require(_airdropBudget != address(0));

		workers = _workers;
		airdropBudget = _airdropBudget;
	}

	/// airPay matches the behaviour of pricer:pay
	/// but allows spending from 
	function airPay(
		/// input parameters for pricer:pay
        address _beneficiary,
        uint256 _transferAmount,        
        address _commissionBeneficiary,
        uint256 _commissionAmount,      
        bytes3 _currency,
        uint256 _intendedPricePoint,
        /// additional input parameters for airdrop
        address _user,
        uint256 _airdropAmount)
        public
        returns (uint256 totalPaid, uint256 airdropUsed)
	{
		require(workers.isWorker(msg.sender));

		/*
		 *  lift from pricer:pay
		 *  further clean up 
		 */
		require(_beneficiary != address(0));
		require(_transferAmount != 0);

		if (_commissionAmount > 0) {
			require(_commissionBeneficiary != address(0));
		}

		uint256 tokenAmount = _transferAmount;
		uint256 commissionTokenAmount = _commissionAmount;
		uint256 pricePoint = _intendedPricePoint;
		if (_currency != 0) {
            uint8 tokenDecimals = 0;
            (pricePoint, tokenDecimals) = getPricePoint(_currency);
            require(pricePoint > 0);            
            require(isPricePointInRange(_intendedPricePoint, pricePoint, pricerAcceptedMargins[_currency]));            
            (tokenAmount, commissionTokenAmount) = getBTAmountFromCurrencyValue(pricePoint, 
                tokenDecimals, _transferAmount, _commissionAmount);
        }
		/*
		 *  end of pricer:pay
		 */

        totalPaid = tokenAmount + commissionTokenAmount;
        airdropUsed = _airdropAmount;
        if (totalPaid < _airdropAmount) {
        	airdropUsed = _airdropAmount - totalPaid;
        }
        // prefund the user from the airdrop budget
        require (EIP20Interface(pricerBrandedToken).transferFrom(airdropBudget, _user, airdropUsed))

		/*
		 *  lift from pricer:pay
		 */
		require(EIP20Interface(pricerBrandedToken).transferFrom(_user, _beneficiary, tokenAmount));
		if (_commissionBeneficiary != address(0)) {
			require(EIP20Interface(pricerBrandedToken).transferFrom(_user, 
				_commissionBeneficiary, commissionTokenAmount));
		}

		//Trigger Event for PaymentComplete
		Payment(_beneficiary, _transferAmount, _commissionBeneficiary, 
			_commissionAmount, _currency, _intendedPricePoint, pricePoint);      
		return (totalPaid, airdropUsed);
	}
}