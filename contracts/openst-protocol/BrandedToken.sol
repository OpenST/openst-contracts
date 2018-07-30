/* solhint-disable-next-line compiler-fixed */
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

import "../contracts/SafeMath.sol";

/** utility chain contracts */
import "../contracts/EIP20Token.sol";
import "./UtilityTokenAbstract.sol";
import "../contracts/Owned.sol";


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
 */
contract BrandedToken is EIP20Token, UtilityTokenAbstract, Owned {
    using SafeMath for uint256;

    /** Events */

    event EconomyActorRegistered(address economyActor);

    /** Storage */

    /** token rules contract address  */
    address public tokenRules;

    mapping (address /* hash */ => bool) public economyActors;

    /**
     *  @notice Contract constructor. 
     *
     *  @dev Creates an EIP20Token and a UtilityTokenAbstract contract with arguments 
     *       passed in the contract constructor
     *  
     *  @param _uuid UUID of the token.
     *  @param _symbol Symbol of the token. 
     *  @param _name Name of the token.
     *  @param _decimals Decimal places of the token.
     *  @param _chainIdValue Chain id of the value chain.
     *  @param _chainIdUtility Chain id of the utility chain.
     *  @param _conversionRate Conversion rate of the token.
     *  @param _conversionRateDecimals Decimal places of conversion rate of token.
     */
    constructor(
        bytes32 _uuid,
        string _symbol,
        string _name,
        uint8 _decimals,
        uint256 _chainIdValue,
        uint256 _chainIdUtility,
        uint256 _conversionRate,
        uint8 _conversionRateDecimals)
        public
        Owned()
        EIP20Token(_symbol, _name, _decimals)
        UtilityTokenAbstract(
        _uuid,
        _symbol,
        _name,
        _chainIdValue,
        _chainIdUtility,
        _conversionRate,
        _conversionRateDecimals)
        { }

    /** Public functions */

    function transfer(
        address _to,
        uint256 _value)
        public
        returns (bool success)
    {
        require(isEconomyActor(msg.sender) == true, "msg.sender is invalid economy actor");
        EIP20Token.transfer(_to, _value);
    }

    function transferFrom(
        address _from,
        address _to,
        uint256 _value)
        public
        returns (bool success)
    {
        require(isEconomyActor(msg.sender) == true, "msg.sender is invalid economy actor");
        EIP20Token.transferFrom(_from, _to, _value);
    }

    function approve(
        address _spender,
        uint256 _value)
        public
        returns (bool success)
    {
        require(isEconomyActor(msg.sender) == true, "msg.sender is invalid economy actor");
        EIP20Token.approve(_spender, _value);
    }

    /**
     *  @notice Public function claim.
     *
     *  @dev Calls on claimInteral which returns amount of utility
     *       tokens to transfer for _beneficiary address.
     *
     *  @param _beneficiary Address of the utility tokens beneficiary.
     *
     *  @return True if claim of utility tokens for beneficiary address is successful, 
     *          false otherwise.
     */
    function claim(
        address _beneficiary)
        public
        returns (bool /* success */)
    {
        require(isEconomyActor(msg.sender) == true, "msg.sender is invalid economy actor");

        uint256 amount = claimInternal(_beneficiary);

        return claimEIP20(_beneficiary, amount);
    }

    /**
     *  @notice Public function mintEIP20.
     *
     *  @dev Only callable by openSTProtocol contract. Adds _amount of utility tokens to 
     *       be claimed for a _beneficiary address.
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
        require(isEconomyActor(msg.sender) == true, "msg.sender is invalid economy actor");

        mintEIP20(_amount);

        return mintInternal(_beneficiary, _amount);
    }

    /**
     *  @notice Public function burn.
     *
     *  @dev Only callable by openSTProtocol contract. Implements a burn function to permit 
     *       msg.sender to reduce its balance, which also reduces tokenTotalSupply.
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
        require(isEconomyActor(msg.sender) == true, "msg.sender is invalid economy actor");

        // force non-payable, as only ST' handles in base tokens
        require(msg.value == 0, "msg.value should be 0");

        burnEIP20(_amount);

        return burnInternal(_burner, _amount);
    }

    /**
    *  @notice public function isEconomyActor
    *
    *  @param _actor Address of an economy actor which is being validated for
    *
    *  @return bool
    */
    function isEconomyActor(
        address _actor)
        public
        returns (bool /* success */)
    {
        return (economyActors[_actor] != address(0));
    }

    /**
	 *  @notice public function registerEconomyActor
	 *
	 *  @param _economyActor Address of the economy actor which needs to be registered
	 *
	 *  @return bool
	 */
    function registerEconomyActor(
        address _economyActor)
        public
        onlyOwner()
        returns (bool /* success */)
    {
        require(_economyActor != address(0), "economy actor address is 0");

        require(economyActors[_economyActor] == address(0), 'Economy actor already present');

        economyActors[_economyActor] = true;

        emit EconomyActorRegistered(_economyActor);

        return true;
    }
}