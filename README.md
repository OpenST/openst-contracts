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

## Start Dynamo
Start DynamoDb with specified path (in dbPath).
Delete the Dynamo DB data file if already exists.
```bash
> java -Djava.library.path=~/dynamodb_local_latest/DynamoDBLocal_lib/ -jar ~/dynamodb_local_latest/DynamoDBLocal.jar -sharedDb -dbPath ~/openst-setup/logs/ 
```

## Run Test Chain

```bash
cd mocha_test/scripts/
sh start_test_chain.sh
```

## Deploy 

### Set ENV Variables
```bash
cd mocha_test/scripts
source env_vars.sh
```

### Init DynamoDB
DynamoDB initial migrations for shard management are
run in it and one shard is created and registered for storing token balance.

```bash
node tools/dynamo_db_init.js
```

### Deploy Branded Token Contract:

```bash
node tools/deploy/EIP20TokenMock.js conversionRate symbol name decimals gasPrice configStrategyFile
```

### Deploy Pricer Contract:

```bash
node tools/deploy/pricer.js brandedTokenContractAddress baseCurrency gasPrice chainID configStrategyFile
```

### Deploy Workers Contract:

```bash
node tools/deploy/workers.js gasPrice chainId configStrategyFile
```

### Deploy Airdrop Contract:

```bash
node tools/deploy/airdrop.js brandedTokenContractAddress baseCurrency workerContractAddress airdropBudgetHolder gasPrice chainId configStrategyFile
```

### Sourcing env_vars again

```bash
cd mocha_test/scripts
source env_vars.sh
```
### Deploy price-oracle

```bash
cd mocha_test/scripts
source deploy_price_oracle.sh
```

## Create Airdrop Tables:

```bash
node migrations/create_tables.js
```



For complete documentation of all the services of OpenST Platform, please refer [Developer Guide](developer_guide.md).