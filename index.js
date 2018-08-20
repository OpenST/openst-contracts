"use strict";

/**
 * Index File of "@openstfoundation/openst-payments" node module
 */

const rootPrefix = "."
  , version = require(rootPrefix + '/package.json').version
  , InstanceComposer = require( rootPrefix + "/instance_composer")
;

require(rootPrefix + '/services/manifest');

const OpenSTPayments = function (configStrategy) {

  const oThis = this;

  if ( !configStrategy ) {
    throw "Mandatory argument configStrategy missing";
  }

  const instanceComposer = oThis.ic = new InstanceComposer( configStrategy );

  oThis.services = instanceComposer.getServiceManifest();

  oThis.version = version;

};

module.exports = OpenSTPayments;