const openSTNotification = require('@openstfoundation/openst-notification');

var notificationRef = null;
var allEvents = {};


module.exports.verifyIfEventFired = function(uuid, kind) {
  const key = `${uuid}_${kind}`;
  console.log("verifyIfEventFired");
  console.log(key);
  console.log(allEvents[key]);
  return allEvents[key] !== undefined && allEvents[key] !== "undefined" && allEvents[key] !== null;
};

module.exports.startObserving = function() {
  if (notificationRef === null) {
    openSTNotification.subscribeEvent.local(
      ["payment.pricer.setAcceptedMargin"],
      function(msgContent) {
        const messageData = JSON.parse(msgContent);
        const key = `${messageData.message.payload.uuid}_${messageData.message.kind}`;
        allEvents[key] = messageData.message;
      });
    notificationRef = openSTNotification;
  }
};

/*

{
  "topics": [
    "payment.pricer.setAcceptedMargin"
  ],
  "message": {
    "kind": "transaction_mined",
    "payload": {
      "contract_name": "pricer",
      "contract_address": "0xF7FB23e884Aeb83E1606E36b8327666df158aEb9",
      "method": "setAcceptedMargin",
      "params": {
        "args": [],
        "txParams": {
          "from": "0x1bc1b631e56e8806f8335fa00298eef0d3ae50d1",
          "to": "0xf7fb23e884aeb83e1606e36b8327666df158aeb9",
          "data": "0xbd90bc3055534400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000032",
          "gasPrice": "0xba43b7400",
          "gas": "0x8adae0"
        }
      },
      "transaction_hash": "0x7e752ae628e84d776ffcc78fbb25f3cf610b7c82f20a76c03e28d4da16eceab2",
      "chain_id": "2000",
      "chain_kind": "",
      "uuid": "89787ab2-b969-4851-9fd2-4f8cbca69d89",
      "error_data": {}
    }
  }
}

*/
