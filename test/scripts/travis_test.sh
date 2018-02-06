sh contracts/compile.sh
cd /test/scripts
sh start_test_chain.sh
sh deploy_all.sh
./../../node_modules/mocha/bin/mocha  ./../../test/services/pricer