#!/bin/bash
sh start_test_chain.sh
sh deploy_all.sh
. ./env_vars.sh
#./../../node_modules/mocha/bin/mocha  ./../../mocha_test/services/pricer
#./../../node_modules/mocha/bin/mocha  ./../../mocha_test/services/workers
./../../node_modules/mocha/bin/mocha  ./../../mocha_test/services/airdrop