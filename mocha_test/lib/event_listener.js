const openSTNotification = require('@openstfoundation/openst-notification');

var notificationRef = null;
var allEvents = {};


module.exports.verifyIfEventFired = function(uuid, kind) {
  const key = `${uuid}_${kind}`;
  return allEvents[key] !== undefined && allEvents[key] !== "undefined" && allEvents[key] !== null && allEvents[key] !== '';
};

module.exports.startObserving = function() {
  if (notificationRef === null) {
    openSTNotification.subscribeEvent.local(
      [
        "payments.pricer.setAcceptedMargin",
        "payments.pricer.setPriceOracle",
        "payments.pricer.unsetPriceOracle",
        "payments.pricer.pay",
        "payments.airdrop.pay",
        "payments.workers.setWorker",
        "payments.workers.removeWorker",
        "payments.workers.remove",
        "payments.opsManaged.setOpsAddress",
        "payments.brandedToken.transferToBudgetHolder",
        "payments.brandedToken.approveToBudgetHolder"
      ],
      function(msgContent) {
        const messageData = JSON.parse(msgContent);
        const key = `${messageData.message.payload.uuid}_${messageData.message.kind}`;
        allEvents[key] = messageData.message;
      });
    notificationRef = openSTNotification;
  }
};
