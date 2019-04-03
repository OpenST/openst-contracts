#!/bin/bash

script_dir_path="$(cd "$(dirname "$0")" && pwd)"
root_dir="${script_dir_path}/.."

container=$(docker run -it -d -v "${root_dir}":/share trailofbits/eth-security-toolbox) || exit 1

docker exec -it "${container}" bash -c \
    "   cd /share \
     && solc-select 0.5.0 \
     && slither . \
        --exclude-low \
        --exclude-informational \
        --exclude incorrect-equality,locked-ether \
    "
slither_result=$?

docker kill "${container}" || exit 1

exit $slither_result
