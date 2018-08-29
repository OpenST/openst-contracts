let registerInternalActor = require('./registerInternalActor');

contract('Branded Token', function(accounts) {
  describe('Initial', async () => registerInternalActor.perform(accounts));
  after(async () => {
  
  });
});
