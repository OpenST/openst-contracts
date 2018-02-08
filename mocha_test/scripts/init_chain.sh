#!/bin/bash
DATADIR=./st-poa

mkdir -p "$DATADIR"

rm -rf "$DATADIR/geth"

geth --datadir "$DATADIR" init poa-genesis.json

