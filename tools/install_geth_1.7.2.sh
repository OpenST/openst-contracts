#!/bin/bash
curl https://gethstore.blob.core.windows.net/builds/geth-linux-amd64-1.7.2-1db4ecdc.tar.gz | tar xvz
mv geth-linux-amd64-1.7.2-1db4ecdc /usr/local/bin
ln -s /usr/local/bin/geth-linux-amd64-1.7.2-1db4ecdc/geth /usr/local/bin/geth
export PATH="$PATH:/usr/local/bin/geth-linux-amd64-1.7.2-1db4ecdc"