rm -rf ./dist
mkdir ./dist

# Package Linux x64
./node_modules/@mapbox/node-pre-gyp/bin/node-pre-gyp install --directory ./node_modules/duckdb --target_platform=linux --target_arch=x64 --update-binary
vsce package --target linux-x64 --out ./dist

# Package OSX ARM
./node_modules/@mapbox/node-pre-gyp/bin/node-pre-gyp install --directory ./node_modules/duckdb --target_platform=darwin --target_arch=arm64 --update-binary
vsce package --target darwin-arm64 --out ./dist

