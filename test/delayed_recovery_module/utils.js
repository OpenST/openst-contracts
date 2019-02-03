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

'use strict';

const EthUtils = require('ethereumjs-util');
const web3 = require('../test_lib/web3.js');

const DelayedRecoveryModule = artifacts.require('DelayedRecoveryModule');

const MINIMUM_DELAY = 4 * 84600;

const RECOERY_MODULE_DOMAIN_SEPARATOR_TYPEHASH = web3.utils.keccak256(
  'EIP712Domain(address delayedRecoveryModule)',
);

const RECOVERY_STRUCT_TYPEHASH = web3.utils.keccak256(
  'RecoveryStruct(address prevOwner,address oldOwner,address newOwner)',
);

const RESET_RECOVERY_OWNER_STRUCT_TYPEHASH = web3.utils.keccak256(
  'ResetRecoveryOwnerStruct(address oldRecoveryOwner,newRecoveryOwner)',
);

const RECOVERY_OWNER_ADDRESS = '0xC9EfFC17034eFA68b445db8618294e9500144D96';
const RECOVERY_OWNER_PRIVATE_KEY = '0xc5dff061ed33bf9fe42f8071d7bf6cd168bec5593e3c19a344ba35d50f37768d';

async function createRecoveryModule(accountProvider) {
  const recoveryOwnerAddress = RECOVERY_OWNER_ADDRESS;
  const recoveryControllerAddress = accountProvider.get();
  const recoveryBlockDelay = MINIMUM_DELAY;

  const recoveryModule = await DelayedRecoveryModule.new();

  await recoveryModule.setup(
    recoveryOwnerAddress,
    recoveryControllerAddress,
    MINIMUM_DELAY,
  );

  return {
    recoveryOwnerAddress,
    recoveryOwnerPrivateKey: RECOVERY_OWNER_PRIVATE_KEY,
    recoveryControllerAddress,
    recoveryBlockDelay,
    recoveryModule,
  };
}

function hashRecoveryModuleDomainSeparator(recoveryModuleAddress) {
  return web3.utils.keccak256(
    web3.eth.abi.encodeParameters(
      [
        'bytes32',
        'address',
      ],
      [
        RECOERY_MODULE_DOMAIN_SEPARATOR_TYPEHASH,
        recoveryModuleAddress,
      ],
    ),
  );
}

function hashRecoveryModuleRecoveryStruct(
  prevOwner, oldOwner, newOwner,
) {
  return web3.utils.keccak256(
    web3.eth.abi.encodeParameters(
      [
        'bytes32',
        'address',
        'address',
        'address',
      ],
      [
        RECOVERY_STRUCT_TYPEHASH,
        prevOwner,
        oldOwner,
        newOwner,
      ],
    ),
  );
}

function hashRecoveryModuleRecovery(
  recoveryModuleAddress, prevOwner, oldOwner, newOwner,
) {
  const recoveryStructHash = hashRecoveryModuleRecoveryStruct(
    prevOwner,
    oldOwner,
    newOwner,
  );

  const domainSeparatorHash = hashRecoveryModuleDomainSeparator(
    recoveryModuleAddress,
  );

  return web3.utils.soliditySha3(
    { t: 'bytes1', v: '0x19' },
    { t: 'bytes1', v: '0x01' },
    { t: 'bytes32', v: domainSeparatorHash },
    { t: 'bytes32', v: recoveryStructHash },
  );
}

function hashRecoveryModuleResetOwnerStruct(
  oldRecoveryOwner, newRecoveryOwner,
) {
  return web3.utils.keccak256(
    web3.eth.abi.encodeParameters(
      [
        'bytes32',
        'address',
        'address',
      ],
      [
        RESET_RECOVERY_OWNER_STRUCT_TYPEHASH,
        oldRecoveryOwner,
        newRecoveryOwner,
      ],
    ),
  );
}

function hashRecoveryModuleResetOwner(
  recoveryModuleAddress, oldRecoveryOwner, newRecoveryOwner,
) {
  const domainSeparatorHash = hashRecoveryModuleDomainSeparator(
    recoveryModuleAddress,
  );

  const resetOwnerStructHash = hashRecoveryModuleResetOwnerStruct(
    oldRecoveryOwner, newRecoveryOwner,
  );

  return web3.utils.soliditySha3(
    { t: 'byte1', v: '0x19' },
    { t: 'byte1', v: '0x01' },
    { t: 'bytes32', v: domainSeparatorHash },
    { t: 'bytes32', v: resetOwnerStructHash },
  );
}

function signRecovery(
  recoveryModuleAddress, prevOwner, oldOwner, newOwner, recoveryOwnerPrivateKey,
) {
  const recoveryHash = hashRecoveryModuleRecovery(
    recoveryModuleAddress, prevOwner, oldOwner, newOwner,
  );

  const signature = EthUtils.ecsign(
    EthUtils.toBuffer(recoveryHash),
    EthUtils.toBuffer(recoveryOwnerPrivateKey),
  );

  return {
    recoveryHash,
    signature,
  };
}

function signResetRecoveryOwner(
  recoveryModuleAddress, oldRecoveryOwner, newRecoveryOwner, recoveryOwnerPrivateKey,
) {
  const resetRecoveryOwnerHash = hashRecoveryModuleResetOwner(
    recoveryModuleAddress, oldRecoveryOwner, newRecoveryOwner,
  );

  const signature = EthUtils.ecsign(
    EthUtils.toBuffer(resetRecoveryOwnerHash),
    EthUtils.toBuffer(recoveryOwnerPrivateKey),
  );

  return {
    resetRecoveryOwnerHash,
    signature,
  };
}

module.exports = {

  MINIMUM_DELAY,

  createRecoveryModule,

  hashRecoveryModuleDomainSeparator,

  hashRecoveryModuleRecoveryStruct,

  hashRecoveryModuleRecovery,

  hashRecoveryModuleResetOwnerStruct,

  hashRecoveryModuleResetOwner,

  signRecovery,

  signResetRecoveryOwner,
};
