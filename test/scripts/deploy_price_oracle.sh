git clone git@github.com:OpenSTFoundation/ost-price-oracle.git
cd ost-price-oracle
git checkout develop
git pull --rebase
sh contracts/compile.sh 
node tools/deploy/price_oracle.js OST USD 0x12A05F200



