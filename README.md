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
export OST_PRICER_GETH_RPC_PROVIDER='http://127.0.0.1:9546'
export OST_PRICER_DEPLOYER_ADDR=''
export OST_PRICER_DEPLOYER_PASSPHRASE='testtest'
export OST_PRICER_OPS_ADDR=''
export OST_PRICER_OPS_PASSPHRASE='testtest'
```

### Start Chain:


### Run Deployment Script for Branded Token:

```bash
node tools/deploy/EIP20TokenMock.js conversionRate symbol name decimals gasPrice
```

### Run Deployment Script for Workers:

```bash
node tools/deploy/workers.js
```

### Run Deployment Script for Airdrop:

```bash
node tools/deploy/airdrop.js brandedTokenContractAddress quoteCurrency workerContractAddress airdropBudgetHolder gasPrice
```

### Set Caching Engine:

```bash
export OST_CACHING_ENGINE='none'
For using redis/memcache as cache engine refer - [OpenSTFoundation/ost-price-oracle](https://github.com/OpenSTFoundation/ost-price-oracle)
```

# Example:
```js
const OpenSTPayment = require('@openstfoundation/openst-payments')
  , workers = OpenSTPayment.worker
  , airdrop = OpenSTPayment.airdrop
;

```