#!/bin/bash
curl https://gethstore.blob.core.windows.net/builds/geth-linux-arm64-1.8.8-2688dab4.tar.gz | tar xvz
mv geth-linux-arm64-1.8.8-2688dab4 /usr/local/bin
ln -s /usr/local/bin/geth-linux-arm64-1.8.8-2688dab4/geth /usr/local/bin/geth
export PATH="$PATH:/usr/local/bin/geth-linux-arm64-1.8.8-2688dab4"




