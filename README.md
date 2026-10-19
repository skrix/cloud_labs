# IoT Hub API

REST API for registering ESP32 devices and collecting sensor readings.

## Run

```sh
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

API docs: http://localhost:3000/docs

| Script                        | Description               |
|-------------------------------|---------------------------|
| `npm start` / `npm run dev`   | Start / start with watch  |
| `npm run db:migrate[:undo]`   | Run / undo migrations     |
| `npm run db:seed[:undo]`      | Add / remove demo data    |
| `npm run lint`                | ESLint                    |
| `npm run db:test:create`      | Create the test database (once) |
| `npm test`                    | Migrate the test database and run tests |

## Environment

```
PGHOST
PGPORT # 5432
PGUSER
PGPASSWORD
PGDATABASE
JWT_SECRET
PORT # 3000
NODE_ENV
```

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

## Deploy to AWS

```sh
cd deploy/aws/terraform
cp terraform.tfvars.example terraform.tfvars  # set budget_email, github_repo
terraform init
terraform apply                               # also builds and pushes the image
terraform output url
```

| Variable       | Default        | Description                             |
|----------------|----------------|-----------------------------------------|
| `region`       | `eu-central-1` | AWS region                              |
| `project`      | `iot-hub`      | Name prefix for resources               |
| `github_repo`  |                | `owner/repo` allowed to deploy          |
| `budget_email` |                | Budget alert recipient                  |
| `image_tag`    | `latest`       | Image tag built and run by Terraform    |

## Structure

```
src/
  app.js, server.js   Express app / HTTP server with graceful shutdown
  routes/             one router per resource
  validators/         request validation
  services/           business logic
  middleware/         auth, errors, logging
  db/                 config, models, migrations, seeders
  utils/              crypto, jwt, logger
api/openapi.yaml      OpenAPI spec for /docs
test/                 unit and API tests
deploy/aws/terraform/ AWS infrastructure
.github/workflows/    CI and CD
Dockerfile
compose.yaml
```
