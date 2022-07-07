## Why this plugin

In the context of a Yarn 2+ monorepo with workspaces, you are supposed to have only one top-level `yarn.lock` file at the root of your monorepo.

You cannot create `yarn.lock` at package level, because they will be isolated from the rest of the monorepo, defeating the purpose of workspaces and disabling package hoisting.

Yet, you may need to generate individual lockfiles when publishing your packages, especially when they are applications or repos that may be published
in individual read-only repositories.

See https://github.com/yarnpkg/berry/issues/1223 for more details.

## Install

- `yarn plugin import https://raw.githubusercontent.com/JanVoracek/yarn-plugin-entrypoint-lockfiles/main/bundles/%40yarnpkg/plugin-entrypoint-lockfiles.js`
- In `package.json`, add `workspaces.entrypoints` pointing to your packages that needs their own `yarn.lock`.

Example:
```json
"workspaces": {
    "packages": [
      "packages/*",
      "starters/*",
      "docusaurus"
    ],
    "entrypoints": [
      "starters/remix",
      "starters/next",
      "starters/express"
    ]
  },
```
Eeach folder listed in `entrypoints` must have a `package.json`, it will be used to compute their dependencies.

## Run

Simply run `yarn`: you'll see a few lockfiles popping out at the root of your project.
You can use those lockfiles as you wish, for example copying them in each folder at publish time.
