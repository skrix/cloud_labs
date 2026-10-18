# IoT Hub API

REST API for registering ESP32 devices and collecting their sensor readings.
Node 24, Express 5, Sequelize 6, PostgreSQL.

## Run locally

```sh
npm install
npm run db:migrate     # creates the tables
npm run dev            # restarts on file changes; use `npm start` in production
```

- API: http://localhost:3000/api
- Swagger UI: http://localhost:3000/docs (spec in `api/openapi.yaml`)

Lint and tests:

```sh
npm run lint
npm test     # node:test; no database needed
```

## Environment variables

| Variable     | Required | Description                                               |
|--------------|----------|-----------------------------------------------------------|
| `PGHOST`     | yes      | PostgreSQL host                                           |
| `PGPORT`     | no       | PostgreSQL port, default `5432`                           |
| `PGUSER`     | yes      | PostgreSQL user                                           |
| `PGPASSWORD` | yes      | PostgreSQL password                                       |
| `PGDATABASE` | yes      | PostgreSQL database                                       |
| `JWT_SECRET` | yes      | Secret for signing JWTs; the app does not start without it |
| `PORT`       | no       | HTTP port, default `3000`                                 |
| `NODE_ENV`   | no       | `production` turns off SQL logging and requires SSL to the database |

## Migrations

Migrations are not run by the app. Run them before starting a new version:

```sh
npm run db:migrate
npm run db:migrate:undo   # roll back the last one
```

## Demo data

```sh
npm run db:seed        # safe to run again; readings are recreated relative to now
npm run db:seed:undo   # removes the demo users, devices and firmwares
```

Refuses to run with `NODE_ENV=production`.

| Email               | Password     | Role  | Devices (API key)                                       |
|---------------------|--------------|-------|---------------------------------------------------------|
| `admin@example.com` | `admin12345` | admin | none                                                    |
| `alice@example.com` | `alice12345` | user  | Kitchen sensor (`demo-key-kitchen`), Balcony sensor (`demo-key-balcony`) |
| `bob@example.com`   | `bob12345`   | user  | Garage sensor (`demo-key-garage`)                       |

Catalog: ESP32 DevKitC (firmwares 1.0.0, 1.1.0), ESP32-S3 DevKit (2.0.0), ESP32-C3 SuperMini (no firmwares,
so it can be deleted). Each user device has hourly readings for the last 72 hours.

## Promote a user to admin

There is no API to create an admin. Sign up normally, then run:

```sql
UPDATE "Users" SET role = 'admin' WHERE email = 'someone@example.com';
```

The role is stored in the JWT, so the user must sign in again to get an admin token.

## Endpoints

All under `/api`. **auth** = `Authorization: Bearer <token>`. **admin** = auth with role `admin`.
Errors always look like `{ "error": "message" }`.

| Method | Path                                | Access | Notes                                             |
|--------|-------------------------------------|--------|---------------------------------------------------|
| GET    | `/health`                           | public | No database; for the load balancer                |
| GET    | `/health/db`                        | public | `503` if the database is unreachable              |
| POST   | `/auth/signup`                      | public | `{ email, password }`, password ≥ 8 chars         |
| POST   | `/auth/signin`                      | public | Returns `{ token }`, valid 1 hour                 |
| GET    | `/devices`                          | auth   | Device catalog                                    |
| GET    | `/devices/:id`                      | auth   | Includes its firmwares                            |
| POST   | `/devices`                          | admin  | `{ name, chip?, description? }`                   |
| PATCH  | `/devices/:id`                      | admin  |                                                   |
| DELETE | `/devices/:id`                      | admin  | `409` while firmwares or user devices use it      |
| GET    | `/firmwares?deviceId=`              | auth   | Optional filter                                   |
| GET    | `/firmwares/:id`                    | auth   |                                                   |
| POST   | `/firmwares`                        | admin  | `{ deviceId, version, releaseNotes? }`            |
| PATCH  | `/firmwares/:id`                    | admin  | `version`, `releaseNotes`                         |
| DELETE | `/firmwares/:id`                    | admin  | User devices on it get `firmwareId = null`        |
| GET    | `/user-devices`                     | auth   | Only the caller's devices                         |
| GET    | `/user-devices/:id`                 | auth   | Includes Device and Firmware                      |
| POST   | `/user-devices`                     | auth   | `{ name, deviceId, firmwareId? }`, returns `{ userDevice, apiKey }` |
| PATCH  | `/user-devices/:id`                 | auth   | `name`, `firmwareId`                              |
| DELETE | `/user-devices/:id`                 | auth   | Also deletes its readings                         |
| POST   | `/user-devices/:id/rotate-key`      | auth   | Returns `{ userDevice, apiKey }`                  |
| GET    | `/user-devices/:id/readings`        | auth   | `?from=&to=&limit=` (ISO dates, default last 7 days; limit 1–1000, default 100), newest first |
| POST   | `/ingest`                           | device key | Header `X-Device-Key`, body is any JSON object |

Notes:

- A user device of another user returns `404`, not `403`, so nobody can find out which ids exist.
- The API key is shown only once (on create and rotate). Only its SHA-256 hash is stored.
- `firmwareId` must be a firmware of the same catalog device, otherwise `400`.

Example device request:

```sh
curl -X POST http://localhost:3000/api/ingest \
  -H 'Content-Type: application/json' \
  -H 'X-Device-Key: <apiKey>' \
  -d '{"temperature": 21.5, "humidity": 40}'
```

## Project structure

```
src/
  app.js          Express app: middleware, routers, 404, error handler
  server.js       starts the server, graceful shutdown on SIGTERM / SIGINT
  db.js           the one Sequelize instance
  errors.js       HttpError(status, message)
  db/             config, models, migrations, seeders
  middleware/     authenticate, require-admin, validate-id, error-handler, not-found, request-logger
  routes/         one router per resource: validate → call service → respond
  validators/     one file per resource; throw HttpError(400) and return allowed fields only
  services/       business logic and database access
  utils/          crypto, jwt, logger
api/openapi.yaml  OpenAPI 3 spec served at /docs
test/             unit tests (validators, utils, middleware) and HTTP tests without a database
```
