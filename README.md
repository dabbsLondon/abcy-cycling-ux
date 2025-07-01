# ABCY Cycling UX

This repository contains a simple React project that displays **Hello World**. It uses [Vite](https://vitejs.dev/) for building and [Yarn](https://yarnpkg.com/) as its package manager.

## Prerequisites

Make sure you have Node.js 20 or later installed. Yarn is managed via [Corepack](https://nodejs.org/api/corepack.html), so run the following once to activate the correct Yarn version (as defined in `package.json`):

```bash
corepack enable
```

## Getting Started

### Install dependencies

```bash
yarn install --frozen-lockfile
```

### Development server

```bash
yarn dev
```

Open [http://localhost:5173](http://localhost:5173) to view the page.

### Build

```bash
yarn build
```

The built assets are generated in the `dist` directory.

### Run tests

```bash
yarn test --run
```

### Docker

Build the Docker image and run the container:

```bash
docker build -t abcy-cycling-ux .
docker run -p 3000:3000 abcy-cycling-ux
```

The app will be accessible at [http://localhost:3000](http://localhost:3000).

## GitHub Actions

A workflow located at `.github/workflows/ci.yml` installs dependencies, builds the project and runs tests on every push and pull request.

