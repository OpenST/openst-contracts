#!/bin/bash
cat poa-genesis-template.json>poa-genesis.json
cat set_env_vars.sh>env_vars.sh
. ./env_vars.sh
sh init_keys.sh
sh init_chain.sh
nohup sh run_chain.sh </dev/null >/dev/null 2>&1 &
node ./geth_checker.js

