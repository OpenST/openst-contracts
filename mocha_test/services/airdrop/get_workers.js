const chai = require('chai'),
  assert = chai.assert;

const rootPrefix = '../../..',
  constants = require(rootPrefix + '/mocha_test/lib/constants'),
  InstanceComposer = require(rootPrefix + '/instance_composer'),
  configStrategy = require(rootPrefix + '/mocha_test/scripts/config_strategy'),
  instanceComposer = new InstanceComposer(configStrategy);

require(rootPrefix + '/lib/contract_interact/airdrop');
require(rootPrefix + '/lib/providers/web3_factory');

const airdrop = instanceComposer.getAirdropInteractClass(),
  airdropContract = new airdrop(constants.airdropOstUsdAddress, constants.chainId),
  web3ProviderFactory = instanceComposer.getWeb3ProviderFactory(),
  web3Provider = web3ProviderFactory.getProvider(web3ProviderFactory.typeWS);

describe('Get Workers', function() {
  it('should return correct worker contract address', async function() {
    const airdropWorkersResult = await airdropContract.getWorkers();
    assert.equal(airdropWorkersResult.isSuccess(), true);
    assert.equal(
      airdropWorkersResult.data.workerContractAddress,
      web3Provider.utils.toChecksumAddress(constants.workersContractAddress)
    );
  });
});
