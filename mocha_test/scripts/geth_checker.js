'use strict';

const rootPrefix = '../..',
  logger = require(rootPrefix + '/helpers/custom_console_logger'),
  InstanceComposer = require(rootPrefix + '/instance_composer'),
  configStrategy = require(rootPrefix + '/mocha_test/scripts/config_strategy');

require(rootPrefix + '/lib/providers/web3_factory');

const performer = async function() {
  const delay = 10 * 1000,
    timeoutValue = 30 * 60 * 1000;

  var counter = 0,
    totalTime = counter * delay,
    isInProcess = false;

  setInterval(function() {
    if (totalTime <= timeoutValue) {
      if (isInProcess == false) {
        let instanceComposer = new InstanceComposer(configStrategy),
          web3ProviderFactory = instanceComposer.getWeb3ProviderFactory(),
          web3Provider = web3ProviderFactory.getProvider(web3ProviderFactory.typeWS);

        isInProcess = true;
        web3Provider.eth.getBlockNumber(function(err, blocknumber) {
          if (err || blocknumber < 1) {
            logger.debug('Unable to get blocknumber');
          } else {
            logger.debug('blocknumber', blocknumber);
            process.exit(0);
          }
          isInProcess = false;
        });
      }
    } else {
      logger.error('GethChecker unable to complete process in time: ', timeoutValue);
      process.exit(1);
    }
    counter++;
    totalTime = counter * delay;
  }, delay);
};

performer();
