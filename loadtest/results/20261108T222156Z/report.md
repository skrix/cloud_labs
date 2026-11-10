# Load test report

- Target: http://iot-hub-alb-70644457.eu-north-1.elb.amazonaws.com
- Profile: ramp 0→40 VUs in 3m, 5m at 40 VUs, ramp down in 2m
- Finished: 2026-11-08T22:32:07.450Z

| Metric | Value |
|---|---|
| Requests | 63179 |
| Throughput | 103.5 req/s |
| Iterations (1 write + 9 reads) | 6313 |
| Error rate | 0.00 % |
| Latency p50 | 33 ms |
| Latency p95 | 39 ms |
| Latency p99 | 65 ms |
| Latency max | 1144 ms |

| Endpoint | p50 | p95 | p99 |
|---|---|---|---|
| `POST /ingest` | 35 ms | 42 ms | 73 ms |
| `GET /user-devices/:id/readings/:readingId` | 33 ms | 38 ms | 66 ms |
| `GET /user-devices/:id/readings` | 34 ms | 40 ms | 67 ms |
| `GET /user-devices/:id` | 33 ms | 38 ms | 65 ms |
| `GET /user-devices` | 33 ms | 38 ms | 62 ms |
| `GET /devices/:id` | 32 ms | 38 ms | 61 ms |
| `GET /devices` | 32 ms | 37 ms | 58 ms |
| `GET /firmwares?deviceId=` | 32 ms | 37 ms | 61 ms |
