#!/bin/bash

script_dir_path="$(cd "$(dirname "$0")" && pwd)"
root_dir="${script_dir_path}/../.."

echo "Switching to root directory."
cd "${root_dir}" || exit 1

echo "Executing \"npm pack\"."
npm pack || exit 1

echo "Switching back to the script directory."
cd "${script_dir_path}" || exit 1

echo "Retrieving package version."
version=$(jq '.version' <"${root_dir}/package.json")
temp="${version%\"}"
version="${temp#\"}"
[[ "${version}" == "null" ]] && exit 1

echo "Copying npm tarball into the test directory."
cp "${root_dir}/openstfoundation-openst-contracts-${version}.tgz" . || exit 1

echo "Initiating npm project for test."
npm init -y || exit 1
npm install assert || exit 1

echo "Installing openst-contract npm package into newly created project."
npm install "openstfoundation-openst-contracts-${version}.tgz" || exit 1

echo "Running ${script_dir_path}/index.js"
node "${script_dir_path}/index.js" || exit 1

echo "Cleaning up generated files."
rm -r "${script_dir_path}/node_modules" || exit 1
rm openstfoundation-openst-contracts-0.10.0-beta.2.tgz || exit 1
rm package.json || exit 1
rm package-lock.json || exit 1

echo "Successully Passed."
