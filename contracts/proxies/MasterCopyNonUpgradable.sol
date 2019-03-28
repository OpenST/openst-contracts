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

contract MasterCopyNonUpgradable {

    /* Storage */

    /**
     * @dev This storage variable *MUST* be the first storage element
     *      for this contract.
     *
     *      A contract acting as a master copy for a proxy contract
     *      inherits from this contract. In inherited contracts list, this
     *      contract *MUST* be the first one. This would assure that
     *      the storage variable is always the first storage element for
     *      the inherited contract.
     *
     *      The proxy is applied to save gas during deployment, and importantly
     *      the proxy is not upgradable.
     */
    address reservedStorageSlotForProxy;
}