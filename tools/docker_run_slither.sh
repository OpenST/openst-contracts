#!/bin/bash

script_dir_path="$(cd "$(dirname "$0")" && pwd)"
root_dir="${script_dir_path}/.."

docker pull trailofbits/eth-security-toolbox || exit 1

container=$(docker run -it -d -v "${root_dir}":/share trailofbits/eth-security-toolbox) || exit 1

docker exec -it "${container}" bash -c \
    "   cd /share \
     && solc-select 0.5.7 \
     && slither . \
        --config-file slither.conf.json \
    "
slither_result=$?

docker kill "${container}" || exit 1

exit ${slither_result}
