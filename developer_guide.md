##Developer guide

### Install OpenST Payments
```bash
npm install @openstfoundation/openst-payments
```

#### Deploy Service Examples

```js
let os = require('os');
let InstanceComposer = require( os.homedir() + '/openst-payments/instance_composer' );
let instanceComposer = new InstanceComposer(configStrategy);
```

##### getWorkers Deployer service usage
```js
let DeployWorkersKlass = instanceComposer.getWorkerDeployerClass(),
    deployWorkerObject = new DeployWorkersKlass(
  {
      gas_price: 1000000000,
      options: 
      { 
        returnType: 'txReceipt'
      }
  });
deployWorkerObject.perform().then(function(r){console.log(JSON.stringify(r))});
```

##### getAirdrop Deployer service usage
```js
let AirdropDeployerClass = instanceComposer.getAirdropDeployerClass(),
  airdropDeployerObject = new AirdropDeployerClass(
  {
	branded_token_contract_address: branded_token_contract_address,
    base_currency: 'OST',
    worker_contract_address: workersContractAddress,
    airdrop_budget_holder: airdropBudgetHolder,
    gas_price: 1000000000,
    options:
    { 
	  returnType: 'txReceipt' 
	}
  });
airdropDeployerObject.perform().then(function(r){console.log(JSON.stringify(r))});
```



#### Airdrop Management Service Examples

```js
let InstanceComposer = require('./instance_composer');
let instanceComposer = new InstanceComposer(configStrategy);
```

##### getSet Accepted Margin service usage
```js
let SetAcceptedMarginKlass = instanceComposer.getSetAcceptedMarginClass(),
  setAcceptedMarginObject = new SetAcceptedMarginKlass(
    {
         airdrop_contract_address: '0x7837c97EEAb8d79d0a5aE51B51D20A7fD0191f10',
         chain_id: chainId,
         sender_address: opsAddress,
         sender_passphrase: opsPassphrase,
         currency: 'USD',
         accepted_margin: 1000000000000000000,
         gas_price: 1000000000,
         options: 
         {
           tag: 'airdrop.setAcceptedMargin',
           returnType: 'txReceipt'
         }
    });
setAcceptedMarginObject.perform().then(function(r){console.log(JSON.stringify(r))});
```

##### getRegister Airdrop service usage
```js
let RegisterAirdropKlass = instanceComposer.getRegisterAirdropClass(),
  registerAirdropObject = new RegisterAirdropKlass(
  {
	airdrop_contract_address: '0x7837c97EEAb8d79d0a5aE51B51D20A7fD0191f10',
	chain_id: chainId
});
registerAirdropObject.perform().then(function(r){console.log(JSON.stringify(r))});
```

##### getSet Price Oracle service usage
```js
let SetPriceOracleKlass = instanceComposer.getSetPriceOracleClass(),
  setPriceOracleObject = new SetPriceOracleKlass(
    {
        airdrop_contract_address: '0x7837c97EEAb8d79d0a5aE51B51D20A7fD0191f10',
        chain_id: chainId,
        sender_address: opsAddress,
        sender_passphrase: opsPassphrase,
        currency: 'USD',
        price_oracle_contract_address: price_oracle_contract_address,
        gas_price: 1000000000,
        options: 
        {
          tag: 'airdrop.setAcceptedMargin',
           returnType: 'txReceipt'
        }
    });
setPriceOracleObject.perform().then(function(r){console.log(JSON.stringify(r))});
```

##### getTransfer service usage
```js
let AirdropManagerTransferKlass = instanceComposer.getTransferClass(),
  transferObject = new AirdropManagerTransferKlass(
    {
	  sender_address: opsAddress,
      sender_passphrase: opsPassphrase,
      airdrop_contract_address: '0x7837c97EEAb8d79d0a5aE51B51D20A7fD0191f10',
      amount: 25000000000000000000,
      gas_price: 1000000000,
      chain_id: '2000',
      options: 
      { 
        tag: '', 
        returnType: 'txReceipt' 
      }
    });
transferObject.perform().then(function(r){console.log(JSON.stringify(r))});
```

#### getUserBalance function usage
```js
let AirdropUserBalanceKlass = instanceComposer.getAirdropUserBalanceClass(),
    userBalanceObject = new AirdropUserBalanceKlass(
      {
        chain_id : '2000',
        airdrop_contract_address : '0x7837c97EEAb8d79d0a5aE51B51D20A7fD0191f10',
        user_addresses : user_addresses
      });
userBalanceObject.perform().then(function(r){console.log(JSON.stringify(r))});
```





#### OpsManaged Service Examples

```js
let InstanceComposer = require('./instance_composer');
let instanceComposer = new InstanceComposer(configStrategy);
```

#### getOps service usage
```js
let GetOpsKlass = instanceComposer.getOpsClass(),
  getOpsObject = new GetOpsKlass(
    {
        contract_address: '0x6A28E9a2b15Ad90EA50C35664fbd10AeeAF88aa8',
            gas_price: 1000000000,
            chain_id: '2000'
    });
getOpsObject.perform().then(function(r){console.log(JSON.stringify(r))});
```

#### getSetOps service usage
```js
let SetOpsKlass = instanceComposer.getSetOpsClass(),
  setOpsObject = new SetOpsKlass(
    {
        contract_address: '0x6A28E9a2b15Ad90EA50C35664fbd10AeeAF88aa8',
        gas_price: 1000000000,
        chain_id: 2000,
        deployer_address: '0xc3df0bec910ca2ef0eed8a68bf7145178057098c',
        deployer_passphrase: 'testtest',
        ops_address: '0x7e862ec39eeaeb7cbba350f54762947d4ea83073',
        options: 
        {
          returnType: 'txReceipt' 
        }
    });
setOpsObject.perform().then(function(r){console.log(JSON.stringify(r))});
```



#### Workers Service Examples

```js
let InstanceComposer = require('./instance_composer');
let instanceComposer = new InstanceComposer(configStrategy);
```

#### getSetWorker service usage
```js
let SetWorkerKlass = instanceComposer.getSetWorkerClass(),
  setWorkerObject = new SetWorkerKlass(
    {
      workers_contract_address: workersContractAddress,
      sender_address: opsAddress,
      sender_passphrase: opsPassphrase,
      worker_address: workerAccount1,
      deactivation_height: deactivation_height,
      gas_price: gas_price,
      chain_id: chainId,
      options: optionsReceipt
    });
setWorkerObject.perform().then(function(r){console.log(JSON.stringify(r))});
```

#### getIsWorker service usage
```js
let IsWorkerKlass = instanceComposer.getIsWorkerClass(),
  isWorkerObject = new IsWorkerKlass(
    {
      workers_contract_address: workersContractAddress,
      worker_address: workerAccount1,
      chain_id: chainId
    });
isWorkerObject.perform().then(function(r){console.log(JSON.stringify(r))});
```

