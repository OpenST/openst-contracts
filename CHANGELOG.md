## OpenST-Payments v1.0.10
Handled boolean status for transaction receipt in web3 version 1.0.0-beta.34

## OpenST-Payments v1.0.8 
#####OpenST-storage and dynamoDB integration for token balances ([openst-payments#124](https://github.com/OpenSTFoundation/openst-payments/issues/124))
DynamoDB integration for token balance - Now the balances (settled and unsettled debits) are being stored in DynamoDB.
Openst-Storage takes care of implementing the model class for DynamoDB tables and is integrated in OpenST-Payments in this release.
Cache for token balances is now responsibility of the OpenST-Storage module and is removed from OpenST-Payments module.

## OpenST-Payments v1.0.7 (23 May 2018)

Changelog:

- Airdrop contract gas limit is increased because of contract changes.
- Reason is added in logs when transaction fails.

## OpenST-Payments v1.0.6 (17 May 2018)

Changelog:

- Fix for double credit issue is done. On few cases of payment transactions beneficiary was credited two times.
- Solidity/solc is upgraded to 0.4.23. All contracts compile warnings are handled and contracts are upgraded with latest syntax. 
- Truffle package is upgraded to 4.1.8.
- Fixes for travis broken tests is added.
- New response helper integration. Standardized error codes are now being used in OST Price Oracle.
- OpenST base web3 integration. Web socket connection to geth is now being used and preferred over RPC connection.
- OpenST base integration with logger is done.
- New services for payment success and failure were added. This was part of payment transactions optimization fixes.
- Loggers updated from into to debug wherever necessary. Log level support was introduced and non-important logs were moved to debug log level.
- Gas limit optimization on transactions is done. Predefined calculated gas limit with buffer is defined for each type of transactions.
- Support for web socket is added.
- Geth version updated to 1.0.0-beta.33.

## OpenST-Payments v1.0.5.beta.1

Changelog:
- Added new services and services refactoring
- Readme update as per updated services
- Comments updated for services 

## OpenST-Payments v1.0.4.beta.2

Changelog:
- Upgrade Geth and Web3 version
- while transferring from reserve to airdrop budget holder validate if reserve has sufficient balance. 

## OpenST-Payments v1.0.4

Changelog:
- Changed error message when insufficient balance
- Changed error message when insufficient gas  

## OpenST-Payments v1.0.3

Changelog:
- Added error code for insufficient gas fund
- Added error code for transaction receipt with status 0  
 
## OpenST-Payments v1.0.2

Changelog:
- Airdrop table caching and integration

## OpenST-Payments v1.0.1

Changelog:
- Fixed - Exception coming when converting Number to BigNumber  with high precision

## OpenST-Payments v1.0.0 (14 March 2018)

OpenST-Payments 1.0.0 is the first release of OpenST-Payments. It provides `Airdrop` and `Pricer` contracts for token transfers, defines a `PriceOracle` interface, and introduces the concept of `Workers`.
