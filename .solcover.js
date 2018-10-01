module.exports = {
    port: 8555,
    compileCommand: '../node_modules/.bin/truffle compile',
    testCommand: '../node_modules/.bin/truffle test --network coverage',
    skipFiles: ['truffle/Migrations.sol']
};