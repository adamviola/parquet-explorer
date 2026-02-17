#!/bin/bash

# Clear previous builds
rm -rf ./dist
mkdir ./dist

# Targets to build against
targets=(
    "win32-x64"
    # "win32-arm64" # Not yet supported by DuckDB.
    "linux-x64"
    "linux-arm64"
    # "linux-armhf" # Not yet supported by DuckDB.
    "darwin-x64"
    "darwin-arm64"
    # "alpine-x64" # Not yet supported by DuckDB.
    # "alpine-arm64" # Not yet supported by DuckDB.
)

for p in ${targets[@]}; do
    platform=$(echo $p | cut -d "-" -f 1)
    arch=$(echo $p | cut -d "-" -f 2)

    # Download the right DuckDB binary for this target
    ./node_modules/@mapbox/node-pre-gyp/bin/node-pre-gyp install --directory ./node_modules/duckdb --target_platform=$platform --target_arch=$arch --update-binary || exit 1

    # Package extension
    vsce package --target $platform-$arch --out ./dist || exit 1
done
