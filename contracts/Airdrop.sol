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
// Utility chain: Airdrop
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

import "./Workers.sol";
import "./Pricer.sol";


contract Airdrop is Pricer {

    /*
     *  Events
    */
    /// Emit AirdropPayment Event
    event AirdropPayment(
        address indexed _beneficiary,
        uint256 _transferAmount,
        address indexed _commissionBeneficiary,
        uint256 _commissionAmount,
        bytes3 _currency,
        uint256 _actualPricePoint,
        address indexed _spender,
        uint256 _airdropAmount
        );

    /*
     *  Storage
     */
    Workers public workers;
    address public airdropBudgetHolder;

    /*
      *  Constructor
     */
    /// @dev    Takes _brandedToken, _baseCurrency, _workers, _airdropBudgetHolder;
    ///         constructor;
    ///         public method;
    /// @param _brandedToken Branded Token
    /// @param _baseCurrency Base Currency
    /// @param _workers  Workers contract address
    /// @param _airdropBudgetHolder Airdrop Budget Holder Address
    function Airdrop(
        address _brandedToken,
        bytes3 _baseCurrency,
        Workers _workers,
        address _airdropBudgetHolder)
        public
        Pricer(_brandedToken, _baseCurrency)
        OpsManaged()
    {
        require(_workers != address(0));
        require(airdropBudgetHolder != address(0));

        workers = _workers;
        airdropBudgetHolder = _airdropBudgetHolder;
    }

    /*
     *  External functions
     */
    /// payAirdrop matches the behaviour of Pricer:pay with extra functionality of airdrop evaluation
    /// @param _beneficiary beneficiary
    /// @param _transferAmount transferAmount
    /// @param _commissionBeneficiary commissionBeneficiary
    /// @param _commissionAmount commissionAmount
    /// @param _currency currency
    /// @param _intendedPricePoint intendedPricePoint
    /// @param _spender spender
    /// @param _airdropAmount airdropAmount
    /// @return uint256 totalPaid
    function payAirdrop(
        address _beneficiary,
        uint256 _transferAmount,
        address _commissionBeneficiary,
        uint256 _commissionAmount,
        bytes3 _currency,
        uint256 _intendedPricePoint,
        address _spender,
        uint256 _airdropAmount)
        public
        returns (
            uint256 /* totalPaid */)
    {
        require(workers.isWorker(msg.sender));
        require(_spender != address(0));

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

        require(performAirdropTransferToSpender(_spender, _airdropAmount,
            tokenAmount, commissionTokenAmount));
        require(performTransfers(_spender, _beneficiary, tokenAmount,
            _commissionBeneficiary, commissionTokenAmount));

        /// Emit AirdropPayment Event
        AirdropPayment(_beneficiary, _transferAmount, _commissionBeneficiary,
            _commissionAmount, _currency, pricePoint, _spender, _airdropAmount);

        return ((tokenAmount + commissionTokenAmount));
    }

    /*
     *  Private functions
     */
    /// @dev    Takes _spender, _airdropAmount, _tokenAmount, _commissionTokenAmount;
    ///         Calculate airdropUsed to transfer
    ///         Perform perform Airdrop Transfer To Spender
    ///         internal method;
    /// @param _spender spenderUser
    /// @param _airdropAmount airdropAmount
    /// @param _tokenAmount tokenAmount
    /// @param _commissionTokenAmount commissionTokenAmount
    /// @return uint256 airdropUsed
    function performAirdropTransferToSpender(
        address _spender,
        uint256 _airdropAmount,
        uint256 _tokenAmount,
        uint256 _commissionTokenAmount)
        private
        returns (
            bool /* boolean value */)
    {
        uint256 totalPaid = (_tokenAmount + _commissionTokenAmount);
        // Find out minimum of totalPaid and _airdropAmount
        uint256 airdropUsed = _airdropAmount;
        if (totalPaid < airdropUsed) {
            airdropUsed = totalPaid;
        }

        // Prefund the user from the airdrop budget holder
        if (airdropUsed > 0) {
            require(EIP20Interface(brandedToken()).transferFrom(airdropBudgetHolder, _spender, airdropUsed));
        }

        return true;
    }

}