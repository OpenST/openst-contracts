pragma solidity ^0.4.23;

// Copyright 2017 OpenST Ltd.
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
// Utility Chain: Token Holder
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

/**
 *  @title TokenHolder contract.
 *
 *  @notice Implements properties and actions performed by an user. It enables
 *          scalable key management solutions for mainstream apps.
 *
 */
contract TokenHolder {

    /** Storage */

    address public brandedToken;
    /** Co Gateway contract address */
    address public coGateway;
    /** how many max tokens can be spent in a single transfer */
    uint256 private spendingLimit;

    mapping (bytes32 => uint256 /* spending limit */ ) public sessionLocks;

    /**
	 *  @notice Contract constructor
	 *
	 *  @param _brandedToken erc20 contract address this user is part of
	 *  @param _coGateway utility chain gateway contract address
	 *  @param _spendingLimit max tokens user can spend at a time
	 *  @param _wallets wallet addresses minimum 2 is needed
	 */
    constructor(
        address _brandedToken,
        address _coGateway,
        uint256 _spendingLimit,
        address[] _wallets)
        public
    {
        require(_brandedToken != address(0), "branded token contract address is 0");
        require(_coGateway != address(0), "Co gateway contract address is 0");
        require(_wallets.length >= 2, "Minimum two wallets are needed");

        spendingLimit = _spendingLimit;
        brandedToken = _brandedToken;
        coGateway = _coGateway;
    }

    validateSession(){

}

}