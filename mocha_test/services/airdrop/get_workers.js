
const chai = require('chai')
  , assert = chai.assert;

const rootPrefix = "../../.."
  , constants = require(rootPrefix + '/mocha_test/lib/constants')
  , airdrop = require(rootPrefix + '/lib/contract_interact/airdrop')
  , airdropContract = new airdrop(constants.airdropOstUsdAddress, constants.chainId)
  , web3RpcProvider = require(rootPrefix + '/lib/web3/providers/rpc')
;

describe('Get Workers', function() {

  it('should return correct worker contract address', async function() {

    const airdropWorkersResult = await airdropContract.getWorkers();
    assert.equal(airdropWorkersResult.isSuccess(), true);
    assert.equal(airdropWorkersResult.data.workerContractAddress,
      web3RpcProvider.utils.toChecksumAddress(constants.workerContractAddress));

  });

});
