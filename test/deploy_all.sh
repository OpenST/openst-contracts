
source set_env_vars.sh
node ../tools/deploy/EIP20TokenMock.js 5 DKN deepeshCoin 18

source set_env_vars.sh
echo $OST_PRICER_BT_CONTRACT_ADDR
node ../tools/deploy/pricer.js $OST_PRICER_BT_CONTRACT_ADDR


