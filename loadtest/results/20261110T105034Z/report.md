# Load test report

- Target: http://iot-hub-alb-1166736911.eu-north-1.elb.amazonaws.com
- Profile: ramp 0→100 VUs in 3m, 5m at 100 VUs, ramp down in 2m
- History: 1440 readings per device (uploaded in setup, not measured)
- Finished: 2026-11-10T11:01:28.539Z

| Metric | Value |
|---|---|
| Requests | 85780 |
| Throughput | 131.2 req/s |
| Iterations (1 write + 9 reads) | 8578 |
| Error rate | 0.00 % |
| Latency p50 | 254 ms |
| Latency p95 | 599 ms |
| Latency p99 | 872 ms |
| Latency max | 4566 ms |

| Endpoint | p50 | p95 | p99 |
|---|---|---|---|
| `POST /ingest` | 449 ms | 695 ms | 1152 ms |
| `GET /user-devices/:id/readings/:readingId` | 385 ms | 622 ms | 1072 ms |
| `GET /user-devices/:id/readings` | 388 ms | 627 ms | 1053 ms |
| `GET /user-devices/:id/readings/stats` | 403 ms | 634 ms | 1089 ms |
| `GET /user-devices/:id` | 210 ms | 381 ms | 608 ms |
| `GET /user-devices` | 210 ms | 384 ms | 603 ms |
| `GET /devices/:id` | 210 ms | 385 ms | 610 ms |
| `GET /devices` | 206 ms | 384 ms | 609 ms |
| `GET /firmwares?deviceId=` | 208 ms | 387 ms | 635 ms |
