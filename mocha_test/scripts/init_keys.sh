#!/bin/sh
DATADIR=./st-poa
ADDRESS_FILE=./new_addresses

echo "Init/Re-Init chain..."
#!/bin/bash
sh ./init_chain.sh
echo "" > $ADDRESS_FILE
echo "...Done Init"


echo "Generate new addresses..."

. ./env_vars.sh


# Utility Chain Deployer Address
echo $OST_UTILITY_DEPLOYER_PASSPHRASE > ./pw
geth --datadir "$DATADIR" account new --password ./pw >> $ADDRESS_FILE

#Ops Address
echo $OST_UTILITY_OPS_PASSPHRASE > ./pw
geth --datadir "$DATADIR" account new --password ./pw >> $ADDRESS_FILE

#Test account 1
echo "testtest" > ./pw
geth --datadir "$DATADIR" account new --password ./pw >> $ADDRESS_FILE

#Test account 2
echo "testtest" > ./pw
geth --datadir "$DATADIR" account new --password ./pw >> $ADDRESS_FILE

#Test account 3
echo "testtest" > ./pw
geth --datadir "$DATADIR" account new --password ./pw >> $ADDRESS_FILE

#Test account 4
echo "testtest" > ./pw
geth --datadir "$DATADIR" account new --password ./pw >> $ADDRESS_FILE

#Airdrop Budget Holder Address
echo $OST_AIRDROP_BUDGET_HOLDER_PASSPHRASE > ./pw
geth --datadir "$DATADIR" account new --password ./pw >> $ADDRESS_FILE

#Worker Test account 1
echo "testtest" > ./pw
geth --datadir "$DATADIR" account new --password ./pw >> $ADDRESS_FILE

echo "...New addresses generated"
cat $ADDRESS_FILE
#Invoke JS script to init addresses in various JSON files.
echo "Populate configs..."
node ./_init_addresses.js $ADDRESS_FILE
#clean-up $ADDRESS_FILE
rm $ADDRESS_FILE
echo "...configs populated"

echo "Re-Init chain with updated config..."
sh ./init_chain.sh
echo "...Done Re-Init"