/* solhint-disable-next-line compiler-fixed */
pragma solidity ^0.5.0;

// Copyright 2019 OpenST Ltd.
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

import "../../tokens/EIP20TokenInterface.sol";
import "../../external/SafeMath.sol";


contract EIP20TokenFake is EIP20TokenInterface {

    /* Usings */

    using SafeMath for uint256;


    /* Storage */

    uint256 tokenTotalSupply;

    string private tokenName;

    string private tokenSymbol;

    uint8  private tokenDecimals;

    mapping(address => uint256) balances;
    mapping(address => mapping (address => uint256)) allowed;


    /* Special Functions */

    /**
     * @notice Constructs an EIP20 token based on input parameters.
     *
     * @param _symbol Symbol of the token.
     * @param _name Name of the token.
     * @param _decimals Decimal places of the token.
     */
    constructor(string memory _symbol, string memory _name, uint8 _decimals)
        public
    {
        tokenTotalSupply = 0;

        tokenSymbol = _symbol;
        tokenName = _name;
        tokenDecimals = _decimals;
    }


    /* External Functions */

    /**
     * @dev Implements EIP20TokenInterface::name() function.
     *
     * @return Name of the EIP20 token.
     */
    function name() external view returns (string memory) {
        return tokenName;
    }

    /**
     * @dev Implements EIP20TokenInterface::symbol() function.
     *
     * @return Symbol of the EIP20 token.
     */
    function symbol() external view returns (string memory) {
        return tokenSymbol;
    }

    /**
     * @dev Implements EIP20TokenInterface::decimals() function.
     *
     * @return Decimal places of the EIP20 token.
     */
    function decimals() external view returns (uint8) {
        return tokenDecimals;
    }

    /**
     * @dev Implements EIP20TokenInterface::totalSupply() function.
     *      Function is only overriden and not implemented as it's not used
     *      during testing.
     */
    function totalSupply() external view returns (uint256) {
        return tokenTotalSupply;
    }

    /**
     * @notice Returns balance of the owner account.
     *
     * @param _owner Address of the owner account.
     *
     * @return Account balance of the owner account.
     */
    function balanceOf(address _owner) external view returns (uint256) {
        return balances[_owner];
    }

    /**
     * @notice Returns allowance of a spender for the owner account.
     *
     * @param _owner Address of the owner account.
     * @param _spender Address of the spender account.
     *
     * @return remaining_ Remaining allowance for the spender to spend from
     *                    the owner's account.
     */
    function allowance(address _owner, address _spender)
        external
        view
        returns (uint256 remaining_)
    {
        remaining_ = allowed[_owner][_spender];
    }

    /**
     * @notice Transfers an amount from msg.sender account.
     *
     * @dev Fires the "Transfer" event, throws if, _from account does not
     *      have enough tokens to spend.
     *
     * @param _to Address to which tokens are transferred.
     * @param _value Amount of tokens to be transferred.
     *
     * @return True for a successful transfer, false otherwise.
     */
    function transfer(address _to, uint256 _value)
        external
        returns (bool success)
    {
        // According to the EIP20 spec, "transfers of 0 values MUST be treated
        // as normal transfers and fire the Transfer event".
        // Also, should throw if not enough balance.
        // This is taken care of by SafeMath.

        balances[msg.sender] = balances[msg.sender].sub(_value);
        balances[_to] = balances[_to].add(_value);

        emit Transfer(msg.sender, _to, _value);

        return true;
    }

    /**
     * @notice Transfer the specified amount between accounts.
     *
     * @dev Allows a contract to transfer tokens on behalf of _from address
     *      to _to address, the function caller has to be pre-authorized for
     *      multiple transfers up to the total of _value amount by the
     *      _from address.
     *
     * @param _from Address from which tokens are transferred.
     * @param _to Address to which tokens are transferred.
     * @param _value Amount of tokens transferred.
     *
     * @return True for a successful transfer, false otherwise.
     */
    function transferFrom(address _from, address _to, uint256 _value)
        external
        returns (bool success)
    {
        balances[_from] = balances[_from].sub(_value);
        allowed[_from][msg.sender] = allowed[_from][msg.sender].sub(_value);
        balances[_to] = balances[_to].add(_value);

        emit Transfer(_from, _to, _value);

        return true;
    }

    /**
     * @notice Allows spender to withdraw from function caller's account.
     *
     * @dev Allows _spender address to withdraw from function caller's account,
     *      multiple times up to the _value amount, if this function is called
     *      again it overwrites the current allowance with _value.
     *      Emits "Approval" event.
     *
     * @param _spender Address authorized to spend from the function
     *                 caller's address.
     * @param _value Amount up to which spender is authorized to spend.
     *
     * @return True for a successful approval, false otherwise.
     */
    function approve(address _spender, uint256 _value)
        external
        returns (bool success)
    {
        allowed[msg.sender][_spender] = _value;

        emit Approval(msg.sender, _spender, _value);

        return true;
    }

    /**
     * @notice Increase balance of the account with the specified value.
     *
     * @dev The function is not part of EIP20TokenInterface and is here
     *      to fill the balance of accounts during testing.
     *
     * @param _owner Account's address.
     * @param _value Amount to increase for the account.
     */
    function increaseBalance(address _owner, uint256 _value)
        external
    {
        require(
            _owner != address(0),
            "The account to set balance is null."
        );

        balances[_owner] = balances[_owner].add(_value);

        tokenTotalSupply = tokenTotalSupply.add(_value);
    }

}
