# Nuxt 3.13.0 Boilerplate with Basic example

Look at the [Nuxt 3 documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

- copy `.env.example` to `.env`. (skip if already done)

## .env.example

- copy `.env.example` to `.env`.

```
MODE=development
BASE_URL=
```

- `MODE`: This will indicate application state.
- `BASE_URL`: You can specify your application URL.

Make sure to install the dependencies:

```bash
# npm
npm install

```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

```

Start your Nuxt app in development mode:

```bash
# npm
npm run dev -- -o

```

## Production

Build the application for production:

```bash
# npm
npm run build

```

Locally preview production build:

```bash
# npm
npm run preview
```

## eslint,prettier,stylint

For linting

```bash
# npm
npm run lint
```

For lint fix

```bash
# npm
npm run lint:fix
```

## for testcase run

```
npm run test
```

## Pre commit hook will be auto lint fix when add commit

## For Details Describes in [DETAILS.md](https://github.com/Improwised/nuxt3-boilerplate/blob/main/app/Details.md)
