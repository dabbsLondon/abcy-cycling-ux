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
Because Yarn is managed via Corepack, the workflow enables Corepack before installing Node so the correct Yarn version is used when caching dependencies.

## API Endpoints

The frontend expects a few JSON endpoints under `/api`. Below are example responses so client developers know what to expect.

### `GET /api/wkg/history?count=20`
Returns recent W/kg values with the newest entry first.

```json
[
  { "wkg": 3.6 },
  { "wkg": 3.5 },
  { "wkg": 3.4 }
]
```

### `GET /api/enduro`
Returns the current enduro score.

```json
{ "enduro": 56 }
```

### `GET /api/fitness`
Returns the current fitness score.

```json
{ "fitness": 42 }
```

### `GET /api/stats?period=week&count=8`
Provides aggregate statistics for the requested period. Fields may include total distance in meters, training stress score and intensity factor.

```json
[
  {
    "period": "2024-W12",
    "totalDistance": 42000,
    "totalTrainingStress": 300,
    "averageIntensityFactor": 0.85
  },
  {
    "period": "2024-W11",
    "totalDistance": 39000,
    "totalTrainingStress": 280,
    "averageIntensityFactor": 0.82
  }
]
```

### `GET /api/activity/{id}/summary`
Returns a summary of a single ride. A `trend` object compares each metric to the rider's past 90 days. Elevation gain is provided in **meters**. Each value is one of `very_low`, `low`, `normal`, `high` or `very_high` based on standard deviation bands:

* `very_high` >= mean + 1.5*stdev
* `high` >= mean + 0.5*stdev
* `normal` within ±0.5*stdev
* `low` <= mean - 0.5*stdev
* `very_low` <= mean - 1.5*stdev

```json
{
  "distance": 40500,
  "total_elevation_gain": 520,
  "moving_time": 4300,
  "average_speed": 8.5,
  "max_speed": 16.2,
  "training_stress_score": 160,
  "intensity_factor": 0.92,
  "normalized_power": 310,
  "trend": {
    "avg_speed": "very_high",
    "max_speed": "normal",
    "tss": "high",
    "intensity": "high",
    "power": "high"
  }
}
```

