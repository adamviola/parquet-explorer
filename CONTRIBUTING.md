# Contributing to "Flat File Viewer"

## Dev Environment Setup

1. Clone repo. Open in VSCode.
2. Install "nvm".
3. `nvm install` and `nvm use`. This will install and use the version of Node.js specified in the `.nvmrc` file.
    * `nvm` quirk: You must run `nvm use` every time you open a new terminal window, or add `nvm use` to your shell profile.
4. Check installed/activated version: `node --version` should show the same version as in `.nvmrc`.
5. `npm install`
6. Open the `src/extensions.ts` file.
7. Press F5 in VSCode to launch the extension in the VSCode Extension Development Host.
8. In the temporary testing window, press Ctrl+Shift+I to open Inspect Element/Dev Tools. The Console there is the best debugging tool.

## Publishing a Release

```bash
git tag v2.x.x
git push origin v2.x.x
# GitHub Action takes care of the rest, including updating the version number, publishing, and GitHub Release.
```

## Publishing a Release (Manually)

1. Update the version number in `package.json`.
2. Package all release versions: `./package.sh`
3. Publish the release to the VSCode Marketplace: `vsce publish --packagePath dist/*.vsix`
4. Add a GitHub Release, attaching the build products (`dist/*.vsix`).
