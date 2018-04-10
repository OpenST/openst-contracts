
const chai = require('chai')
  , assert = chai.assert;

const rootPrefix = "../../.."
  , constants = require(rootPrefix + '/mocha_test/lib/constants')
  , airdrop = require(rootPrefix + '/lib/contract_interact/airdrop')
  , airdropContract = new airdrop(constants.airdropOstUsdAddress, constants.chainId)
  , web3Provider = require(rootPrefix + '/lib/web3/providers/ws')
;

describe('Get Airdrop Budget Holder', function() {

  it('should return correct airdrop budget holder address', async function() {
    this.timeout(100000);
    const airdropWorkersResult = await airdropContract.airdropBudgetHolder();
    assert.equal(airdropWorkersResult.isSuccess(), true);
    assert.equal(airdropWorkersResult.data.airdropBudgetHolder,
      web3Provider.utils.toChecksumAddress(constants.airdropBudgetHolder));

  });

});
