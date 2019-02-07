# OpenST Contracts Change Log

## Version 0.10.0

### Changes

- Contracts: TokenHolder
  - In the current release, TokenHolder's ownership key management functionality
  (implemented previously in MultiSigWallet contract and inherited by TokenHolder)
  and session key management functionality (authorizeSession(), revokeSession(),
  logout(), executeRule(), executeRedemption()) are separated. Ownership key
  management functionality (MultiSigWallet.sol) is removed and replaced by
  Gnosis Safe. TokenHolder receives an owner key during construction.
  authorizeSession(), revokeSession() and logout() functions are
  guarded by onlyOwner modifier. Logout() function has been revisited and
  currently logs out all active session keys and can be called only by the owner.
- Contracts: TokenRules
  - Global constraints functionality is removed.
    - Direct transfers functionality is added allowing a TokenHolder account to
  execute transfers without going around with TransferRule. Direct transfers
  are by default enabled for a token economy and can be disabled by
  organization's workers.
    - TokenRules is Organized, that allows to refine modifiers (previously only
  onlyOrganization was available) and add onlyWorker. registerRule,
  enableDirectTransfers, disableDirectTransfers are guarded by onlyWorker
  modifier.
- Contracts: DelayedRecoveryModule
  - DelayedRecoveryModule is a Gnosis Safe module allowing to recover an owner
  key in case of loss. Gnosis Safe modules execute transactions without any
  confirmation. An owner can sign an intent to recover access in
  DelayedRecoveryModule which is relayed to the module by a controller key. The
  intent execution can be carried on by any key after a required number of
  blocks passes. An owner or controller can abort the recovery process.
- Contracts: PriceOracleInterface and PricerRule
  - PriceOracleInterface defines the required interface for price oracles used
  within PricerRule.
  - PricerRule allows to pay beneficiaries in any currency: price oracle for the
  pay currency should be registered beforehand.
- Contracts: MasterCopyNonUpgradable, Proxy, ProxyFactory and UserWalletFactory
  - A proxy contracts family is introduced to save gas (currently, in
  openst-contracts no contract is upgradeable).
    - Proxy: A generic proxy contract
    - ProxyFactory: A generic proxy factory contract
    - UserWalletFactory: A proxy contract, allowing to create a user wallet
  by composing gnosis safe and token holder in a single transaction
  (UserWalletFactory::createUserWallet)
    - MasterCopyNonUpgradable: Contracts acting as master copies should
  inherit (should always be first in inheritance list) from this contract.
- Contracts: OrganizationInterface, Organization, and Organized
  - Organization contracts are added into the project. TokenRules and PricerRule
  are "is Organized" and using inherited onlyWorker and onlyOrganization modifiers.
- Contracts: Upgraded the contracts to 0.5.0 version of solidity.
- Infrastructure: Replaced the mock naming convention for test doubles to
  correct ones: spy, fake, double.
- Infrastructure: Align the Airbnb JS style guide across OpenST protocol
  projects through the .eslintrc.
- Infrastructure:  Add .gitattributes for Solidity syntax highlighting in Github.
- Infrastructure: Contracts directory restructuring.
- Infrastructure: Remove .solcover.js as it does not support the solidity
  version 0.5.0.
- Infrastructure: Add .soliumignore to exclude unnecessary directories and
  files to be linted.
- Infrastructure: Add .soliumrc to share solidity lint rules across the project
  contributors.
- Infrastructure: Improve travis.yml to include updating of git submodules,
  using binaries from ./node_modules/.bin, lint-build-steps and use npm scripts
  instead of raw calls.
- Infrastructure: Add CODE_OF_CONDUCT.md for contribution guidelines.
- Infrastructure: Update contracts license to Apache Version 2.0.
- Infrastructure: Update README.md file for release 0.10.0.
- Infrastructure: Update VERSION file for release 0.10.0.
- Infrastructure: Improved package.json with new set of scripts: compile,
  compile-all, lint:js, lint:js:fix, lint:sol, lint:sol:fix, lint:build-package.
- Infrastructure: NPM module publishing.
