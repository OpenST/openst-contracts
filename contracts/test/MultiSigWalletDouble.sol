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
// ----------------------------------------------------------------------------
// Utility Chain: MultiSigWallet
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

import "../MultiSigWallet.sol";


contract MultiSigWalletDouble is MultiSigWallet {

    /* Usings */

    using SafeMath for uint256;


    /* Constants */

    bytes4 constant public FOO_CALLPREFIX = bytes4(
        keccak256("foo()")
    );


    /* Storage */

    bool fooThrows;


    /* Special Functions */

    constructor(address[] _wallets, uint256 _required)
        MultiSigWallet(_wallets, _required)
        public
    {
        fooThrows = true;
    }


    /* External Functions */

    /**
     * @dev Submits a function that fails on a first attempt and succeeds
     *      the second.
     *
     * @return Newly created transaction id.
     */
    function submitFoo()
        external
        onlyWallet
        returns (uint256 transactionID_)
    {
        transactionID_ = addTransaction(
            address(this),
            abi.encodeWithSelector(FOO_CALLPREFIX)
        );

        confirmTransaction(transactionID_);
    }


    /* Public Functions */

    function makeFooThrow()
        public
    {
        fooThrows = true;
    }

    function makeFooNotThrow()
        public
    {
        fooThrows = false;
    }

    function foo()
        public
        view
        onlyMultisig
    {
        if ( fooThrows ) {
            revert("Foo is set to throw.");
        }
    }

}