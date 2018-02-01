
cd ..
source scripts/set_env_vars.sh
node ../tools/deploy/EIP20TokenMock.js 5 DKN deepeshCoin 18

source scripts/set_env_vars.sh
node ../tools/deploy/pricer.js $OST_PRICER_BT_CONTRACT_ADDR

source scripts/set_env_vars.sh
cd scripts

export OST_PO_GETH_RPC_PROVIDER=$OST_PRICER_GETH_RPC_PROVIDER
export OST_PO_DEPLOYER_ADDR=$OST_PRICER_DEPLOYER_ADDR
export OST_PO_DEPLOYER_PASSPHRASE=$OST_PRICER_DEPLOYER_PASSPHRASE
export OST_PO_OPS_ADDR=$OST_PRICER_OPS_ADDR
export OST_PO_OPS_PASSPHRASE=$OST_PRICER_OPS_PASSPHRASE
export OST_PO_PRICE_ORACLES='{}'

sh deploy_price_oracle.sh

