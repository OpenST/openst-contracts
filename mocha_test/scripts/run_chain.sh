#!/bin/bash

DATADIR=/Users/Deepesh/Documents/SimpleToken/workspace/openst-payments/mocha_test/scripts/st-poa
LOCAL_NETWORK_ID="--networkid 20171010"

geth --datadir "$DATADIR" $LOCAL_NETWORK_ID --port 30301 --rpcport 9546 --rpcapi net,eth,web3,personal --wsapi net,eth,web3,personal --ws --wsport 19546 --wsorigins "*" --gasprice 0 --targetgaslimit 100000000 --etherbase 0 --unlock 0 --password pw --rpc --maxpeers 0 --mine --minerthreads 4
