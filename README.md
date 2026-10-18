# IoT Hub API

REST API for registering ESP32 devices and collecting sensor readings.

## Run

```sh
npm install
npm run db:migrate
npm run db:seed    # optional demo data
npm run dev
```

API docs: http://localhost:3000/docs

| Script                        | Description               |
|-------------------------------|---------------------------|
| `npm start` / `npm run dev`   | Start / start with watch  |
| `npm run db:migrate[:undo]`   | Run / undo migrations     |
| `npm run db:seed[:undo]`      | Add / remove demo data    |
| `npm run lint`                | ESLint                    |
| `npm test`                    | Tests (no database)       |

## Environment

`PGHOST`, `PGPORT` (5432), `PGUSER`, `PGPASSWORD`, `PGDATABASE`, `JWT_SECRET`, `PORT` (3000), `NODE_ENV`.

## Demo users

| Email               | Password     | Role  | Device API keys                        |
|---------------------|--------------|-------|----------------------------------------|
| `admin@example.com` | `admin12345` | admin |                                        |
| `alice@example.com` | `alice12345` | user  | `demo-key-kitchen`, `demo-key-balcony` |
| `bob@example.com`   | `bob12345`   | user  | `demo-key-garage`                      |

## Promote an admin

```sql
UPDATE "Users" SET role = 'admin' WHERE email = 'someone@example.com';
```

## Endpoints

All under `/api`.

| Endpoint                                          | Access         |
|---------------------------------------------------|----------------|
| `GET /health`, `GET /health/db`                   | public         |
| `POST /auth/signup`, `POST /auth/signin`          | public         |
| `GET /devices`, `GET /devices/:id`                | user           |
| `POST /devices`, `PATCH`/`DELETE /devices/:id`    | admin          |
| `GET /firmwares?deviceId=`, `GET /firmwares/:id`  | user           |
| `POST /firmwares`, `PATCH`/`DELETE /firmwares/:id`| admin          |
| `GET`/`POST /user-devices`                        | owner          |
| `GET`/`PATCH`/`DELETE /user-devices/:id`          | owner          |
| `POST /user-devices/:id/rotate-key`               | owner          |
| `GET /user-devices/:id/readings?from=&to=&limit=` | owner          |
| `POST /ingest`                                    | `X-Device-Key` |
