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

import "./Proxy.sol";

/**
 * @title Allows to create new proxy contact and execute a message call to the
 *        new proxy within one transaction.
 *
 * @dev This contract is adapted from a ProxyFactory contract implementation
 *      from https://github.com/gnosis/safe-contracts.
 */
contract ProxyFactory {

    /**
     * @notice The event is emitted from the ProxyFactory::createProxy
     *         function on success.
     *
     * @param _proxy A newly created proxy.
     */
    event ProxyCreated(Proxy _proxy);

    /**
     * @dev Allows to create new proxy contact and execute a message call (if
     *      a message data is non-empty) to the new proxy within one
     *      transaction.
     *
     *      Function requires:
     *          - The specified master copy address is not null.
     *
     * @param _masterCopy Address of a master copy.
     * @param _data Payload for message call sent to new proxy contract.
     *              Executes a message call to this parameter if it's not empty.
     *
     * @return proxy_ A newly created proxy.
     */
    function createProxy(address _masterCopy, bytes memory _data)
        public
        returns (Proxy proxy_)
    {
        require(
            _masterCopy != address(0),
            "Master copy address is null."
        );

        proxy_ = new Proxy(_masterCopy);
        if (_data.length > 0)
            // solium-disable-next-line security/no-inline-assembly
            assembly {
                if eq(call(gas, proxy_, 0, add(_data, 0x20), mload(_data), 0, 0), 0) {
                    revert(0, 0)
                }
            }

        emit ProxyCreated(proxy_);
    }
}
