#git clone git@github.com:OpenSTFoundation/ost-price-oracle.git
#cd ost-price-oracle
#git checkout abhay/mocha_test
#git pull --rebase
#sh contracts/compile.sh 
#node tools/deploy/price_oracle.js OST USD 0x12A05F200 travis po_ost_usd.txt
#set /p PO_OST_USD_0.5=<po_ost_usd.txt
#echo PO_OST_USD_0=$PO_OST_USD_0
#export PO_OST_USD_0.5=$PO_OST_USD_0.5
#node test/scripts/set_price.js OST USD 0.5 0x12A05F200

echo "\n********* Preparing price oracle deployment *************"
git clone git@github.com:OpenSTFoundation/ost-price-oracle.git
cd ost-price-oracle
git stash
git checkout abhay/mocha_test
git pull --rebase
cd .. 
npm install ./ost-price-oracle
echo "\n********* Done *************"

echo "\n********* Deploying PO 1 *************"
node ./ost-price-oracle/tools/deploy/price_oracle.js OST USD 0x12A05F200 travis po1.txt
echo "\n********* Done *************"
echo "\n********* Deploying PO 2 *************"
node ./ost-price-oracle/tools/deploy/price_oracle.js OST EUR 0x12A05F200 travis po2.txt
echo "\n********* Done *************"
echo "\n********* Deploying PO 3 *************"
node ./ost-price-oracle/tools/deploy/price_oracle.js OST INR 0x12A05F200 travis po3.txt
echo "\n********* Done *************"
echo "\n********* Deploying PO 4 *************"
node ./ost-price-oracle/tools/deploy/price_oracle.js ETH USD 0x12A05F200 travis po4.txt
echo "\n********* Done *************"

export OST_PO_PRICE_ORACLES="{\"OST\":{\"USD\":\"$(cat ./ost-price-oracle/tools/deploy/po1.txt)\",\"EUR\":\"$(cat ./ost-price-oracle/tools/deploy/po2.txt)\",\"INR\":\"$(cat ./ost-price-oracle/tools/deploy/po3.txt)\"}, \"ETH\":{\"USD\":\"$(cat ./ost-price-oracle/tools/deploy/po4.txt)\"}}"
echo OST_PO_PRICE_ORACLES=$OST_PO_PRICE_ORACLES

node ./ost-price-oracle/test/scripts/set_price.js OST USD 0.5 0x12A05F200
node ./ost-price-oracle/test/scripts/set_price.js OST EUR 0.2 0x12A05F200
node ./ost-price-oracle/test/scripts/set_price.js ETH USD 20.2 0x12A05F200

rm ./ost-price-oracle/tools/deploy/po1.txt
rm ./ost-price-oracle/tools/deploy/po2.txt
rm ./ost-price-oracle/tools/deploy/po3.txt
rm ./ost-price-oracle/tools/deploy/po4.txt


