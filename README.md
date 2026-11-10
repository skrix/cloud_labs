# IoT Hub API

REST API for registering ESP32 devices and collecting sensor readings.

Public URL: http://iot-hub-alb-2082221416.eu-north-1.elb.amazonaws.com
(API docs: [`/docs`](http://iot-hub-alb-2082221416.eu-north-1.elb.amazonaws.com/docs))

## Run with Docker

```sh
cp .env.example .env    # set POSTGRES_PASSWORD, JWT_SECRET
docker compose up --build
```
API on http://localhost:3000

## Run locally

```sh
npm install
cp .env.example .env    # set ADMIN_EMAIL, ADMIN_PASSWORD
npm run db:setup        # migrations + seeds
npm run dev
```

API docs: http://localhost:3000/docs

| Script                        | Description               |
|-------------------------------|---------------------------|
| `npm start` / `npm run dev`   | Start / start with watch  |
| `npm run db:migrate[:undo]`   | Run / undo migrations     |
| `npm run db:seed[:undo]`      | Add / remove admin, catalog and demo data |
| `npm run db:setup`            | Migrations + all seeds, each once per database (run on ECS task start) |
| `npm run lint`                | ESLint                    |
| `npm run db:test:create`      | Create the test database (once) |
| `npm test`                    | Migrate the test database and run tests |
| `npm run loadtest`            | k6 load test ([docs/LOADTEST.md](docs/LOADTEST.md)) |

## Environment

```
PGHOST
PGPORT # 5432
PGUSER
PGPASSWORD
PGDATABASE
JWT_SECRET
ADMIN_EMAIL    # catalog seeder
ADMIN_PASSWORD # catalog seeder
REDIS_URL      # cache for readings stats, e.g. redis://localhost:6379 (unset: no cache)
CACHE_ENABLED  # true
CACHE_TTL_SECONDS # 60
PORT # 3000
NODE_ENV
```

## Demo users

| Email               | Password     | Role  | Device API keys                        |
|---------------------|--------------|-------|----------------------------------------|
| `ADMIN_EMAIL` (.env) | `ADMIN_PASSWORD` (.env) | admin |                              |
| `alice@example.com` | `alice12345` | user  | `demo-key-kitchen`, `demo-key-balcony` |
| `bob@example.com`   | `bob12345`   | user  | `demo-key-garage`                      |

## Admin and catalog on AWS

The ECS task runs `npm run db:setup` (migrations + all seeds) before the server starts. Like
migrations, each seeder runs once per database: executed seeders are recorded in the
`SequelizeData` table, so later task starts (deploys, autoscaling) skip them.
The admin credentials are `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env`; `terraform apply` reads
them from there into SSM parameters, and the task gets them as secrets.

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
| `GET /user-devices/:id/readings/stats?from=&to=&bucket=` | owner   |
| `GET /user-devices/:id/readings/:readingId`       | owner          |
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
| `autoscaling_min` / `autoscaling_max` | `1` / `4` | API task count range ([docs/AUTOSCALING.md](docs/AUTOSCALING.md)) |
| `autoscaling_cpu_target` | `70` | Target average CPU, %                |
| `autoscaling_scale_out_cooldown` / `autoscaling_scale_in_cooldown` | `60` / `300` | Cooldowns, s |
| `alert_latency_p95_ms` / `alert_latency_minutes` | `500` / `2` | Overload email alert ([docs/ALERTS.md](docs/ALERTS.md)) |
| `cache_enabled` / `cache_ttl_seconds` | `true` / `60` | Redis cache for readings stats ([docs/CACHE.md](docs/CACHE.md)) |

### Continuous deployment

Set these GitHub repository variables from `terraform output`:

| Variable          | Value                  |
|-------------------|------------------------|
| `AWS_ROLE_ARN`    | `github_role_arn`      |
| `AWS_REGION`      | Terraform `region`     |
| `ECR_REPOSITORY`  | `ecr_repository`       |
| `ECS_CLUSTER`     | `ecs_cluster`          |
| `ECS_SERVICE`     | `ecs_service`          |
| `ECS_TASK_FAMILY` | `ecs_task_family`      |

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
loadtest/             k6 load test
docs/                 lab reports
deploy/aws/terraform/ AWS infrastructure
.github/workflows/    CI and CD
Dockerfile
compose.yaml
```
