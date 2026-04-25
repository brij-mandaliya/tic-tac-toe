# Management UI with Nuxt 3.13.0

Look at the [Nuxt 3 documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Installation

- Node.js - v20.13.1 or newer

## Setup

```bash
# clone repo
git clone git@github.com:Improwised/nuxt3-boilerplate.git
```

## Build Setup

For UI everything is under /app/ folder, so go to /app/ folder.

* Go to `/app/` folder.


## MORE DETAILS :

[README.md](https://github.com/Improwised/nuxt3-boilerplate/blob/main/app/README.md) && [DETAILS.md](https://github.com/Improwised/nuxt3-boilerplate/blob/main/app/Details.md)


## App Included Packages

-    Pinia: For store management
-    Bootstrap: Fot styling use Boostrap css framewok
-    Eslint : for eslint and prettier
-    Simple-git-hooks :  for precommit eslint and stylint fix
-    Vitest && Nuxt/test-utils : For Test cases
-    Nuxt/content : For nuxt module


## Other Tool if need JSON Server

[Documentation](https://github.com/typicode/json-server)

json server run
```
npx json-server --watch data/db.json --port 5000
```

## Run via Docker

```docker-compose up --build```

It will run nuxt application and json-server for fake REST API (https://www.npmjs.com/package/json-server)
