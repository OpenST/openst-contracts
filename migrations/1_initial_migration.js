const Migrations = artifacts.require('./Migrations.sol');

module.exports = () => {
    deployer.deploy(Migrations);
};
