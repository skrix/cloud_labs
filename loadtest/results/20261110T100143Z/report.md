# Load test report

- Target: http://iot-hub-alb-1166736911.eu-north-1.elb.amazonaws.com
- Profile: ramp 0→60 VUs in 3m, 5m at 60 VUs, ramp down in 2m
- Stats period: 30 days (seeded history ≈ 1440 readings per device)
- Finished: 2026-11-10T10:11:51.527Z

| Metric | Value |
|---|---|
| Requests | 68300 |
| Throughput | 112.3 req/s |
| Iterations (1 write + 9 reads) | 6830 |
| Error rate | 0.01 % |
| Latency p50 | 98 ms |
| Latency p95 | 392 ms |
| Latency p99 | 575 ms |
| Latency max | 1996 ms |

| Endpoint | p50 | p95 | p99 |
|---|---|---|---|
| `POST /ingest` | 198 ms | 525 ms | 764 ms |
| `GET /user-devices/:id/readings/:readingId` | 121 ms | 413 ms | 597 ms |
| `GET /user-devices/:id/readings` | 121 ms | 410 ms | 576 ms |
| `GET /user-devices/:id/readings/stats` | 159 ms | 462 ms | 682 ms |
| `GET /user-devices/:id` | 80 ms | 273 ms | 394 ms |
| `GET /user-devices` | 77 ms | 262 ms | 373 ms |
| `GET /devices/:id` | 76 ms | 267 ms | 383 ms |
| `GET /devices` | 76 ms | 259 ms | 363 ms |
| `GET /firmwares?deviceId=` | 77 ms | 268 ms | 378 ms |
