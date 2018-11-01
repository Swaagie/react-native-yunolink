react-native-yunolink
=====================

Workaround for using symlinks in React Native.

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/react-native-yunolink.svg)](https://npmjs.org/package/react-native-yunolink)
[![Downloads/week](https://img.shields.io/npm/dw/react-native-yunolink.svg)](https://npmjs.org/package/react-native-yunolink)
[![License](https://img.shields.io/npm/l/react-native-yunolink.svg)](https://github.com/Swaagie/react-native-yunolink/blob/master/package.json)

# Usage

Install the module globally.

```bash
npm install -g react-native-yunolink
```

and execute it in the root of a repository where you want to use the targetted Node.JS module(s). It supports
multiple targets by separating each path with a whitespace. In addition this will temporarily update the
`watchFolders` property in `metro.config.js` to force Metro bundler to also watch your targetted modules.

```bash
rn-link [...targets]

rn-link ../myModule1 ../myModule2
```

Or alternatively install the module as `devDependency`.

```bash
npm install -D react-native-yunolink
```

And watch and copy the module from your `package.json` by adding a `scripts` command.

```json
"scripts": {
  "watch-modules": "rn-link ../myModule1 ../myModule2"
}
```

Run it with `npm run watch-myModule`.

## Commands

There are not specific commands other than `-v` for the version or `-h` for help and a description. 
Do make sure you always provide a `[...targets]` to `rn-link`.

## Module tree

This module operates under the assumption `npm` or `yarn` dedupe `node_modules` to the root of your app. 
The `node_modules` of the synced target will be excluded. This will prevent `@ProvidesModule` errors in metro
bundler.

