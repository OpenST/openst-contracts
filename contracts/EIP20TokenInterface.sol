pragma solidity ^0.4.23;

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
// Based on the 'final' EIP20 token standard as specified at:
// https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20.md

/**
 *  @title EIP20 token interface with optional and required interface functions.
 */
interface EIP20TokenInterface {

    /* Events */

    event Transfer(
        address indexed _from,
        address indexed _to,
        uint256 _value
    );

    event Approval(
        address indexed _owner,
        address indexed _spender,
        uint256 _value
    );


    /* External Functions */

    function name() external view returns (string);

    function symbol() external view returns (string);

    function decimals() external view returns (uint8);

    function totalSupply() external view returns (uint256);

    function balanceOf(address _owner) external view returns (uint256 balance_);

    function allowance(address _owner, address _spender)
        external
        view
        returns (uint256 remaining_);

    function transfer(address _to, uint256 _value)
        external
        returns (bool success_);

    function transferFrom(address _from, address _to, uint256 _value)
        external
        returns (bool success_);

    function approve(address _spender, uint256 _value)
        external
        returns (bool success_);
}
