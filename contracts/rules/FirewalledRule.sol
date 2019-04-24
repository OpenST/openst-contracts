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

import "../organization/OrganizationInterface.sol";
import "../organization/Organized.sol";

/**
 * @title Extend this rule in order to restrict relayers of a meta-transaction.
 *
 * @notice If you want to restrict the relayers that can relay meta-transactions
 *         to your rule, you can extend this contract with your rule. Your rule
 *         has to include the modifier `firewalled` for all functions that
 *         should be restricted.
 *         The firewall can be disabled, but not enabled again. When it is
 *         disabled, the modifier basically does nothing anymore.
 */
contract FirewalledRule is Organized {

    /* Events */

    /**
     * Emitted when the firewall gets disabled.
     * It is the only event, because a firewall cannot get re-enabled.
     */
    event FirewallDisabled();


    /* Storage */

    /**
     * Records whether the firewall is checked in the relevant modifier.
     * Is set to `false` when the firewall gets disabled.
     */
    bool public firewallEnabled;


    /* Modifiers */

    /**
     * Requires that `tx.origin` is an organization worker, if the firewall is
     * enabled. Once the firewall has been disabled, this modifier will not
     * enforce any checks anymore.
     * The modifier checks `tx.origin` and not `msg.sender`, because
     * `msg.sender` can be another contract. However, what the firewall is
     * supposed to check is who relayed the meta-transaction. The relayer is
     * always `tx.origin`.
     */
    modifier firewalled() {
        if (firewallEnabled) {
            require(
                // We deliberately chose `tx.origin` and not `msg.sender`.
                // See modifier documentation for more details.
                // solium-disable-next-line security/no-tx-origin
                organization.isWorker(tx.origin),
                "This method is firewalled. Transaction must originate from an organization worker."
            );
        }

        _;
    }


    /* Special Functions */

    /**
     * @param _organization The address of an organization contract.
     */
    constructor(
        OrganizationInterface _organization
    )
        Organized(_organization)
        public
    {
        // The firewall must be enabled by default, as there is no function to
        // enable a disabled firewall.
        firewallEnabled = true;
    }


    /* External Functions */

    /**
     * @notice Disables the firewall so that anyone can use firewalled methods.
     *         Disabling the firewall cannot be done undone. There is no method
     *         to enable the firewall again.
     *         Emits a `FirewallDisabled` event.
     */
    function disableFirewall() external onlyOrganization {
        firewallEnabled = false;
        emit FirewallDisabled();
    }
}
