# OpenST Payments - Advance Payment infrastructure on top of the [OpenST network](https://simpletoken.org)

[![Gitter: JOIN CHAT](https://img.shields.io/badge/gitter-JOIN%20CHAT-brightgreen.svg)](https://gitter.im/OpenSTFoundation/SimpleToken)

While OpenST 0.9 is available as-is for anyone to use, we caution that this is early stage software and under heavy ongoing development and improvement. Please report bugs and suggested improvements.

# Install OpenST Payments

```bash
npm install @openstfoundation/openst-payments --save
```

# Run Chain

```bash
cd mocha_test/scripts/
sh start_test_chain.sh
```

# Set EVN Variables

### Setup Initial Setup Variables:

```bash
export OST_UTILITY_GETH_RPC_PROVIDER='http://127.0.0.1:9546'
export OST_UTILITY_DEPLOYER_ADDR=''
export OST_UTILITY_DEPLOYER_PASSPHRASE='testtest'
export OST_UTILITY_OPS_ADDR=''
export OST_UTILITY_OPS_PASSPHRASE='testtest'
```

### Run Deployment Script for Branded Token:

```bash
node tools/deploy/EIP20TokenMock.js conversionRate symbol name decimals gasPrice
```

### Run Deployment Script for Workers:

```bash
node tools/deploy/workers.js gasPrice
```

### Run Deployment Script for Airdrop:

```bash
node tools/deploy/airdrop.js brandedTokenContractAddress baseCurrency workerContractAddress airdropBudgetHolder gasPrice
```

### Set Caching Engine:

```bash
export OST_CACHING_ENGINE='none'
For using redis/memcache as cache engine refer - [OpenSTFoundation/ost-price-oracle](https://github.com/OpenSTFoundation/ost-price-oracle)
```

# Example:
```js
const OpenSTPayment = require('@openstfoundation/openst-payments')
  , deployer = new OpenSTPayment.deployer()
  , opsManaged = new OpenSTPayment.opsManaged()
  , workers = new OpenSTPayment.worker(workerContractAddress, chainId)
  , airdrop = new OpenSTPayment.airdrop(airdropContractAddress, chainId)
  , currency = 'USD'
;  
  // Deploy Contract
  deployer.deploy( contractName, constructorArgs, gasPrice, options);
  // Set Ops Address
  opsManaged.setOpsAddress(deployerName, opsAddress, options);
  // Set Worker
  workers.setWorker(senderAddress, senderPassphrase, workerAddress, deactivationHeight, gasPrice);
  // Set Price Oracle
  airdrop.setPriceOracle(senderAddress, senderPassphrase, currency, address, gasPrice);
  // Set Accepted Margin
  airdrop.setAcceptedMargin(senderAddress, senderPassphrase, currency, acceptedMargin, gasPrice);
  // Transfer Amount to airdrop budget holder
  // Approve airdrop budget holder
  // Approve spender
  // Call Pay method
  airdrop.pay(workerAddress,
              WorkerPassphrase,
              beneficiaryAddress,
              transferAmount,
              commissionBeneficiaryAddress,
              commissionAmount,
              currency,
              intendedPricePoint,
              spender,
              airdropAmount,
              gasPrice);
```