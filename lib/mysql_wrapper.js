'use strict';

/*
 * Manage mysql clusters and connection pools
 */

const mysql = require('mysql');

const rootPrefix = '..',
  InstanceComposer = require(rootPrefix + '/instance_composer'),
  logger = require(rootPrefix + '/helpers/custom_console_logger'),
  poolClusters = {};

require(rootPrefix + '/config/mysql');

const MySqlWrapper = function(configStrategy, instanceComposer) {
  const oThis = this;

  oThis.poolClusters = poolClusters;

  oThis.init(instanceComposer);
};

// helper methods for mysql pool clusters
MySqlWrapper.prototype = {
  poolClusters: null,

  // this loops over all the databases and creates pool cluster objects map in poolClusters
  init: function(instanceComposer) {
    const oThis = this;

    instanceComposer = instanceComposer || oThis.ic();

    const mysqlConfig = instanceComposer.getMySqlConfig();

    // looping over all databases
    for (var dbName in mysqlConfig['databases']) {
      var dbClusters = mysqlConfig['databases'][dbName];
      // looping over all clusters for the database
      for (var i = 0; i < dbClusters.length; i++) {
        var cName = dbClusters[i],
          cConfig = mysqlConfig['clusters'][cName];

        // creating pool cluster object in poolClusters map
        oThis.generateCluster(cName, dbName, cConfig, instanceComposer);
      }
    }
  },

  getPoolFor: function(dbName, nodeType, instanceComposer, clusterName) {
    const oThis = this,
      mysqlConfig = instanceComposer.getMySqlConfig();
    if (!clusterName) {
      var clusterNames = mysqlConfig['databases'][dbName];
      if (clusterNames.length > 1) {
        throw 'Multiple clusters are defined for this DB. Specify cluster name.';
      }
      clusterName = clusterNames[0];
    }
    var dbClusterName = clusterName + '.' + dbName,
      sanitizedNType = nodeType == 'slave' ? 'slave*' : 'master';
    return oThis.poolClusters[dbClusterName].of(sanitizedNType);
  },

  getPoolClustersFor: function(dbName, instanceComposer) {
    const oThis = this,
      mysqlConfig = instanceComposer.getMySqlConfig();

    var clusterPools = [],
      clusterNames = mysqlConfig['databases'][dbName];
    for (var i = 0; i < clusterNames.length; i++) {
      clusterPools.push(oThis.getPoolFor(dbName, clusterNames[i], instanceComposer, 'master'));
    }
    return clusterPools;
  },

  // creating pool cluster object in poolClusters map
  generateCluster: function(cName, dbName, cConfig, instanceComposer) {
    var oThis = this,
      mysqlConfig = instanceComposer.getMySqlConfig(),
      poolClusters = oThis.poolClusters,
      clusterName = cName + '.' + dbName;

    if (poolClusters[clusterName]) {
      logger.debug('reusing existing clusterName', clusterName);
    }

    // initializing the pool cluster obj using the commonClusterConfig
    poolClusters[clusterName] = mysql.createPoolCluster(mysqlConfig['commonClusterConfig']);

    // looping over each node and adding it to the pool cluster obj
    for (var nName in cConfig) {
      var finalConfig = Object.assign({}, cConfig[nName], mysqlConfig['commonNodeConfig'], { database: dbName });
      poolClusters[clusterName].add(nName, finalConfig);
    }

    // when a node dis-functions, it is removed from the pool cluster obj and following CB is called
    poolClusters[clusterName].on('remove', function(nodeId) {
      logger.notify('m_w_1', 'REMOVED NODE : ' + nodeId + ' in ' + clusterName);
    });
  }
};

InstanceComposer.register(MySqlWrapper, 'getMySqlPoolProvider', true);

module.exports = MySqlWrapper;
