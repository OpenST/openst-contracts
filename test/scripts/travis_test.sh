#!/bin/bash
sh start_test_chain.sh
sh deploy_all.sh
. ./env_vars.sh
./../../node_modules/mocha/bin/mocha  ./../../test/services/pricer