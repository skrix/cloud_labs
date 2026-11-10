# Load test report

- Target: http://iot-hub-alb-1166736911.eu-north-1.elb.amazonaws.com
- Profile: ramp 0→100 VUs in 3m, 5m at 100 VUs, ramp down in 2m
- History: 1440 readings per device (uploaded in setup, not measured)
- Finished: 2026-11-10T16:35:29.123Z

| Metric | Value |
|---|---|
| Requests | 97210 |
| Throughput | 145.9 req/s |
| Iterations (1 write + 9 reads) | 9721 |
| Stats cache hits | 92.1 % |
| Error rate | 0.00 % |
| Latency p50 | 184 ms |
| Latency p95 | 537 ms |
| Latency p99 | 759 ms |
| Latency max | 2973 ms |

| Endpoint | p50 | p95 | p99 |
|---|---|---|---|
| `POST /ingest` | 335 ms | 643 ms | 1006 ms |
| `GET /user-devices/:id/readings/:readingId` | 268 ms | 581 ms | 921 ms |
| `GET /user-devices/:id/readings` | 279 ms | 589 ms | 951 ms |
| `GET /user-devices/:id/readings/stats` | 185 ms | 487 ms | 717 ms |
| `GET /user-devices/:id` | 160 ms | 352 ms | 560 ms |
| `GET /user-devices` | 159 ms | 345 ms | 521 ms |
| `GET /devices/:id` | 160 ms | 349 ms | 562 ms |
| `GET /devices` | 156 ms | 349 ms | 560 ms |
| `GET /firmwares?deviceId=` | 156 ms | 340 ms | 543 ms |
