sh start_test_chain.sh
sh deploy_all.sh
source env_vars.sh
./../../node_modules/mocha/bin/mocha  ./../../test/services/pricer