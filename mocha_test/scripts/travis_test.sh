#!/bin/bash
sh start_test_chain.sh
sh deploy_all.sh
. ./env_vars.sh
node ./../../migrations/create_tables.js
node ./../../migrations/alter_table_for_chain_id_column.js
./../../node_modules/mocha/bin/mocha  ./../../mocha_test/services/pricer/*.js ./../../mocha_test/services/airdrop/*.js ./../../mocha_test/services/workers/_is_worker.js ./../../mocha_test/services/workers/_remove_worker.js ./../../mocha_test/services/workers/_set_worker.js ./../../mocha_test/services/workers/remove.js --exit

# run worker test at last, and in the following sequence as in the test case it removes the worker contract that is needed for other tests.
# 1. _is_worker.js
# 2. _remove_worker.js
# 3. _set_worker.js
# 4. remove.js