"use strict";

const events = {

  // below are the event names
  eventAirdropPayment: function() {
    return "AirdropPayment";
  },

  eventPayment: function() {
    return "Payment";
  }
};

// below are the event attribute names
events.eventAttribute = {
  tokenAmount: function() {
    return "_tokenAmount";
  },
  commissionTokenAmount: function() {
    return "_commissionTokenAmount";
  },
  airdropAmount: function() {
    return "_airdropAmount";
  }
};

module.exports = events;
