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
const Utils = require('../test_lib/utils.js');

const DelayedRecoveryModule = artifacts.require('DelayedRecoveryModule');
const GnosisSafeModuleManagerSpy = artifacts.require('GnosisSafeModuleManagerSpy');

// @todo [Pro]: Enable this once figured out how to test!
// const BLOCK_RECOVERY_DELAY = 4 * 84600;
const BLOCK_RECOVERY_DELAY = 50;

const RECOERY_MODULE_DOMAIN_SEPARATOR_TYPEHASH = web3.utils.keccak256(
  'EIP712Domain(address verifyingContract)',
);

const INITIATE_RECOVERY_STRUCT_TYPEHASH = web3.utils.keccak256(
  'InitiateRecoveryStruct(address prevOwner,address oldOwner,address newOwner)',
);

const EXECUTE_RECOVERY_STRUCT_TYPEHASH = web3.utils.keccak256(
  'ExecuteRecoveryStruct(address prevOwner,address oldOwner,address newOwner)',
);

const ABORT_RECOVERY_STRUCT_TYPEHASH = web3.utils.keccak256(
  'AbortRecoveryStruct(address prevOwner,address oldOwner,address newOwner)',
);

const RESET_RECOVERY_OWNER_STRUCT_TYPEHASH = web3.utils.keccak256(
  'ResetRecoveryOwnerStruct(address oldRecoveryOwner,address newRecoveryOwner)',
);

const RECOVERY_OWNER_ADDRESS = '0xC9EfFC17034eFA68b445db8618294e9500144D96';
const RECOVERY_OWNER_PRIVATE_KEY = '0xc5dff061ed33bf9fe42f8071d7bf6cd168bec5593e3c19a344ba35d50f37768d';

async function createRecoveryModule(accountProvider) {
  const recoveryOwnerAddress = RECOVERY_OWNER_ADDRESS;
  const recoveryControllerAddress = accountProvider.get();
  const recoveryBlockDelay = BLOCK_RECOVERY_DELAY;

  const moduleManager = await GnosisSafeModuleManagerSpy.new();
  const transactionResponse = await moduleManager.createDelayedRecoveryModule(
    recoveryOwnerAddress,
    recoveryControllerAddress,
    BLOCK_RECOVERY_DELAY,
  );

  const recoveryModuleAddress = Utils.getParamFromTxEvent(
    transactionResponse,
    moduleManager.address,
    'DelayedRedcoveryModuleCreated',
    '_contractAddress',
  );

  const recoveryModule = await DelayedRecoveryModule.at(recoveryModuleAddress);

  return {
    recoveryOwnerAddress,
    recoveryOwnerPrivateKey: RECOVERY_OWNER_PRIVATE_KEY,
    recoveryControllerAddress,
    recoveryBlockDelay,
    moduleManager,
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
  structTypeHash, prevOwner, oldOwner, newOwner,
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
        structTypeHash,
        prevOwner,
        oldOwner,
        newOwner,
      ],
    ),
  );
}

function hashRecoveryModuleInitiateRecoveryStruct(
  prevOwner, oldOwner, newOwner,
) {
  return hashRecoveryModuleRecoveryStruct(
    INITIATE_RECOVERY_STRUCT_TYPEHASH,
    prevOwner,
    oldOwner,
    newOwner,
  );
}

function hashRecoveryModuleExecuteRecoveryStruct(
  prevOwner, oldOwner, newOwner,
) {
  return hashRecoveryModuleRecoveryStruct(
    EXECUTE_RECOVERY_STRUCT_TYPEHASH,
    prevOwner,
    oldOwner,
    newOwner,
  );
}

function hashRecoveryModuleAbortRecoveryStruct(
  prevOwner, oldOwner, newOwner,
) {
  return hashRecoveryModuleRecoveryStruct(
    ABORT_RECOVERY_STRUCT_TYPEHASH,
    prevOwner,
    oldOwner,
    newOwner,
  );
}

function hashRecoveryModuleRecovery(
  recoveryModuleAddress, structTypeHash, prevOwner, oldOwner, newOwner,
) {
  const recoveryStructHash = hashRecoveryModuleRecoveryStruct(
    structTypeHash,
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

function hashRecoveryModuleInitiateRecovery(
  recoveryModuleAddress, prevOwner, oldOwner, newOwner,
) {
  return hashRecoveryModuleRecovery(
    recoveryModuleAddress,
    INITIATE_RECOVERY_STRUCT_TYPEHASH, prevOwner, oldOwner, newOwner,
  );
}

function hashRecoveryModuleExecuteRecovery(
  recoveryModuleAddress, prevOwner, oldOwner, newOwner,
) {
  return hashRecoveryModuleRecovery(
    recoveryModuleAddress,
    EXECUTE_RECOVERY_STRUCT_TYPEHASH, prevOwner, oldOwner, newOwner,
  );
}

function hashRecoveryModuleAbortRecovery(
  recoveryModuleAddress, prevOwner, oldOwner, newOwner,
) {
  return hashRecoveryModuleRecovery(
    recoveryModuleAddress,
    ABORT_RECOVERY_STRUCT_TYPEHASH, prevOwner, oldOwner, newOwner,
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
    { t: 'bytes1', v: '0x19' },
    { t: 'bytes1', v: '0x01' },
    { t: 'bytes32', v: domainSeparatorHash },
    { t: 'bytes32', v: resetOwnerStructHash },
  );
}

function signRecovery(
  recoveryModuleAddress, structTypeHash, prevOwner, oldOwner, newOwner, recoveryOwnerPrivateKey,
) {
  const recoveryHash = hashRecoveryModuleRecovery(
    recoveryModuleAddress, structTypeHash, prevOwner, oldOwner, newOwner,
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

function signInitiateRecovery(
  recoveryModuleAddress, prevOwner, oldOwner, newOwner, recoveryOwnerPrivateKey,
) {
  return signRecovery(
    recoveryModuleAddress, INITIATE_RECOVERY_STRUCT_TYPEHASH,
    prevOwner, oldOwner, newOwner, recoveryOwnerPrivateKey,
  );
}

function signExecuteRecovery(
  recoveryModuleAddress, prevOwner, oldOwner, newOwner, recoveryOwnerPrivateKey,
) {
  return signRecovery(
    recoveryModuleAddress, EXECUTE_RECOVERY_STRUCT_TYPEHASH,
    prevOwner, oldOwner, newOwner, recoveryOwnerPrivateKey,
  );
}

function signAbortRecovery(
  recoveryModuleAddress, prevOwner, oldOwner, newOwner, recoveryOwnerPrivateKey,
) {
  return signRecovery(
    recoveryModuleAddress, ABORT_RECOVERY_STRUCT_TYPEHASH,
    prevOwner, oldOwner, newOwner, recoveryOwnerPrivateKey,
  );
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

  BLOCK_RECOVERY_DELAY,

  createRecoveryModule,

  hashRecoveryModuleDomainSeparator,

  hashRecoveryModuleInitiateRecoveryStruct,

  hashRecoveryModuleExecuteRecoveryStruct,

  hashRecoveryModuleAbortRecoveryStruct,

  hashRecoveryModuleInitiateRecovery,

  hashRecoveryModuleExecuteRecovery,

  hashRecoveryModuleAbortRecovery,

  hashRecoveryModuleResetOwnerStruct,

  hashRecoveryModuleResetOwner,

  signInitiateRecovery,

  signExecuteRecovery,

  signAbortRecovery,

  signResetRecoveryOwner,
};
