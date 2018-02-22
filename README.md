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
export OST_UTILITY_DEPLOYER_PASSPHRASE=''
export OST_UTILITY_OPS_ADDR=''
export OST_UTILITY_OPS_PASSPHRASE=''
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

### Set DB Details For Payments/Airdrop:

```bash
export OP_MYSQL_HOST='127.0.0.1'
export OP_MYSQL_USER=''
export OP_MYSQL_PASSWORD=''
export OP_MYSQL_DATABASE='payment_development'
export OP_MYSQL_CONNECTION_POOL_SIZE='5'
export OP_MYSQL_TIMEZONE='+05:30'
```

### Create Airdrop Tables:

```bash
node migrations/create_tables.js 
```

# Example:
```js
const OpenSTPayment = require('@openstfoundation/openst-payments')
  , deployer = new OpenSTPayment.deployer()
  , opsManaged = new OpenSTPayment.opsManaged()
  , workers = new OpenSTPayment.worker(workerContractAddress, chainId)
  , airdrop = new OpenSTPayment.airdrop(airdropContractAddress, chainId)
;  
  // Deploy Contract
  deployer.deploy( contractName, constructorArgs, gasPrice, options);
  // Set Ops Address
  opsManaged.setOpsAddress(deployerName, opsAddress, options);
  // Set Worker
  workers.setWorker(senderAddress, senderPassphrase, workerAddress, deactivationHeight, gasPrice, options);
  // Set Price Oracle
  airdrop.setPriceOracle(senderAddress, senderPassphrase, currency, address, gasPrice, options);
  // Set Accepted Margin
  airdrop.setAcceptedMargin(senderAddress, senderPassphrase, currency, acceptedMargin, gasPrice, options);
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