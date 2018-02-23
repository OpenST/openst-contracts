
#!/bin/bash
cd ..
sh ../contracts/compile.sh
. ./scripts/env_vars.sh

echo "\n********* Deploying test coin 1 *************"
node ../tools/deploy/EIP20TokenMock.js 5 TC1 TestCoin1 18 0x12A05F200 travis tc1.txt
export OST_UTILITY_TEST_COIN1_C5_ADDRESS=$(cat ../lib/tc1.txt)
echo '\nexport OST_UTILITY_TEST_COIN1_C5_ADDRESS='\'$OST_UTILITY_TEST_COIN1_C5_ADDRESS\'>>scripts/env_vars.sh
rm ../lib/tc1.txt
echo "\n********* Done *************"

echo "\n********* Deploying test coin 2 *************"
. ./scripts/env_vars.sh
node ../tools/deploy/EIP20TokenMock.js 2 TC2 TestCoin2 18 0x12A05F200 travis tc2.txt
export OST_UTILITY_TEST_COIN2_C2_ADDRESS=$(cat ../lib/tc2.txt)
echo '\nexport OST_UTILITY_TEST_COIN2_C2_ADDRESS='\'$OST_UTILITY_TEST_COIN2_C2_ADDRESS\'>>scripts/env_vars.sh
rm ../lib/tc2.txt
echo "\n********* Done *************"

echo "\n********* Deploying test coin 3 *************"
. ./scripts/env_vars.sh
node ../tools/deploy/EIP20TokenMock.js 3 TC3 TestCoin3 10 0x12A05F200 travis tc3.txt
export OST_UTILITY_TEST_COIN3_C3_ADDRESS=$(cat ../lib/tc3.txt)
echo '\nexport OST_UTILITY_TEST_COIN3_C3_ADDRESS='\'$OST_UTILITY_TEST_COIN3_C3_ADDRESS\'>>scripts/env_vars.sh
rm ../lib/tc3.txt
echo "\n********* Done *************"


echo "\n********* Deploying Pricer 1 *************"
. ./scripts/env_vars.sh
node ../tools/deploy/pricer.js $OST_UTILITY_TEST_COIN1_C5_ADDRESS OST 0x12A05F200 travis tp1.txt
export OST_UTILITY_TEST_PRICER_C5_ADDRESS=$(cat ../lib/tp1.txt)
echo '\nexport OST_UTILITY_TEST_PRICER_C5_ADDRESS='\'$OST_UTILITY_TEST_PRICER_C5_ADDRESS\'>>scripts/env_vars.sh
rm ../lib/tp1.txt
echo "\n********* Done *************"

echo "\n********* Deploying Pricer 2 *************"
. ./scripts/env_vars.sh
node ../tools/deploy/pricer.js $OST_UTILITY_TEST_COIN2_C2_ADDRESS OST 0x12A05F200 travis tp2.txt
export OST_UTILITY_TEST_PRICER_C2_ADDRESS=$(cat ../lib/tp2.txt)
echo '\nexport OST_UTILITY_TEST_PRICER_C2_ADDRESS='\'$OST_UTILITY_TEST_PRICER_C2_ADDRESS\'>>scripts/env_vars.sh
rm ../lib/tp2.txt
echo "\n********* Done *************"

echo "\n********* Deploying Pricer 3 *************"
. ./scripts/env_vars.sh
node ../tools/deploy/pricer.js $OST_UTILITY_TEST_COIN3_C3_ADDRESS OST 0x12A05F200 travis tp3.txt
export OST_UTILITY_TEST_PRICER_C3_ADDRESS=$(cat ../lib/tp3.txt)
echo '\nexport OST_UTILITY_TEST_PRICER_C3_ADDRESS='\'$OST_UTILITY_TEST_PRICER_C3_ADDRESS\'>>scripts/env_vars.sh
rm ../lib/tp3.txt
echo "\n********* Done *************"

echo "\n********* Deploying Worker Contract Address *************"
node ../tools/deploy/workers.js 0x12A05F200 travis w1.txt
export OST_UTILITY_WORKER_CONTRACT_ADDRESS=$(cat ../lib/w1.txt)
echo '\nexport OST_UTILITY_WORKER_CONTRACT_ADDRESS='\'$OST_UTILITY_WORKER_CONTRACT_ADDRESS\'>>scripts/env_vars.sh
rm ../lib/w1.txt
echo "\n********* Done *************"

echo "\n Sourcing env_vars again"
. ./scripts/env_vars.sh

echo "\n********* Deploying Airdrop Contract Address *************"
. ./scripts/env_vars.sh
node ../tools/deploy/airdrop.js $OST_UTILITY_TEST_COIN1_C5_ADDRESS OST $OST_UTILITY_WORKER_CONTRACT_ADDRESS $OST_AIRDROP_BUDGET_HOLDER 0x12A05F200 travis ad1.txt
export OST_UTILITY_TEST_AIRDROP1_CONTRACT_ADDRESS=$(cat ../lib/ad1.txt)
echo '\nexport OST_UTILITY_TEST_AIRDROP1_CONTRACT_ADDRESS='\'$OST_UTILITY_TEST_AIRDROP1_CONTRACT_ADDRESS\'>>scripts/env_vars.sh
rm ../lib/ad1.txt
echo "\n********* Done *************"


echo "\n********* Setting env variables *************"
. ./scripts/env_vars.sh
cd scripts

export OST_UTILITY_PRICE_ORACLES='{}'
export OST_UTILITY_CHAIN_ID=$OST_UTILITY_CHAIN_ID
export OST_CACHING_ENGINE='none'

echo '\nexport OST_UTILITY_PRICE_ORACLES='\'$OST_UTILITY_PRICE_ORACLES\'>>env_vars.sh
echo '\nexport OST_UTILITY_CHAIN_ID='\'$OST_UTILITY_CHAIN_ID\'>>env_vars.sh
echo '\nexport OST_CACHING_ENGINE='\'$OST_CACHING_ENGINE\'>>env_vars.sh


echo "\n********* Done *************"

sh deploy_price_oracle.sh

