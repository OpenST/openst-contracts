# OpenST Payments - Advance Payment infrastructure on top of the [OpenST network](https://simpletoken.org)

[![Latest version](https://img.shields.io/npm/v/@openstfoundation/openst-payments.svg?maxAge=3600)](https://www.npmjs.com/package/@openstfoundation/openst-payments)
[![Travis](https://img.shields.io/travis/OpenSTFoundation/openst-payments.svg?maxAge=600)](https://travis-ci.org/OpenSTFoundation/openst-payments)
[![Downloads per month](https://img.shields.io/npm/dm/@openstfoundation/openst-payments.svg?maxAge=3600)](https://www.npmjs.com/package/@openstfoundation/openst-payments)
[![Gitter: JOIN CHAT](https://img.shields.io/badge/gitter-JOIN%20CHAT-brightgreen.svg)](https://gitter.im/OpenSTFoundation/SimpleToken)

While OpenST 0.9 is available as-is for anyone to use, we caution that this is early stage software and under heavy ongoing development and improvement. Please report bugs and suggested improvements.

# Install OpenST Payments

```bash
npm install @openstfoundation/openst-payments --save
```

# Run Test Chain

```bash
cd mocha_test/scripts/
sh start_test_chain.sh
```

# Set EVN Variables

### Setup Initial Setup Variables:

```bash
export OST_UTILITY_GETH_RPC_PROVIDER=''
export OST_UTILITY_GETH_WS_PROVIDER=''
export OST_UTILITY_DEPLOYER_ADDR=''
export OST_UTILITY_DEPLOYER_PASSPHRASE=''
export OST_UTILITY_OPS_ADDR=''
export OST_UTILITY_OPS_PASSPHRASE=''
```

### Deploy Branded Token Contract:

```bash
node tools/deploy/EIP20TokenMock.js conversionRate symbol name decimals gasPrice
```

### Deploy Workers Contract:

```bash
node tools/deploy/workers.js gasPrice chainId
```

### Deploy Airdrop Contract:

```bash
node tools/deploy/airdrop.js brandedTokenContractAddress baseCurrency workerContractAddress airdropBudgetHolder gasPrice chainId
```

### Set Caching Engine:

```bash
export OST_CACHING_ENGINE='none'
For using redis/memcache as cache engine refer - [OpenSTFoundation/ost-price-oracle](https://github.com/OpenSTFoundation/ost-price-oracle)
```

### Set DB Details For Payments/Airdrop:

```bash
export OP_MYSQL_HOST=''
export OP_MYSQL_USER=''
export OP_MYSQL_PASSWORD=''
export OP_MYSQL_DATABASE=''
export OP_MYSQL_CONNECTION_POOL_SIZE='5'
```

### Create Airdrop Tables:

```bash
node migrations/create_tables.js 
```

# Deploy Service Examples:
```js
const OpenSTPayment = require('@openstfoundation/openst-payments')
  , Deploy = OpenSTPayment.services.deploy
;  
  // Deploy Workers
  const deployWorkerObject = new Deploy.workers({
    gas_price: gasPrice,
    options: {returnType: 'txHash'}
  });
  deployWorkerObject.perform();
  
  // Deploy Airdrop
  const deployAirdropObject = new Deploy.airdrop({
    branded_token_contract_address: brandedTokenAddress,
    base_currency: baseCurrency,
    worker_contract_address: workerContractAddress,
    airdrop_budget_holder: airdropBudgetHolder,
    gas_price: gasPrice,
    options: {returnType: 'txHash'}
  });
  deployAirdropObject.perform();
  
```

# OpsManaged Service Examples
```js
const OpenSTPayment = require('@openstfoundation/openst-payments')
  , OpsManaged = OpenSTPayment.services.opsManaged
;  
  // Set Ops Address
  const setOpsObject = new OpsManaged.setOps({
    contract_address: contractAddress,
    gas_price: gasPrice,
    chain_id: chainId,
    deployer_address: deployerAddress,
    deployer_passphrase: deployerPassphrase,
    ops_address: opsAddress,
    options: {returnType: 'txHash'}
  });
  setOpsObject.perform();
    
  // Get Ops Address
  const getOpsObject = new OpsManaged.getOps({
    contract_address: contractAddress,
    gas_price: gasPrice,
    chain_id: chainId
  });
  getOpsObject.perform();
```

# Workers Service Examples
```js
const OpenSTPayment = require('@openstfoundation/openst-payments')
  , Workers = OpenSTPayment.services.workers
;  
  // Set Worker
  const setWorkerObject = new Workers.setWorker({
      workers_contract_address: constants.workersContractAddress,
      sender_address: constants.ops,
      sender_passphrase: constants.opsPassphrase,
      worker_address: workerAddress,
      deactivation_height: deactivationHeight.toString(10),
      gas_price: gasPrice,
      chain_id: chainId,
      options: {returnType: 'txHash'}
  });
  setWorkerObject.perform();
  
  // Is Worker
  const isWorkerObject = new Workers.isWorker({
      workers_contract_address: workersContractAddress,
      worker_address: workerAddress,
      chain_id: chainId
  });
  isWorkerObject.perform();
```

# Airdrop Management Service Examples:
```js
const OpenSTPayment = require('@openstfoundation/openst-payments')
  , AirdropManager = OpenSTPayment.services.airdropManager
;  
  // Register Airdrop
  const registerObject = new AirdropManager.register({
    airdrop_contract_address: airdropContractAddress,
    chain_id: chainId
  });
  registerObject.perform();
  
  // Set Price Oracle
  const setPriceOracleObject = new AirdropManager.setPriceOracle({
      airdrop_contract_address: airdropContractAddress,
      chain_id: chainId,
      sender_address: senderAddress,
      sender_passphrase: senderPassphrase,
      currency: currency,
      price_oracle_contract_address: priceOracleContractAddress,
      gas_price: gasPrice,
      options: {tag: 'airdrop.setPriceOracle', returnType: 'txHash'}
  });
  setPriceOracleObject.perform();
  
  // Set Accepted Margin
  const setAcceptedMarginObject = new AirdropManager.setAcceptedMargin({
    airdrop_contract_address: airdropContractAddress,
    chain_id: chainId,
    sender_address: senderAddress,
    sender_passphrase: senderPassphrase,
    currency: currency,
    accepted_margin: acceptedMargin,
    gas_price: gasPrice,
    options: {tag: 'airdrop.setAcceptedMargin', returnType: 'txHash'}
  });
  setAcceptedMarginObject.perform();
  
  // Transfer Amount to airdrop budget holder
  const transferObject = new AirdropManager.transfer({
    sender_address: senderAddress,
    sender_passphrase: senderPassphrase,
    airdrop_contract_address: airdropContractAddress,
    amount: airdropBudgetAmountInWei,
    gas_price: gasPrice,
    chain_id: chainId,
    options: {tag: 'airdrop.transfer', returnType: 'txHash'}
  });
  transferObject.perform();
  
  // Approve airdrop budget holder
  const approveObject = new AirdropManager.approve({
    airdrop_contract_address: airdropContractAddress,
    airdrop_budget_holder_passphrase: airdropBudgetHolderPassphrase,
    gas_price: gasPrice,
    chain_id: chainId,
    options: {tag: 'airdrop.approve', returnType: 'txHash'}
  });
  approveObject.perform();
  
  // Allocate airdrop amount to users in batch
  const batchAllocatorObject = new AirdropManager.batchAllocator({
    airdrop_contract_address: airdropContractAddress,
    transaction_hash: transactionHash,
    airdrop_users: {userAddress1: {airdropAmount: amountInWei, expiryTimestamp: 0}, userAddress2: {airdropAmount: amountInWei, expiryTimestamp: 0}},
    chain_id: chainId
  });
  batchAllocatorObject.perform();
  
  // Get Users Airdrop Balance
  const userBalanceObject = new AirdropManager.userBalance({
    airdrop_contract_address: airdropContractAddress,
    chain_id: chainId,
    user_addresses: [user1, user2]
  });
  userBalanceObject.perform();
  
  // Call Pay method
  const payObject = new AirdropManager.pay({
    airdrop_contract_address: airdropContractAddress,
    chain_id: chainId,
    sender_worker_address: workerAddress,
    sender_worker_passphrase: workerPassphrase,
    beneficiary_address: beneficiary,
    transfer_amount: transferAmount.toString(10),
    commission_beneficiary_address: commissionBeneficiary,
    commission_amount: commissionAmount.toString(10),
    currency: currency,
    intended_price_point: intendedPricePoint,
    spender: spenderAddress,
    gas_price: gasPrice,
    options: {tag:'airdrop.pay', returnType: 'txHash'}
  });
  payObject.perform()
  
```

For further implementation details, please refer to the [API documentation](https://openstfoundation.github.io/openst-payments/).