# Load test report

- Target: http://iot-hub-alb-1166736911.eu-north-1.elb.amazonaws.com
- Profile: ramp 0→100 VUs in 3m, 5m at 100 VUs, ramp down in 2m
- History: 1440 readings per device (uploaded in setup, not measured)
- Finished: 2026-11-10T17:28:08.869Z

| Metric | Value |
|---|---|
| Requests | 113470 |
| Throughput | 174.3 req/s |
| Iterations (1 write + 9 reads) | 11347 |
| Stats cache hits | cache off |
| Error rate | 0.00 % |
| Latency p50 | 117 ms |
| Latency p95 | 371 ms |
| Latency p99 | 519 ms |
| Latency max | 2519 ms |

| Endpoint | p50 | p95 | p99 |
|---|---|---|---|
| `POST /ingest` | 209 ms | 460 ms | 685 ms |
| `GET /user-devices/:id/readings/:readingId` | 160 ms | 403 ms | 579 ms |
| `GET /user-devices/:id/readings` | 160 ms | 398 ms | 593 ms |
| `GET /user-devices/:id/readings/stats` | 172 ms | 407 ms | 608 ms |
| `GET /user-devices/:id` | 95 ms | 248 ms | 346 ms |
| `GET /user-devices` | 95 ms | 248 ms | 358 ms |
| `GET /devices/:id` | 93 ms | 246 ms | 360 ms |
| `GET /devices` | 93 ms | 244 ms | 354 ms |
| `GET /firmwares?deviceId=` | 94 ms | 244 ms | 364 ms |
