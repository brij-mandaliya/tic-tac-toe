### Detail about Nuxt Folder

### tsconfig.json

- This file contains the recommended basic TypeScript configuration for your project, including resolved aliases injected by Nuxt or modules you are using.

# package.json

- it contains the dependencies of the application. Each pacakges and command describe as below

```
{
  "name": "nuxt-app", // read more about https://docs.npmjs.com/cli/v10/configuring-npm/package-json
  "type": "module",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "prepare": "npx simple-git-hooks",  //Readmore: https://nuxt.com/docs/api/commands/prepare
    "build": "nuxt build",  //Readmore: https://nuxt.com/docs/api/commands/build
    "dev": "nuxt dev", //Readmore: https://nuxt.com/docs/api/commands/dev
    "generate": "nuxt generate",  //Readmore: https://nuxt.com/docs/api/commands/generate
    "preview": "nuxt preview",  //Readmore: https://nuxt.com/docs/api/commands/preview
    "postinstall": "nuxt prepare",
    "lint": "eslint . && stylelint '**/*.css'", // for linting and css lint
    "lint:fix": "eslint . --fix && stylelint '**/*.css' --fix" // for fix linting and fix css lint
    "test": "vitest run" // for testcase
  },
  "dependencies": {
    "@nuxt/content": "^2.13.2", // Nuxt module example https://github.com/nuxt/content
    "@nuxt/image": "^1.7.1", // https://image.nuxt.com/get-started/installation
    "@pinia/nuxt": "^0.5.4", // for store management
    "@vueuse/core": "^11.0.3",  // default provided by nuxt
    "bootstrap": "^5.2.3",  // Boostrap css framewok
    "nuxt": "^3.13.0",
    "vue": "latest" // default provided by nuxt
  },
  "devDependencies": {
    "@antfu/eslint-config": "^3.0.0", // for eslint and prettier
    "@nuxt/test-utils": "^3.14.1", // For testcases https://nuxt.com/docs/getting-started/testing
    "@vue/test-utils": "^2.4.6",  // For testcases https://nuxt.com/docs/getting-started/testing
    "eslint": "^9.9.1", // For eslint and prettier https://github.com/antfu/eslint-config
    "happy-dom": "^14.12.3", // For testcases https://nuxt.com/docs/getting-started/testing
    "simple-git-hooks": "^2.11.1", // for precommit eslint and stylint fix
    "stylelint": "^16.9.0", // for style block and css lint
    "stylelint-config-standard": "^36.0.1"   // for style block and css lint
    "vitest": "^2.0.5"
  },
  "overrides": {
    "vue": "latest" // for pinia as per mention https://pinia.vuejs.org/ssr/nuxt.html
  },
  "simple-git-hooks": {
    "pre-commit": "cd app && npm run lint:fix" // precommit hooks https://github.com/toplenboren/simple-git-hooks
  }
}

```

## Other Configuration file

Please check .eslintrc.js,tsconfig.ts,vitest.config.ts,plugins folder/files

# For understading other Nuxt Directory Structure visit the below link

https://nuxt.com/docs/guide/directory-structure/app
