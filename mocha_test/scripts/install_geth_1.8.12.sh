#!/bin/bash
curl https://gethstore.blob.core.windows.net/builds/geth-linux-amd64-1.8.12-37685930.tar.gz | tar xvz
mv geth-linux-amd64-1.8.12-37685930 /usr/local/bin
ln -s /usr/local/bin/geth-linux-amd64-1.8.12-37685930/geth /usr/local/bin/geth
export PATH="$PATH:/usr/local/bin/geth-linux-amd64-1.8.12-37685930"