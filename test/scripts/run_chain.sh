#!/bin/bash

DATADIR=./st-poa
LOCAL_NETWORK_ID="--networkid 20171010"

geth --datadir "$DATADIR" $LOCAL_NETWORK_ID --port 30301 --rpcport 9546 --ws --wsport 19546 --wsorigins "*" --gasprice 0 --targetgaslimit 100000000 --etherbase 0 --unlock 0 --password pw --rpc --maxpeers 0 --mine --minerthreads 4 --rpcapi net,eth,web3,personal
