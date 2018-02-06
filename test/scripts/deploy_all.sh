
cd ..
sh ../contracts/compile.sh
source scripts/env_vars.sh

echo "\n********* Deploying test coin 1 *************"
node ../tools/deploy/EIP20TokenMock.js 5 TC1 TestCoin1 18 0x12A05F200 travis tc1.txt
export TEST_COIN1_C5_ADDRESS=$(cat ../tools/deploy/tc1.txt)
rm ../tools/deploy/tc1.txt
#TO_DO: Write this to scripts/env_vars.sh
echo "\n********* Done *************"

echo "\n********* Deploying test coin 2 *************"
source scripts/env_vars.sh
node ../tools/deploy/EIP20TokenMock.js 2 TC2 TestCoin2 18 0x12A05F200 travis tc2.txt
export TEST_COIN2_C2_ADDRESS=$(cat ../tools/deploy/tc2.txt)
rm ../tools/deploy/tc2.txt
#TO_DO: Write this to scripts/env_vars.sh
echo "\n********* Done *************"

echo "\n********* Deploying Pricer 1 *************"
source scripts/env_vars.sh
node ../tools/deploy/pricer.js $TEST_COIN1_C5_ADDRESS OST 0x12A05F200 travis tp1.txt
export TEST_PRICER_C5_ADDRESS=$(cat ../tools/deploy/tp1.txt)
rm ../tools/deploy/tp1.txt
#TO_DO: Write this to scripts/env_vars.sh
echo "\n********* Done *************"

echo "\n********* Deploying Pricer 2 *************"
source scripts/env_vars.sh
node ../tools/deploy/pricer.js $TEST_COIN2_C2_ADDRESS OST 0x12A05F200 travis tp2.txt
export TEST_PRICER_C2_ADDRESS=$(cat ../tools/deploy/tp2.txt)
rm ../tools/deploy/tp2.txt
#TO_DO: Write this to scripts/env_vars.sh
echo "\n********* Done *************"


echo "\n********* Setting env variables *************"
source scripts/env_vars.sh
cd scripts

export OST_PO_GETH_RPC_PROVIDER=$OST_PRICER_GETH_RPC_PROVIDER
export OST_PO_DEPLOYER_ADDR=$OST_PRICER_DEPLOYER_ADDR
export OST_PO_DEPLOYER_PASSPHRASE=$OST_PRICER_DEPLOYER_PASSPHRASE
export OST_PO_OPS_ADDR=$OST_PRICER_OPS_ADDR
export OST_PO_OPS_PASSPHRASE=$OST_PRICER_OPS_PASSPHRASE
export OST_PO_PRICE_ORACLES='{}'

echo "\n********* Done *************"

sh deploy_price_oracle.sh

