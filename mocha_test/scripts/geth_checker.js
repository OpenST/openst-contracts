'use strict';

const rootPrefix = '../..'
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , web3RpcProvider = require(rootPrefix + '/lib/web3/providers/rpc')
;

const performer = async function () {

  const delay = 10 * 1000
    , timeoutValue = 5 * 60 * 1000
  ;

  var counter = 0
    , totalTime = counter * delay
    , isInProcess = false
  ;

  setInterval(function () {
    if (totalTime <= timeoutValue) {
      if (isInProcess == false) {
        isInProcess = true;
        web3RpcProvider.eth.getBlockNumber(function (err, blocknumber) {
          if (err || blocknumber < 1) {
            logger.info("Unable to get blocknumber");
          } else {
            logger.info("blocknumber", blocknumber);
            process.exit(0);
          }
          isInProcess = false;
        });
      }
    } else {
      logger.error("GethChecker unable to complete process in time: ", timeoutValue);
      process.exit(1);
    }
    counter++;
    totalTime = counter * delay;
  }, delay);
}

performer();
