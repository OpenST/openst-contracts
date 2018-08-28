let registerInternalActor = require('./registerInternalActor');

contract('Branded Token', function(accounts) {
  describe('Initial', async () => registerInternalActor.perform(accounts));
  after(async () => {
    // workersUtils.utils.printGasStatistics();
    // workersUtils.utils.clearReceipts();
  });
});
