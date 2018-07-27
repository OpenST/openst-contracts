const chai = require('chai'),
  assert = chai.assert;

const rootPrefix = '../../..',
  constants = require(rootPrefix + '/mocha_test/lib/constants'),
  InstanceComposer = require(rootPrefix + '/instance_composer'),
  configStrategy = require(rootPrefix + '/config/temp.json'),
  instanceComposer = new InstanceComposer(configStrategy);

require(rootPrefix + '/lib/contract_interact/airdrop');
require(rootPrefix + '/lib/providers/web3_factory');

const airdrop = instanceComposer.getAirdropInteractClass(),
  airdropContract = new airdrop(constants.airdropOstUsdAddress, constants.chainId),
  web3ProviderFactory = instanceComposer.getWeb3ProviderFactory(),
  web3Provider = web3ProviderFactory.getProvider(web3ProviderFactory.typeWS);

describe('Get Airdrop Budget Holder', function() {
  it('should return correct airdrop budget holder address', async function() {
    this.timeout(100000);
    const airdropWorkersResult = await airdropContract.airdropBudgetHolder();
    assert.equal(airdropWorkersResult.isSuccess(), true);
    assert.equal(
      airdropWorkersResult.data.airdropBudgetHolder,
      web3Provider.utils.toChecksumAddress(constants.airdropBudgetHolder)
    );
  });
});
