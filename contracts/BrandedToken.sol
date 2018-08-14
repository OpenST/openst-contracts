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
// Utility chain: BrandedToken
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------


import "./SafeMath.sol";
import "./openst-protocol/EIP20Token.sol";
import "./openst-protocol/UtilityTokenAbstract.sol";
import "./Internal.sol";


/**
 *  @title BrandedToken contract which implements EIP20Token, UtilityTokenAbstract. 
 *
 *  @notice Branded Token is an EIP20 token minted by staking Simple Token
 *          on Ethereum mainnet.  
 *
 *  @dev Branded tokens are designed to be used within a (decentralised) application and support:
 *       - Smart contract controlled password reset for users who don't
 *         yet (hard-spoon FTW) manage their own private keys (+v0.9.2).
 *       - Soft-exit for a user to redeem their equivalent part of the 
 *         Simple Token stake on Ethereum mainnet.
 *       - Hard-exit for all users if the utility chain halts to reclaim
 *         their equivalent part of the Simple Token stake
 *         on Ethereum (before v1.0).
 *
 */
contract BrandedToken is EIP20Token, UtilityTokenAbstract, Internal {

    /* Usings */

    using SafeMath for uint256;


    /* Storage */

    /** Token rules contract address  */
    address public tokenRules;

    /**
     *  @notice Contract constructor. 
     *
     *  @dev Creates an EIP20Token and a UtilityTokenAbstract contract with
     *       arguments passed in the contract constructor.
     *  
     *  @param _uuid UUID of the token.
     *  @param _symbol Symbol of the token. 
     *  @param _name Name of the token.
     *  @param _decimals Decimal places of the token.
     *  @param _chainIdValue Chain id of the value chain.
     *  @param _chainIdUtility Chain id of the utility chain.
     *  @param _conversionRate Conversion rate of the token.
     *  @param _conversionRateDecimals Decimal places of conversion rate of token.
     *  @param _tokenRules tokenRules contract address.
     */
    constructor(
        bytes32 _uuid,
        string _symbol,
        string _name,
        uint8 _decimals,
        uint256 _chainIdValue,
        uint256 _chainIdUtility,
        uint256 _conversionRate,
        uint8 _conversionRateDecimals,
        address _tokenRules)
        public
        Internal()
        EIP20Token(_symbol, _name, _decimals)
        UtilityTokenAbstract(
        _uuid,
        _symbol,
        _name,
        _chainIdValue,
        _chainIdUtility,
        _conversionRate,
        _conversionRateDecimals)
     {
        require(_tokenRules != address(0), "Token rules contracts address is invalid!");

        tokenRules = _tokenRules;
     }


    /* Public functions */

    /**
	 *  @notice public function transfer.
	 *
	 *  @param _to address to which BT needs to transfer.
	 *  @param _value how many BTs needs to transfer.
	 *
	 *  @return bool true/false status of transfer.
	 */
    function transfer(
        address _to,
        uint256 _value)
        public
        returns (bool /* success */)
    {
        require(isInternalActor[_to] == true, "to address is invalid economy actor!");

        EIP20Token.transfer(_to, _value);
    }

    /**
	 *  @notice public function transferFrom.
	 *
	 *  @param _from address from which BT needs to transfer.
	 *  @param _to address to which BT needs to transfer.
	 *  @param _value how many BTs needs to transfer.
	 *
	 *  @return bool true/false status of transferFrom.
	 */
    function transferFrom(
        address _from,
        address _to,
        uint256 _value)
        public
        returns (bool /* success */)
    {
        require(isInternalActor[_to] == true, "to is invalid economy actor!");

        EIP20Token.transferFrom(_from, _to, _value);
    }

    /**
	 *  @notice public function approve.
	 *
	 *  @param _spender address to which msg.sender is approving.
	 *  @param _value how many BTs needs to approve.
	 *
	 *  @return bool true/false status of approve.
	 */
    function approve(
        address _spender,
        uint256 _value)
        public
        returns (bool /* success */)
    {
        require(isInternalActor[_spender] == true, "spender is invalid economy actor!");

        EIP20Token.approve(_spender, _value);
    }

    /**
     *  @notice Public function mintEIP20.
     *
     *  @dev Only callable by openSTProtocol contract. Adds _amount of utility
     *       tokens to be claimed for a _beneficiary address.
     *
     *  @param _beneficiary Address of beneficiary.
     *  @param _amount Amount of utility tokens to mint.
     *
     *  @return True if mint is successful, false otherwise.
     */
    function mint(
        address _beneficiary,
        uint256 _amount)
        public
        onlyProtocol
        returns (bool /* success */)
    {
        require((isInternalActor[_beneficiary] == true), "beneficiary is invalid economy actor!");

        mintEIP20(_amount);

        return mintInternal(_beneficiary, _amount);
    }

    /**
     *  @notice Public function burn.
     *
     *  @dev Only callable by openSTProtocol contract. Implements a burn function
     *       to permit msg.sender to reduce its balance, which also reduces tokenTotalSupply.
     *
     *  @param _burner Address of token burner. 
     *  @param _amount Amount of tokens to burn.
     *
     *  @return True if burn is successful, false otherwise.
     */
    function burn(
        address _burner,
        uint256 _amount)
        public
        onlyProtocol
        payable
        returns (bool /* success */)
    {
        // force non-payable, as only ST" handles in base tokens
        require(msg.value == 0, "msg.value should be 0");

        burnEIP20(_amount);

        return burnInternal(_burner, _amount);
    }
}