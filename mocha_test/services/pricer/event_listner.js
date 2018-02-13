const openSTNotification = require('@openstfoundation/openst-notification');

var notificationRef = null;
var allEvents = {};


module.exports.verifyIfEventFired = function(uuid, kind) {
  const key = `${uuid}_${kind}`;
  return allEvents[key] !== undefined && allEvents[key] !== "undefined" && allEvents[key] !== null;
};

module.exports.startObserving = function() {
  if (notificationRef === null) {
    openSTNotification.subscribeEvent.local(
      [
        "payment.pricer.setAcceptedMargin",
        "payment.pricer.setPriceOracle",
        "payment.pricer.unsetPriceOracle",
        "payment.pricer.pay"
      ],
      function(msgContent) {
        const messageData = JSON.parse(msgContent);
        const key = `${messageData.message.payload.uuid}_${messageData.message.kind}`;
        allEvents[key] = messageData.message;
      });
    notificationRef = openSTNotification;
  }
};
