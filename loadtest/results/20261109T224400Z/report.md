# Load test report

- Target: http://iot-hub-alb-539378006.eu-north-1.elb.amazonaws.com
- Profile: ramp 0→40 VUs in 3m, 5m at 40 VUs, ramp down in 2m
- Finished: 2026-11-09T22:54:15.138Z

| Metric | Value |
|---|---|
| Requests | 62359 |
| Throughput | 101.6 req/s |
| Iterations (1 write + 9 reads) | 6231 |
| Error rate | 0.00 % |
| Latency p50 | 35 ms |
| Latency p95 | 45 ms |
| Latency p99 | 78 ms |
| Latency max | 1402 ms |

| Endpoint | p50 | p95 | p99 |
|---|---|---|---|
| `POST /ingest` | 40 ms | 53 ms | 108 ms |
| `GET /user-devices/:id/readings/:readingId` | 35 ms | 44 ms | 78 ms |
| `GET /user-devices/:id/readings` | 36 ms | 47 ms | 83 ms |
| `GET /user-devices/:id` | 34 ms | 43 ms | 70 ms |
| `GET /user-devices` | 34 ms | 43 ms | 76 ms |
| `GET /devices/:id` | 34 ms | 42 ms | 70 ms |
| `GET /devices` | 33 ms | 42 ms | 73 ms |
| `GET /firmwares?deviceId=` | 33 ms | 42 ms | 72 ms |
